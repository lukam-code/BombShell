-- Barakudans – Supabase šema. Pokreni u SQL editoru (jednom).
-- Pristup je isključivo preko servera sa service role ključem: RLS je uključen, bez javnih politika.

create table if not exists tables (
  id text primary key,
  label text not null,
  x numeric not null, y numeric not null, w numeric not null, h numeric not null,
  shape text not null check (shape in ('round','rect')),
  seats int not null check (seats > 0),
  zone text not null default '',
  sort int not null default 0
);

create table if not exists settings (key text primary key, value jsonb not null);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  table_id text not null,           -- namerno bez FK: izmena rasporeda ne briše istoriju
  date date not null,
  slot time not null,
  guests int not null check (guests > 0),
  name text not null, phone text not null, email text not null, note text not null default '',
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now()
);

-- Poslednja linija odbrane od duplog bukiranja: jedan potvrđen sto po (datum, termin).
create unique index if not exists reservations_no_double_booking
  on reservations (table_id, date, slot) where status = 'confirmed';

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  table_id text not null,
  date date not null,
  slot text not null default '*',   -- '*' = svi termini
  reason text not null default '',
  unique (table_id, date, slot)
);

alter table tables enable row level security;
alter table settings enable row level security;
alter table reservations enable row level security;
alter table blocks enable row level security;

-- Atomska rezervacija: provere + insert u jednoj transakciji.
create or replace function create_reservation(
  p_table text, p_date date, p_slot time, p_guests int,
  p_name text, p_phone text, p_email text, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare t tables; r reservations;
begin
  -- serijalizuje istovremene pokušaje za isti sto/datum/termin
  perform pg_advisory_xact_lock(hashtext(p_table || p_date::text || p_slot::text));
  select * into t from tables where id = p_table;
  if not found then return jsonb_build_object('ok', false, 'code', 'NO_TABLE'); end if;
  if p_guests > t.seats then return jsonb_build_object('ok', false, 'code', 'CAPACITY'); end if;
  if exists (select 1 from blocks where table_id = p_table and date = p_date
             and (slot = '*' or slot = to_char(p_slot, 'HH24:MI'))) then
    return jsonb_build_object('ok', false, 'code', 'BLOCKED');
  end if;
  begin
    insert into reservations (table_id, date, slot, guests, name, phone, email, note)
    values (p_table, p_date, p_slot, p_guests, p_name, p_phone, p_email, p_note)
    returning * into r;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'TAKEN');
  end;
  return jsonb_build_object('ok', true, 'reservation', to_jsonb(r));
end $$;

revoke all on function create_reservation from public, anon, authenticated;

-- Početni raspored: dodaj stolove kroz admin panel (Raspored → Sačuvaj) ili uvezi iz lib/layout.ts.
