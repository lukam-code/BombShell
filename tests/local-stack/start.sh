#!/usr/bin/env bash
# Pokreće lokalni test-stack: sveža baza + migracije + PostgREST + proxy.
set -euo pipefail
cd "$(dirname "$0")/../.."
PGRST_BIN=${PGRST_BIN:-postgrest}
DB=${DEV_DB:-bombshell}
PSQL="sudo -u postgres psql -v ON_ERROR_STOP=1 -q"
$PSQL -c "drop database if exists $DB with (force)" -c "create database $DB" >/dev/null
$PSQL -d $DB -f tests/sql/00_supabase_shim.sql >/dev/null
for f in supabase/migrations/*.sql; do $PSQL -d $DB -f "$f" >/dev/null 2>&1; done
$PSQL -d $DB >/dev/null <<SQL
do \$\$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login password 'authpass' noinherit;
  end if;
end \$\$;
grant anon, authenticated, service_role to authenticator;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a001', 'admin@bombshell.rs') on conflict do nothing;
insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-00000000a001') on conflict do nothing;
SQL
SECRET=$(node -e 'import("./tests/local-stack/jwt.mjs").then(m=>process.stdout.write(m.JWT_SECRET))')
cat > /tmp/pgrst.conf <<CONF
db-uri = "postgres://authenticator:authpass@127.0.0.1:5432/$DB"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-port = 3001
server-host = "127.0.0.1"
CONF
pkill -f "[p]ostgrest /tmp/pgrst.conf" 2>/dev/null || true
pkill -f "local-stack/[p]roxy.mjs" 2>/dev/null || true
sleep 1
nohup "$PGRST_BIN" /tmp/pgrst.conf > /tmp/pgrst.log 2>&1 &
nohup node tests/local-stack/proxy.mjs > /tmp/proxy.log 2>&1 &
sleep 2
node -e 'import("./tests/local-stack/jwt.mjs").then(m=>console.log("NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321\nNEXT_PUBLIC_SUPABASE_ANON_KEY="+m.ANON_KEY))'
