-- =====================================================================
-- BOMBSHELL – pg_cron posao za podsetnike (svakih 15 minuta)
-- Poziva Edge Function "send-reminders", koja šalje podsetnike za termine
-- koji počinju za 23–25h. Ako pg_cron nije dostupan, uključite ga u
-- Dashboard → Database → Extensions i ponovo pokrenite ovaj blok (README, korak 3).
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron nije dostupan – podsetnici se neće automatski slati.';
    return;
  end if;

  create extension if not exists pg_cron;

  if exists (select 1 from cron.job where jobname = 'bombshell-send-reminders') then
    perform cron.unschedule('bombshell-send-reminders');
  end if;

  perform cron.schedule(
    'bombshell-send-reminders',
    '*/15 * * * *',
    $cmd$ select public.invoke_edge_function('send-reminders', '{}'::jsonb) $cmd$
  );
end $$;
