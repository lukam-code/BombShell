-- =====================================================================
-- BOMBSHELL – osnovna šema
-- Sva vremena termina se čuvaju kao timestamptz; lokalna zona salona je Europe/Belgrade.
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

-- Kategorije usluga ------------------------------------------------------
create table public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text,
  sort_order  integer not null default 0
);

-- Usluge -----------------------------------------------------------------
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references public.service_categories(id) on delete restrict,
  name              text not null,
  description       text,
  duration_minutes  integer not null check (duration_minutes between 5 and 600),
  price_rsd         integer check (price_rsd is null or price_rsd >= 0),
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index services_category_idx on public.services (category_id, sort_order);

-- Radno vreme (0 = nedelja … 6 = subota, kao extract(dow)) --------------
create table public.working_hours (
  id           integer generated always as identity primary key,
  day_of_week  smallint not null unique check (day_of_week between 0 and 6),
  open_time    time not null default '09:00',
  close_time   time not null default '21:00',
  is_closed    boolean not null default false,
  constraint working_hours_order check (is_closed or close_time > open_time)
);

-- Blokirani datumi (praznici, odmor) -------------------------------------
create table public.blocked_dates (
  id      integer generated always as identity primary key,
  date    date not null unique,
  reason  text
);

-- Termini ----------------------------------------------------------------
create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  service_id            uuid not null references public.services(id) on delete restrict,
  customer_name         text not null check (char_length(customer_name) between 2 and 100),
  customer_phone        text not null check (customer_phone ~ '^\+381[1-9][0-9]{6,9}$'),
  customer_email        text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  note                  text check (note is null or char_length(note) <= 300),
  start_time            timestamptz not null,
  end_time              timestamptz not null,
  status                text not null default 'pending'
                          check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  cancel_token          uuid not null unique default gen_random_uuid(),
  notifications_opt_in  boolean not null default true,
  reminder_sent_at      timestamptz,
  cancelled_by          text check (cancelled_by in ('customer', 'salon')),
  created_at            timestamptz not null default now(),
  constraint bookings_time_order check (end_time > start_time),
  -- Sprečava duplo bukiranje: aktivni termini (svi osim otkazanih) ne smeju da se preklapaju.
  constraint bookings_no_overlap exclude using gist (
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status <> 'cancelled')
);
create index bookings_start_idx on public.bookings (start_time);
create index bookings_phone_idx on public.bookings (customer_phone, start_time);
create index bookings_reminder_idx on public.bookings (start_time)
  where reminder_sent_at is null and status in ('pending', 'confirmed');

-- Recenzije --------------------------------------------------------------
-- "Jelena Marković" → "Jelena M." (javno se prikazuje samo ovo)
create or replace function public.short_name(full_name text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when array_length(parts, 1) >= 2
      then initcap(parts[1]) || ' ' || upper(left(parts[2], 1)) || '.'
    else initcap(coalesce(parts[1], ''))
  end
  from (select regexp_split_to_array(btrim(full_name), '\s+') as parts) p
$$;

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null check (char_length(btrim(customer_name)) between 2 and 60),
  display_name   text generated always as (public.short_name(customer_name)) stored,
  rating         smallint not null check (rating between 1 and 5),
  text           text not null check (char_length(btrim(text)) between 10 and 500),
  service_id     uuid references public.services(id) on delete set null,
  is_approved    boolean not null default false,
  created_at     timestamptz not null default now()
);
create index reviews_approved_idx on public.reviews (is_approved, created_at desc);

-- Log obaveštenja --------------------------------------------------------
create table public.notification_log (
  id          bigint generated always as identity primary key,
  booking_id  uuid references public.bookings(id) on delete set null,
  channel     text not null check (channel in ('viber', 'sms', 'email')),
  type        text not null check (type in ('confirmation', 'reminder', 'cancellation', 'salon_new', 'salon_cancelled', 'salon_review')),
  recipient   text,
  status      text not null check (status in ('sent', 'failed', 'skipped')),
  error       text,
  created_at  timestamptz not null default now()
);
create index notification_log_created_idx on public.notification_log (created_at desc);
create index notification_log_booking_idx on public.notification_log (booking_id);

-- Administratori (korisnici iz Supabase Auth koji smeju u admin panel) ---
create table public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
