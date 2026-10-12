#!/usr/bin/env bash
# Resetuje lokalnu test bazu (bez pokretanja PostgREST-a/proxy-ja – oni se pokreću posebno).
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${DEV_DB:-bombshell}
PSQL="sudo -u postgres psql -v ON_ERROR_STOP=1 -q"
$PSQL -c "drop database if exists $DB with (force)" -c "create database $DB" >/dev/null
$PSQL -d $DB -f tests/sql/00_supabase_shim.sql >/dev/null
for f in supabase/migrations/*.sql; do $PSQL -d $DB -f "$f" >/dev/null 2>&1; done
$PSQL -d $DB >/dev/null 2>&1 <<'SQL'
do $$ begin if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login password 'authpass' noinherit; end if; end $$;
grant anon, authenticated, service_role to authenticator;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a001', 'admin@bombshell.rs') on conflict do nothing;
insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-00000000a001') on conflict do nothing;
SQL
sudo -u postgres psql -d $DB -qc "notify pgrst, 'reload schema'" >/dev/null 2>&1 || true
echo "baza $DB spremna: $(sudo -u postgres psql -d $DB -tAc 'select count(*) from services') usluga"
