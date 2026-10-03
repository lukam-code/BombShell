-- Lokalna imitacija pg_net + Vault: http_post samo beleži poziv u net.calls,
-- a tests/integration/notifications.mjs ga zatim izvršava ka lokalnim Edge Functions.
create schema if not exists vault;
create table if not exists vault.decrypted_secrets (name text primary key, decrypted_secret text);
insert into vault.decrypted_secrets values ('project_url', 'http://localhost:54321'), ('notify_secret', 'test-webhook-secret')
  on conflict (name) do update set decrypted_secret = excluded.decrypted_secret;

create schema if not exists net;
create table if not exists net.calls (id bigserial primary key, url text, body jsonb, headers jsonb, processed boolean default false);
create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds integer default 5000)
returns bigint language sql as $$
  insert into net.calls (url, body, headers) values (url, body, headers) returning id
$$;
