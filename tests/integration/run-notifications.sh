#!/usr/bin/env bash
# Pokreće Edge Functions lokalno (Deno) i integracioni test obaveštenja.
set -euo pipefail
cd "$(dirname "$0")/../.."
DENO=${DENO_BIN:-deno}
DB=${DEV_DB:-bombshell}
sudo -u postgres psql -q -d $DB -f tests/sql/20_pgnet_vault_shim.sql >/dev/null
SERVICE_KEY=$(node -e 'import("./tests/local-stack/jwt.mjs").then(m=>process.stdout.write(m.sign({role:"service_role",iat:1700000000,exp:2000000000})))')
export SUPABASE_URL=http://localhost:54321 SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY NOTIFY_WEBHOOK_SECRET=test-webhook-secret \
  SITE_URL=http://localhost:3000 INFOBIP_API_KEY=test INFOBIP_BASE_URL=http://localhost:9999 INFOBIP_VIBER_SENDER=Bombshell \
  SALON_NOTIFICATION_EMAIL=salon@example.com
pids=()
port=9001
for fn in send-customer-notification send-email-notification send-reminders; do
  DENO_SERVE_ADDRESS=tcp:127.0.0.1:$port $DENO run --quiet --allow-net --allow-env supabase/functions/$fn/index.ts > /tmp/fn-$fn.log 2>&1 &
  pids+=($!); port=$((port+1))
done
trap 'kill ${pids[@]} 2>/dev/null || true' EXIT
pkill -f "local-stack/[p]roxy.mjs" || true
FUNCTIONS_PORTS="send-customer-notification=9001,send-email-notification=9002,send-reminders=9003" nohup node tests/local-stack/proxy.mjs > /tmp/proxy.log 2>&1 &
sleep 4
node tests/integration/notifications.mjs
