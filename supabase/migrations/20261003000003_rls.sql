-- =====================================================================
-- BOMBSHELL – Row Level Security i privilegije
-- Anonimni posetioci: čitaju javne podatke, šalju recenzije (neodobrene),
-- a termine isključivo preko RPC funkcija. Admin (admin_users): pun pristup.
-- =====================================================================

alter table public.service_categories enable row level security;
alter table public.services           enable row level security;
alter table public.working_hours      enable row level security;
alter table public.blocked_dates      enable row level security;
alter table public.bookings           enable row level security;
alter table public.reviews            enable row level security;
alter table public.notification_log   enable row level security;
alter table public.admin_users        enable row level security;

-- ---------------------------------------------------------------------
-- Privilegije na nivou tabela/kolona (dodatni sloj zaštite uz RLS)
-- ---------------------------------------------------------------------
revoke all on public.bookings, public.notification_log, public.admin_users from anon;
revoke all on public.reviews from anon;
-- Anonimni vide samo skraćeno ime ("Jelena M."), nikad puno ime iz forme
grant select (id, display_name, rating, text, service_id, created_at, is_approved) on public.reviews to anon;
grant insert (customer_name, rating, text, service_id, is_approved) on public.reviews to anon;
revoke insert, update, delete, truncate on public.service_categories, public.services,
  public.working_hours, public.blocked_dates from anon;
grant select on public.service_categories, public.services, public.working_hours, public.blocked_dates to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------
-- Politike
-- ---------------------------------------------------------------------
-- Kategorije
create policy "Javno čitanje kategorija" on public.service_categories
  for select to anon, authenticated using (true);
create policy "Admin upravlja kategorijama" on public.service_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Usluge (javno samo aktivne)
create policy "Javno čitanje aktivnih usluga" on public.services
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "Admin upravlja uslugama" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Radno vreme
create policy "Javno čitanje radnog vremena" on public.working_hours
  for select to anon, authenticated using (true);
create policy "Admin upravlja radnim vremenom" on public.working_hours
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Blokirani datumi
create policy "Javno čitanje blokiranih datuma" on public.blocked_dates
  for select to anon, authenticated using (true);
create policy "Admin upravlja blokiranim datumima" on public.blocked_dates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Termini: NEMA javnih politika – samo admin
create policy "Admin upravlja terminima" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Recenzije
create policy "Javno čitanje odobrenih recenzija" on public.reviews
  for select to anon, authenticated using (is_approved or public.is_admin());
create policy "Slanje neodobrene recenzije" on public.reviews
  for insert to anon, authenticated with check (is_approved = false);
create policy "Admin upravlja recenzijama" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Log obaveštenja: samo admin čita (upisuju Edge Functions preko service_role)
create policy "Admin čita log obaveštenja" on public.notification_log
  for select to authenticated using (public.is_admin());
create policy "Admin briše log obaveštenja" on public.notification_log
  for delete to authenticated using (public.is_admin());

-- Admin korisnici: svako vidi samo sopstveni red (za proveru pristupa)
create policy "Korisnik vidi svoj admin status" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Funkcije: javne RPC funkcije su eksplicitno dozvoljene, interne zabranjene
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;
grant execute on function public.get_closed_dates(date, date) to anon, authenticated;
grant execute on function public.create_booking(uuid, timestamptz, text, text, text, text, boolean, text) to anon, authenticated;
grant execute on function public.get_booking_by_token(uuid) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;
grant execute on function public.get_review_stats() to anon, authenticated;
grant execute on function public.short_name(text) to anon, authenticated;
grant execute on function public.cancellation_hours() to anon, authenticated;
grant execute on function public.salon_tz() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.admin_create_booking(uuid, timestamptz, text, text, text, text, boolean, text) to authenticated;

grant execute on all functions in schema public to service_role;
