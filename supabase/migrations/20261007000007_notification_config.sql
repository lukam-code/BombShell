-- =====================================================================
-- BOMBSHELL – podešavanja obaveštenja iz Supabase Vault-a
-- Edge Functions čitaju ključeve iz Edge secrets, a ako ih tamo nema –
-- iz Vault-a preko ove funkcije (dostupna SAMO service_role ulozi).
-- Tako se SMS/email mogu podesiti i samo SQL-om:
--   select vault.create_secret('re_...', 'resend_api_key');
-- =====================================================================

create or replace function public.get_notification_config()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_config jsonb;
begin
  select coalesce(jsonb_object_agg(s.name, s.decrypted_secret), '{}'::jsonb)
    into v_config
  from vault.decrypted_secrets s
  where s.name in (
    'notify_secret', 'site_url', 'salon_notification_email',
    'resend_api_key', 'resend_from_email',
    'infobip_api_key', 'infobip_base_url', 'infobip_sms_sender',
    'infobip_viber_sender', 'infobip_viber_sms_failover'
  );
  return v_config;
exception when others then
  return '{}'::jsonb;
end;
$$;

revoke execute on function public.get_notification_config() from public, anon, authenticated;
grant execute on function public.get_notification_config() to service_role;
