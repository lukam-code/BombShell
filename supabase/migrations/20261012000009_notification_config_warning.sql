-- get_notification_config: greške Vault-a se beleže upozorenjem (ranije su tiho ignorisane)
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
  raise warning 'get_notification_config: Vault nije dostupan: %', sqlerrm;
  return '{}'::jsonb;
end;
$$;

revoke execute on function public.get_notification_config() from public, anon, authenticated;
grant execute on function public.get_notification_config() to service_role;
