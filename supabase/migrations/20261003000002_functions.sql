-- =====================================================================
-- BOMBSHELL – RPC funkcije i trigeri
-- Greške imaju sopstvene SQLSTATE kodove (frontend ih prepoznaje):
--   BS400 neispravan zahtev, BS404 nije pronađeno, BS409 termin zauzet,
--   BS410 rok za otkazivanje istekao, BS422 pravilo zakazivanja, BS429 previše zahteva
-- =====================================================================

-- Pravila zakazivanja (usklađena sa lib/siteConfig.ts) -------------------
create or replace function public.cancellation_hours() returns integer
language sql immutable set search_path = '' as $$ select 24 $$;

create or replace function public.salon_tz() returns text
language sql immutable set search_path = '' as $$ select 'Europe/Belgrade'::text $$;

-- Da li je trenutni korisnik administrator -------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid())
$$;

-- ---------------------------------------------------------------------
-- get_available_slots: SAMO slobodna vremena, bez ikakvih ličnih podataka
-- ---------------------------------------------------------------------
create or replace function public.get_available_slots(p_service_id uuid, p_date date)
returns table (start_time timestamptz, label text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_tz        text := public.salon_tz();
  v_today     date := (now() at time zone public.salon_tz())::date;
  v_duration  integer;
  v_wh        public.working_hours%rowtype;
begin
  select s.duration_minutes into v_duration
  from public.services s where s.id = p_service_id and s.is_active;
  if not found then return; end if;

  if p_date is null or p_date < v_today or p_date > v_today + 60 then return; end if;
  if exists (select 1 from public.blocked_dates b where b.date = p_date) then return; end if;

  select * into v_wh from public.working_hours w where w.day_of_week = extract(dow from p_date)::smallint;
  if not found or v_wh.is_closed then return; end if;

  return query
  select s.ts, to_char(s.ts at time zone v_tz, 'HH24:MI')
  from generate_series(
         (p_date + v_wh.open_time) at time zone v_tz,
         ((p_date + v_wh.close_time) at time zone v_tz) - make_interval(mins => v_duration),
         interval '15 minutes'
       ) as s(ts)
  where s.ts >= now() + interval '2 hours'
    and not exists (
      select 1 from public.bookings b
      where b.status <> 'cancelled'
        and tstzrange(b.start_time, b.end_time, '[)')
            && tstzrange(s.ts, s.ts + make_interval(mins => v_duration), '[)')
    )
  order by s.ts;
end;
$$;

-- Datumi u narednih 60 dana kada salon ne radi (za kalendar) -------------
create or replace function public.get_closed_dates(p_from date, p_to date)
returns table (date date)
language sql stable security definer set search_path = '' as $$
  select d::date
  from generate_series(p_from, least(p_to, p_from + 120), interval '1 day') d
  where exists (select 1 from public.blocked_dates b where b.date = d::date)
     or not exists (
       select 1 from public.working_hours w
       where w.day_of_week = extract(dow from d)::smallint and not w.is_closed
     )
$$;

-- ---------------------------------------------------------------------
-- Zajednička validacija termina (radno vreme, blokirani datumi, preklapanje)
-- ---------------------------------------------------------------------
create or replace function public._validate_booking_slot(p_service_id uuid, p_start timestamptz, p_enforce_window boolean)
returns integer -- trajanje usluge u minutima
language plpgsql stable set search_path = '' as $$
declare
  v_tz        text := public.salon_tz();
  v_local     timestamp := p_start at time zone public.salon_tz();
  v_date      date := (p_start at time zone public.salon_tz())::date;
  v_today     date := (now() at time zone public.salon_tz())::date;
  v_duration  integer;
  v_wh        public.working_hours%rowtype;
begin
  select s.duration_minutes into v_duration from public.services s where s.id = p_service_id and s.is_active;
  if not found then
    raise exception 'Izabrana usluga trenutno nije dostupna.' using errcode = 'BS404';
  end if;

  if p_start is null or extract(epoch from p_start)::bigint % 900 <> 0 then
    raise exception 'Neispravno vreme termina.' using errcode = 'BS400';
  end if;

  if p_enforce_window then
    if p_start < now() + interval '2 hours' then
      raise exception 'Termin morate zakazati najmanje 2 sata unapred.' using errcode = 'BS422';
    end if;
    if v_date > v_today + 60 then
      raise exception 'Termin možete zakazati najviše 60 dana unapred.' using errcode = 'BS422';
    end if;
  end if;

  if exists (select 1 from public.blocked_dates b where b.date = v_date) then
    raise exception 'Salon ne radi izabranog dana.' using errcode = 'BS422';
  end if;

  select * into v_wh from public.working_hours w where w.day_of_week = extract(dow from v_date)::smallint;
  if not found or v_wh.is_closed then
    raise exception 'Salon ne radi izabranog dana.' using errcode = 'BS422';
  end if;

  if v_local::time < v_wh.open_time
     or v_local + make_interval(mins => v_duration) > v_date + v_wh.close_time then
    raise exception 'Izabrano vreme je van radnog vremena salona (%–%).',
      to_char(v_wh.open_time, 'HH24:MI'), to_char(v_wh.close_time, 'HH24:MI') using errcode = 'BS422';
  end if;

  return v_duration;
end;
$$;

-- ---------------------------------------------------------------------
-- create_booking: online zakazivanje (anonimni korisnici)
-- ---------------------------------------------------------------------
create or replace function public.create_booking(
  p_service_id            uuid,
  p_start_time            timestamptz,
  p_customer_name         text,
  p_customer_phone        text,
  p_customer_email        text default null,
  p_note                  text default null,
  p_notifications_opt_in  boolean default true,
  p_honeypot              text default null
)
returns table (id uuid, cancel_token uuid)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_duration  integer;
  v_name      text := btrim(coalesce(p_customer_name, ''));
  v_phone     text := btrim(coalesce(p_customer_phone, ''));
  v_email     text := nullif(lower(btrim(coalesce(p_customer_email, ''))), '');
  v_note      text := nullif(btrim(coalesce(p_note, '')), '');
  v_active    integer;
  v_id        uuid;
  v_token     uuid;
begin
  -- Honeypot: ljudi ovo polje ne vide, botovi ga popune
  if coalesce(p_honeypot, '') <> '' then
    raise exception 'Zahtev je odbijen.' using errcode = 'BS400';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 100 then
    raise exception 'Unesite ime i prezime.' using errcode = 'BS400';
  end if;
  if v_phone !~ '^\+3816[0-9]{7,8}$' then
    raise exception 'Unesite ispravan broj mobilnog telefona.' using errcode = 'BS400';
  end if;
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Unesite ispravnu email adresu.' using errcode = 'BS400';
  end if;
  if v_note is not null and char_length(v_note) > 300 then
    raise exception 'Napomena može imati najviše 300 karaktera.' using errcode = 'BS400';
  end if;

  v_duration := public._validate_booking_slot(p_service_id, p_start_time, true);

  -- Najviše 3 aktivna buduća termina po broju telefona (zaključavanje po broju sprečava trku)
  perform pg_advisory_xact_lock(hashtext('booking-phone:' || v_phone));
  select count(*) into v_active
  from public.bookings b
  where b.customer_phone = v_phone and b.status in ('pending', 'confirmed') and b.start_time > now();
  if v_active >= 3 then
    raise exception 'Sa ovog broja već imate 3 zakazana termina. Za dodatne termine pozovite nas na +381 65 662 6031.'
      using errcode = 'BS429';
  end if;

  begin
    insert into public.bookings (service_id, customer_name, customer_phone, customer_email, note,
                                 start_time, end_time, notifications_opt_in)
    values (p_service_id, v_name, v_phone, v_email, v_note,
            p_start_time, p_start_time + make_interval(mins => v_duration), coalesce(p_notifications_opt_in, true))
    returning bookings.id, bookings.cancel_token into v_id, v_token;
  exception when exclusion_violation then
    raise exception 'Nažalost, ovaj termin je upravo zauzet. Izaberite drugi.' using errcode = 'BS409';
  end;

  return query select v_id, v_token;
end;
$$;

-- ---------------------------------------------------------------------
-- admin_create_booking: ručno dodavanje (zakazivanje telefonom)
-- ---------------------------------------------------------------------
create or replace function public.admin_create_booking(
  p_service_id         uuid,
  p_start_time         timestamptz,
  p_customer_name      text,
  p_customer_phone     text,
  p_customer_email     text default null,
  p_note               text default null,
  p_send_confirmation  boolean default true,
  p_status             text default 'confirmed'
)
returns table (id uuid, cancel_token uuid)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_duration  integer;
  v_id        uuid;
  v_token     uuid;
begin
  if not public.is_admin() then
    raise exception 'Nemate dozvolu za ovu radnju.' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'confirmed') then
    raise exception 'Neispravan status.' using errcode = 'BS400';
  end if;

  -- Admin sme da zakaže i kraće od 2h unapred, ali ne van radnog vremena niti preko drugog termina
  v_duration := public._validate_booking_slot(p_service_id, p_start_time, false);

  -- Trigger za obaveštenja čita ove vrednosti (važe samo u ovoj transakciji)
  perform set_config('bombshell.source', 'admin', true);
  perform set_config('bombshell.skip_customer_notifications', case when p_send_confirmation then 'off' else 'on' end, true);

  begin
    insert into public.bookings (service_id, customer_name, customer_phone, customer_email, note,
                                 start_time, end_time, status, notifications_opt_in)
    values (p_service_id, btrim(p_customer_name), btrim(p_customer_phone),
            nullif(lower(btrim(coalesce(p_customer_email, ''))), ''), nullif(btrim(coalesce(p_note, '')), ''),
            p_start_time, p_start_time + make_interval(mins => v_duration), p_status,
            coalesce(p_send_confirmation, true)) -- bez potvrde = bez SMS/Viber podsetnika
    returning bookings.id, bookings.cancel_token into v_id, v_token;
  exception when exclusion_violation then
    raise exception 'U tom periodu već postoji drugi termin.' using errcode = 'BS409';
  end;

  return query select v_id, v_token;
end;
$$;

-- ---------------------------------------------------------------------
-- get_booking_by_token: samo osnovni podaci tog jednog termina
-- ---------------------------------------------------------------------
create or replace function public.get_booking_by_token(p_token uuid)
returns table (service_name text, start_time timestamptz, end_time timestamptz, status text, can_cancel boolean)
language sql stable security definer set search_path = '' as $$
  select s.name, b.start_time, b.end_time, b.status,
         (b.status in ('pending', 'confirmed')
          and b.start_time - now() > make_interval(hours => public.cancellation_hours()))
  from public.bookings b
  join public.services s on s.id = b.service_id
  where b.cancel_token = p_token
$$;

-- ---------------------------------------------------------------------
-- cancel_booking: samostalno otkazivanje (rok i status se proveravaju ovde)
-- ---------------------------------------------------------------------
create or replace function public.cancel_booking(p_token uuid)
returns table (status text, start_time timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings b where b.cancel_token = p_token for update;
  if not found then
    raise exception 'Termin nije pronađen. Proverite link iz potvrde.' using errcode = 'BS404';
  end if;
  if v_booking.status = 'cancelled' then
    raise exception 'Ovaj termin je već otkazan.' using errcode = 'BS400';
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Ovaj termin se više ne može otkazati.' using errcode = 'BS400';
  end if;
  if v_booking.start_time - now() <= make_interval(hours => public.cancellation_hours()) then
    raise exception 'Rok za online otkazivanje je istekao. Molimo Vas pozovite nas na +381 65 662 6031.'
      using errcode = 'BS410';
  end if;

  update public.bookings b
     set status = 'cancelled', cancelled_by = 'customer'
   where b.id = v_booking.id;

  return query select 'cancelled'::text, v_booking.start_time;
end;
$$;

-- ---------------------------------------------------------------------
-- Statistika odobrenih recenzija (prosek i broj) – za sajt i JSON-LD
-- ---------------------------------------------------------------------
create or replace function public.get_review_stats()
returns table (average numeric, count integer)
language sql stable security definer set search_path = '' as $$
  select round(avg(r.rating)::numeric, 2), count(*)::integer
  from public.reviews r where r.is_approved
$$;

-- ---------------------------------------------------------------------
-- Podsetnici: atomično "preuzima" termine za 23–25h i upisuje reminder_sent_at,
-- pa se isti podsetnik nikad ne šalje dvaput (poziva je samo Edge Function sa service_role).
-- ---------------------------------------------------------------------
create or replace function public.claim_due_reminders()
returns setof public.bookings
language sql volatile security definer set search_path = '' as $$
  update public.bookings b
     set reminder_sent_at = now()
   where b.id in (
     select x.id from public.bookings x
     where x.status in ('pending', 'confirmed')
       and x.notifications_opt_in
       and x.reminder_sent_at is null
       and x.start_time >= now() + interval '23 hours'
       and x.start_time <  now() + interval '25 hours'
     for update skip locked
   )
  returning b.*
$$;

-- ---------------------------------------------------------------------
-- Trigeri
-- ---------------------------------------------------------------------

-- Ko je otkazao: klijent (preko cancel_booking) ili salon (admin panel)
create or replace function public.bookings_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' and new.cancelled_by is null then
    new.cancelled_by := 'salon';
  elsif new.status <> 'cancelled' then
    new.cancelled_by := null;
  end if;
  -- Ako se termin pomeri, podsetnik treba ponovo da se pošalje
  if new.start_time is distinct from old.start_time then
    new.reminder_sent_at := null;
  end if;
  return new;
end;
$$;

create trigger bookings_before_update
  before update on public.bookings
  for each row execute function public.bookings_before_update();

-- Recenzije: anonimni korisnici ne mogu da objave odmah + ograničenje spama
create or replace function public.reviews_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_recent integer;
  v_role   text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  -- Pravilo važi za posetioce sajta (anon) i ulogovane ne-admine; admin, service_role
  -- i direktan SQL (npr. uvoz iz SQL editora) nisu ograničeni.
  if v_role not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  new.is_approved := false;
  new.created_at := now();
  perform pg_advisory_xact_lock(hashtext('reviews-rate-limit'));
  select count(*) into v_recent from public.reviews r where r.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Previše recenzija je poslato u kratkom roku. Pokušajte ponovo za sat vremena.' using errcode = 'BS429';
  end if;
  return new;
end;
$$;

create trigger reviews_before_insert
  before insert on public.reviews
  for each row execute function public.reviews_before_insert();
