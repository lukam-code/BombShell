# Lokalni test-stack (samo za razvoj/testiranje)

Imitira Supabase API na `http://localhost:54321` pomoću lokalnog Postgres-a i PostgREST-a,
bez Docker-a. Koristi se za end-to-end testove booking toka i admin panela.

- `/rest/v1/*` → PostgREST (anon / authenticated JWT)
- `/auth/v1/*` → minimalna imitacija GoTrue (samo login lozinkom za test admin nalog)

Za pravi razvoj koristite `supabase start` (Supabase CLI + Docker) – vidi glavni README.
