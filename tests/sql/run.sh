#!/usr/bin/env bash
# Primenjuje migracije na praznu lokalnu bazu i pokreće SQL testove.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-bombshell_test}
PSQL="sudo -u postgres psql -v ON_ERROR_STOP=1 -q"
$PSQL -c "drop database if exists $DB" -c "create database $DB" >/dev/null
$PSQL -d $DB -f tests/sql/00_supabase_shim.sql >/dev/null
for f in supabase/migrations/*.sql; do $PSQL -d $DB -f "$f" >/dev/null 2>&1 || { echo "Migracija nije uspela: $f"; $PSQL -d $DB -f "$f"; exit 1; }; done
$PSQL -d $DB -f tests/sql/10_booking_tests.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  //'
