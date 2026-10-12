-- =====================================================================
-- BOMBSHELL – performanse baze (preporuke Supabase savetnika)
--  * indeksi za strane ključeve
--  * auth.uid()/is_admin() u RLS politikama kroz (select ...) – računa se
--    jednom po upitu umesto za svaki red
-- Bez brisanja politika; ponašanje (ko šta sme) ostaje identično.
-- =====================================================================

create index if not exists bookings_service_idx on public.bookings (service_id);
create index if not exists reviews_service_idx on public.reviews (service_id);

alter policy "Korisnik vidi svoj admin status" on public.admin_users
  using (user_id = (select auth.uid()));

alter policy "Admin upravlja kategorijama" on public.service_categories
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin upravlja radnim vremenom" on public.working_hours
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin upravlja blokiranim datumima" on public.blocked_dates
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin upravlja uslugama" on public.services
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Javno čitanje aktivnih usluga" on public.services
  using (is_active or (select public.is_admin()));
alter policy "Admin upravlja terminima" on public.bookings
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin upravlja recenzijama" on public.reviews
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Javno čitanje odobrenih recenzija" on public.reviews
  using (is_approved or (select public.is_admin()));
alter policy "Admin čita log obaveštenja" on public.notification_log
  using ((select public.is_admin()));
alter policy "Admin briše log obaveštenja" on public.notification_log
  using ((select public.is_admin()));
