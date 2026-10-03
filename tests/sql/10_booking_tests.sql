-- Testovi poslovnih pravila i bezbednosti. Pokretanje: npm run test:db
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create or replace function pg_temp.expect_error(p_sql text, p_code text, p_label text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL [%]: očekivana greška %, a upit je uspeo', p_label, p_code;
exception when others then
  if sqlstate <> p_code then
    raise exception 'FAIL [%]: očekivano %, dobijeno % (%)', p_label, p_code, sqlstate, sqlerrm;
  end if;
  raise notice 'OK   [%] → % %', p_label, sqlstate, sqlerrm;
end $$;

create or replace function pg_temp.ok(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_cond, false) then raise exception 'FAIL [%]', p_label; end if;
  raise notice 'OK   [%]', p_label;
end $$;

-- Pomoćni podaci ----------------------------------------------------------
create temp table ctx as
select
  (select id from public.services where name = 'Šišanje') as svc45,
  (select id from public.services where name = 'Farbanje') as svc120,
  -- ponedeljak sledeće nedelje (uvek > 24h unapred, < 60 dana)
  (date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '7 days')::date as mon,
  (date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '13 days')::date as sun,
  (date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '8 days')::date as tue_blocked;
grant select on ctx to anon, authenticated;
insert into public.blocked_dates (date, reason) select tue_blocked, 'Test praznik' from ctx;

create or replace function pg_temp.at(d date, t text) returns timestamptz language sql as $$
  select (d + t::time) at time zone 'Europe/Belgrade'
$$;

-- =====================================================================
-- PostgREST postavlja JWT claims za svaki zahtev; ovde ih imitiramo.
select set_config('request.jwt.claims', '{"role":"anon"}', false);
set role anon;

-- Slobodni termini ---------------------------------------------------------
select pg_temp.ok((select count(*) from public.get_available_slots((select svc45 from ctx), (select mon from ctx))) = 46,
  'ponedeljak: 46 slotova po 15 min za uslugu od 45 min (09:00–20:15)');
select pg_temp.ok((select min(label) from public.get_available_slots((select svc45 from ctx), (select mon from ctx))) = '09:00', 'prvi slot 09:00');
select pg_temp.ok((select max(label) from public.get_available_slots((select svc45 from ctx), (select mon from ctx))) = '20:15', 'poslednji slot 20:15 (završava u 21:00)');
select pg_temp.ok((select max(label) from public.get_available_slots((select svc120 from ctx), (select mon from ctx))) = '19:00', 'farbanje 120 min: poslednji slot 19:00');
select pg_temp.ok((select count(*) from public.get_available_slots((select svc45 from ctx), (select sun from ctx))) = 0, 'nedelja: nema slotova');
select pg_temp.ok((select count(*) from public.get_available_slots((select svc45 from ctx), (select tue_blocked from ctx))) = 0, 'blokiran datum: nema slotova');
select pg_temp.ok((select count(*) from public.get_available_slots((select svc45 from ctx), current_date - 1)) = 0, 'prošli datum: nema slotova');
select pg_temp.ok((select count(*) from public.get_available_slots((select svc45 from ctx), current_date + 61)) = 0, 'više od 60 dana: nema slotova');
select pg_temp.ok((select count(*) from public.get_available_slots((select svc45 from ctx), current_date)) = 0
  or (select min(start_time) from public.get_available_slots((select svc45 from ctx), current_date)) >= now() + interval '2 hours',
  'danas: nema slotova za manje od 2h');
select pg_temp.ok(exists (select 1 from public.get_closed_dates(current_date, current_date + 14) where date = (select sun from ctx)), 'get_closed_dates sadrži nedelju');
select pg_temp.ok(exists (select 1 from public.get_closed_dates(current_date, current_date + 14) where date = (select tue_blocked from ctx)), 'get_closed_dates sadrži blokiran datum');

-- Zakazivanje ----------------------------------------------------------------
create temp table t_booking as
select * from public.create_booking((select svc45 from ctx), pg_temp.at((select mon from ctx), '10:00'),
  'Jelena Marković', '+381641234567', 'jelena@example.com', 'Prvi dolazak', true, null);
select pg_temp.ok((select count(*) from t_booking) = 1 and (select cancel_token from t_booking) is not null, 'create_booking vraća id i cancel_token');
select pg_temp.ok(not exists (select 1 from public.get_available_slots((select svc45 from ctx), (select mon from ctx)) where label in ('09:30','09:45','10:00','10:15','10:30')),
  'zauzeti i preklapajući slotovi se više ne nude');
select pg_temp.ok(exists (select 1 from public.get_available_slots((select svc45 from ctx), (select mon from ctx)) where label in ('09:15','10:45')), 'susedni slotovi su i dalje slobodni');

select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '10:00')), 'BS409', 'dupli termin – isto vreme');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc120 from ctx), pg_temp.at((select mon from ctx), '09:00')), 'BS409', 'preklapanje – farbanje 09:00–11:00');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '20:30')), 'BS422', 'van radnog vremena – završava posle 21h');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '08:00')), 'BS422', 'van radnog vremena – pre 09h');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select sun from ctx), '10:00')), 'BS422', 'nedelja');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select tue_blocked from ctx), '10:00')), 'BS422', 'blokiran datum');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), date_trunc('hour', now()) + interval '1 hour'), 'BS422', 'manje od 2h unapred');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at(current_date + 62, '10:00')), 'BS422', 'više od 60 dana unapred');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '+381651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '11:10')), 'BS400', 'vreme van 15-min mreže');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Ana Anić', '0651111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '12:00')), 'BS400', 'telefon nije E.164');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Bot Botić', '+381651111111', null, null, true, 'http://spam')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '12:00')), 'BS400', 'honeypot');

-- Limit 3 aktivna buduća termina po telefonu
select * from public.create_booking((select svc45 from ctx), pg_temp.at((select mon from ctx), '12:00'), 'Mila Milić', '+381609999999');
select * from public.create_booking((select svc45 from ctx), pg_temp.at((select mon from ctx), '13:00'), 'Mila Milić', '+381609999999');
select * from public.create_booking((select svc45 from ctx), pg_temp.at((select mon from ctx), '14:00'), 'Mila Milić', '+381609999999');
select pg_temp.expect_error(format($q$select * from public.create_booking(%L, %L, 'Mila Milić', '+381609999999')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '15:00')), 'BS429', '4. aktivni termin sa istog broja');

-- Privatnost: anonimni NE mogu da čitaju termine niti neodobrene recenzije ----
select pg_temp.expect_error('select * from public.bookings', '42501', 'anon SELECT bookings');
select pg_temp.expect_error($q$insert into public.bookings (service_id, customer_name, customer_phone, start_time, end_time) values (gen_random_uuid(), 'x', '+381641111111', now(), now())$q$, '42501', 'anon INSERT bookings');
select pg_temp.expect_error($q$update public.bookings set status = 'cancelled'$q$, '42501', 'anon UPDATE bookings');
select pg_temp.expect_error('select * from public.notification_log', '42501', 'anon SELECT notification_log');
select pg_temp.expect_error('select public.claim_due_reminders()', '42501', 'anon ne može da poziva claim_due_reminders');
select pg_temp.expect_error($q$select public.invoke_edge_function('x', '{}')$q$, '42501', 'anon ne može da poziva invoke_edge_function');
select pg_temp.expect_error(format($q$select * from public.admin_create_booking(%L, %L, 'X Y', '+381641111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '16:00')), '42501', 'anon ne može admin_create_booking');

-- Recenzije
insert into public.reviews (customer_name, rating, text) values ('Ivana Petrović', 5, 'Divan salon, sve preporuke!');
select pg_temp.ok((select count(*) from public.reviews) = 0, 'anon ne vidi neodobrene recenzije');
-- pokušaj da se recenzija odmah objavi: trigger je upisuje kao neodobrenu
insert into public.reviews (customer_name, rating, text, is_approved) values ('Hak Er', 5, 'Odmah objavljeno?', true);
select pg_temp.ok((select count(*) from public.reviews) = 0, 'anon ne može da objavi odobrenu recenziju (upisana kao neodobrena)');
select pg_temp.expect_error('select customer_name from public.reviews', '42501', 'anon ne vidi puno ime (kolona customer_name)');
select pg_temp.expect_error($q$insert into public.reviews (customer_name, rating, text) values ('Test Test', 6, 'Ocena van opsega')$q$, '23514', 'ocena mora biti 1–5');
insert into public.reviews (customer_name, rating, text) values ('A Aa', 4, 'Druga recenzija ok');
insert into public.reviews (customer_name, rating, text) values ('B Bb', 4, 'Treća recenzija ok');
insert into public.reviews (customer_name, rating, text) values ('C Cc', 4, 'Četvrta recenzija ok');
select pg_temp.expect_error($q$insert into public.reviews (customer_name, rating, text) values ('E Ee', 4, 'Šesta u istom satu')$q$, 'BS429', 'više od 5 recenzija u sat vremena');

-- Otkazivanje --------------------------------------------------------------
select pg_temp.ok((select can_cancel from public.get_booking_by_token((select cancel_token from t_booking))), 'get_booking_by_token: može da se otkaže (>24h)');
select pg_temp.ok((select service_name from public.get_booking_by_token((select cancel_token from t_booking))) = 'Šišanje', 'get_booking_by_token vraća naziv usluge');
select pg_temp.ok((select count(*) from public.get_booking_by_token(gen_random_uuid())) = 0, 'nepostojeći token: prazno');
select pg_temp.ok((select status from public.cancel_booking((select cancel_token from t_booking))) = 'cancelled', 'otkazivanje više od 24h ranije uspeva');
select pg_temp.expect_error(format('select * from public.cancel_booking(%L)', (select cancel_token from t_booking)), 'BS400', 'ponovno otkazivanje');
select pg_temp.expect_error(format('select * from public.cancel_booking(%L)', gen_random_uuid()), 'BS404', 'otkazivanje nepostojećeg termina');
select pg_temp.ok(exists (select 1 from public.get_available_slots((select svc45 from ctx), (select mon from ctx)) where label = '10:00'), 'otkazani termin je ponovo slobodan');

reset role;
-- =====================================================================

select pg_temp.ok((select cancelled_by from public.bookings where id = (select id from t_booking)) = 'customer', 'cancelled_by = customer');

-- Termin za manje od 24h (upis direktno, zaobilazi pravilo od 2h)
create temp table t_soon as
with ins as (
  insert into public.bookings (service_id, customer_name, customer_phone, start_time, end_time)
  select svc45, 'Sanja Sanić', '+381631234567',
         date_trunc('hour', now()) + interval '5 hours', date_trunc('hour', now()) + interval '5 hours 45 minutes'
  from ctx returning cancel_token
) select * from ins;
grant select on t_soon to anon;
set role anon;
select pg_temp.ok(not (select can_cancel from public.get_booking_by_token((select cancel_token from t_soon))), 'manje od 24h: can_cancel = false');
select pg_temp.expect_error(format('select * from public.cancel_booking(%L)', (select cancel_token from t_soon)), 'BS410', 'otkazivanje manje od 24h ranije');
reset role;

-- Admin ----------------------------------------------------------------------
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a001', 'admin@bombshell.rs'),
                                          ('00000000-0000-0000-0000-00000000b002', 'neko@example.com');
insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-00000000a001');

-- Ulogovan, ali NIJE admin
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b002', false);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-00000000b002"}', false);
select pg_temp.ok((select count(*) from public.bookings) = 0, 'ulogovan ne-admin ne vidi termine');
select pg_temp.ok((select count(*) from public.reviews) = 0, 'ulogovan ne-admin ne vidi neodobrene recenzije');
select pg_temp.ok(not public.is_admin(), 'is_admin() = false za običnog korisnika');
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', false);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-00000000a001"}', false);
select pg_temp.ok(public.is_admin(), 'is_admin() = true');
select pg_temp.ok((select count(*) from public.bookings) >= 5, 'admin vidi termine');
select pg_temp.ok((select count(*) from public.reviews where not is_approved) = 5 and not exists (select 1 from public.reviews where is_approved), 'admin vidi recenzije na čekanju');
update public.reviews set is_approved = true where customer_name = 'Ivana Petrović';
create temp table t_admin as
select * from public.admin_create_booking((select svc120 from ctx), pg_temp.at((select mon from ctx), '16:00'), 'Telefonom Zakazana', '+381211234567', null, 'zakazano telefonom', false, 'confirmed');
select pg_temp.ok((select count(*) from t_admin) = 1, 'admin ručno dodaje termin (i fiksni broj)');
update public.bookings set status = 'cancelled' where id = (select id from t_admin);
select pg_temp.ok((select cancelled_by from public.bookings where id = (select id from t_admin)) = 'salon', 'admin otkazivanje → cancelled_by = salon');
select pg_temp.expect_error(format($q$select * from public.admin_create_booking(%L, %L, 'X Y', '+381641111111')$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '12:15')), 'BS409', 'admin ne može preko postojećeg termina');
reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '{"role":"anon"}', false);

-- Javni prikaz odobrene recenzije
set role anon;
select pg_temp.ok((select display_name from public.reviews) = 'Ivana P.', 'odobrena recenzija vidljiva kao "Ivana P."');
select pg_temp.ok((select count from public.get_review_stats()) = 1 and (select average from public.get_review_stats()) = 5, 'get_review_stats');
reset role;

-- Podsetnici: tačno jednom ------------------------------------------------
insert into public.bookings (service_id, customer_name, customer_phone, start_time, end_time)
select svc45, 'Podsetnik Test', '+381621234567',
       date_trunc('hour', now()) + interval '24 hours', date_trunc('hour', now()) + interval '24 hours 45 minutes'
from ctx;
select pg_temp.ok((select count(*) from public.claim_due_reminders() where customer_name = 'Podsetnik Test') = 1, 'podsetnik preuzet prvi put');
select pg_temp.ok((select count(*) from public.claim_due_reminders() where customer_name = 'Podsetnik Test') = 0, 'podsetnik se ne preuzima drugi put');

-- Direktan pokušaj preklapanja na nivou baze (EXCLUDE constraint)
select pg_temp.expect_error(format($q$insert into public.bookings (service_id, customer_name, customer_phone, start_time, end_time) values (%L, 'Direktno Upisan', '+381641111112', %L, %L)$q$,
  (select svc45 from ctx), pg_temp.at((select mon from ctx), '12:30'), pg_temp.at((select mon from ctx), '13:15')), '23P01', 'EXCLUDE constraint sprečava preklapanje');

\echo '✔ Svi SQL testovi su prošli'

-- Direktan SQL (SQL editor / service_role) sme da upiše odobrenu recenziju
select set_config('request.jwt.claims', '', false);
insert into public.reviews (customer_name, rating, text, is_approved) values ('Uvoz Test', 5, 'Uvezena recenzija iz SQL-a', true);
select pg_temp.ok((select is_approved from public.reviews where customer_name = 'Uvoz Test'), 'service_role/SQL upis zadržava is_approved');
\echo '✔ Dodatni test prošao'
