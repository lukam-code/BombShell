-- =====================================================================
-- BOMBSHELL – automatsko pokretanje Edge Functions za obaveštenja
--
-- Trigeri šalju asinhroni HTTP poziv (pg_net) ka Edge Functions. Poziv se
-- izvršava tek nakon COMMIT-a, pa obaveštenja NIKAD ne blokiraju zakazivanje.
-- Potrebne tajne u Supabase Vault-u (vidi README):
--   project_url    npr. https://xxxx.supabase.co
--   notify_secret  isti nasumični string kao NOTIFY_WEBHOOK_SECRET u Edge secrets
-- Ako pg_net ili tajne nisu podešeni, trigeri se tiho preskaču.
-- =====================================================================

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  else
    raise notice 'pg_net nije dostupan – obaveštenja se neće automatski slati.';
  end if;
end $$;

create or replace function public.invoke_edge_function(p_function text, p_payload jsonb)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_url     text;
  v_secret  text;
begin
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url' limit 1;
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_secret' limit 1;
  exception when others then
    raise warning 'Vault nije dostupan: %', sqlerrm;
    return;
  end;

  if v_url is null or v_secret is null then
    raise warning 'Obaveštenja nisu podešena (project_url / notify_secret u Vault-u).';
    return;
  end if;

  begin
    perform net.http_post(
      url     := rtrim(v_url, '/') || '/functions/v1/' || p_function,
      body    := p_payload,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
      timeout_milliseconds := 10000
    );
  exception when others then
    -- Nikada ne obaraj transakciju zbog obaveštenja
    raise warning 'Poziv Edge Function % nije uspeo: %', p_function, sqlerrm;
  end;
end;
$$;

revoke execute on function public.invoke_edge_function(text, jsonb) from public, anon, authenticated;

-- Novi termin / otkazan termin -------------------------------------------
create or replace function public.bookings_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_source         text := coalesce(nullif(current_setting('bombshell.source', true), ''), 'online');
  v_skip_customer  boolean := coalesce(current_setting('bombshell.skip_customer_notifications', true), 'off') = 'on';
begin
  if tg_op = 'INSERT' then
    if not v_skip_customer then
      perform public.invoke_edge_function('send-customer-notification',
        jsonb_build_object('booking_id', new.id, 'type', 'confirmation'));
    end if;
    perform public.invoke_edge_function('send-email-notification',
      jsonb_build_object('booking_id', new.id, 'type', 'booking_created',
                         'notify_salon', v_source <> 'admin', 'notify_customer', not v_skip_customer));
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    perform public.invoke_edge_function('send-customer-notification',
      jsonb_build_object('booking_id', new.id, 'type', 'cancellation'));
    perform public.invoke_edge_function('send-email-notification',
      jsonb_build_object('booking_id', new.id, 'type', 'booking_cancelled'));
  end if;
  return null;
end;
$$;

create trigger bookings_notify_insert
  after insert on public.bookings
  for each row execute function public.bookings_notify();

create trigger bookings_notify_update
  after update of status on public.bookings
  for each row execute function public.bookings_notify();

-- Nova recenzija čeka odobrenje -----------------------------------------
create or replace function public.reviews_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not new.is_approved then
    perform public.invoke_edge_function('send-email-notification',
      jsonb_build_object('review_id', new.id, 'type', 'review_created'));
  end if;
  return null;
end;
$$;

create trigger reviews_notify_insert
  after insert on public.reviews
  for each row execute function public.reviews_notify();

revoke execute on function public.bookings_notify(), public.reviews_notify() from public, anon, authenticated;
