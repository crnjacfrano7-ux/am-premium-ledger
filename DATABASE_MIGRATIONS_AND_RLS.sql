-- ============================================================================
-- AM PREMIUM — baza podataka: sve migracije i RLS politike na jednom mjestu
-- ============================================================================
-- Nastaje iz: drizzle/migrations/0000, 0001, 0002
-- Provjerjeno direktno u bazi (pg_policies) dana 2026-10-16.
-- Redoslijed izvršavanja je bitan: 0000 -> 0001 -> 0002.
-- Napomena: pristup bazi ide kroz Lovable Cloud (More -> Database).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0000 — stanovi, grupe (spojeni stanovi), uplate
-- ----------------------------------------------------------------------------
CREATE TABLE public.unit_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Spojeni stanovi',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_groups TO authenticated;
GRANT ALL ON public.unit_groups TO service_role;
ALTER TABLE public.unit_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read groups" ON public.unit_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert groups" ON public.unit_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update groups" ON public.unit_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete groups" ON public.unit_groups FOR DELETE TO authenticated USING (true);

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor int NOT NULL,
  block int NOT NULL,
  slot int NOT NULL,
  label text NOT NULL,
  sqm numeric NOT NULL DEFAULT 55,
  price_per_sqm numeric NOT NULL DEFAULT 1500,
  status text NOT NULL DEFAULT 'slobodan',
  buyer_name text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  group_id uuid REFERENCES public.unit_groups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read units" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert units" ON public.units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update units" ON public.units FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete units" ON public.units FOR DELETE TO authenticated USING (true);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at date NOT NULL DEFAULT current_date,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payments" ON public.payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete payments" ON public.payments FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_payments_unit ON public.payments(unit_id);
CREATE INDEX idx_units_floor ON public.units(floor);

INSERT INTO public.units (floor, block, slot, label) VALUES
(1,1,1,'1-A'),(1,1,2,'1-B'),(1,2,1,'1-C'),(1,2,2,'1-D'),(1,3,1,'1-E'),(1,3,2,'1-F'),
(2,1,1,'2-A'),(2,1,2,'2-B'),(2,2,1,'2-C'),(2,2,2,'2-D'),(2,3,1,'2-E'),(2,3,2,'2-F'),
(3,1,1,'3-A'),(3,1,2,'3-B'),(3,2,1,'3-C'),(3,2,2,'3-D'),(3,3,1,'3-E'),(3,3,2,'3-F'),
(4,1,1,'4-A'),(4,1,2,'4-B'),(4,2,1,'4-C'),(4,2,2,'4-D'),(4,3,1,'4-E'),(4,3,2,'4-F'),
(5,1,1,'5-A'),(5,1,2,'5-B'),(5,2,1,'5-C'),(5,2,2,'5-D'),(5,3,1,'5-E'),(5,3,2,'5-F');


-- ----------------------------------------------------------------------------
-- 0001 — zgrade (folder sistem) + pozicija i veličina bloka na nacrtu
-- ----------------------------------------------------------------------------
CREATE TABLE public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Zgrada',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buildings TO authenticated;
GRANT ALL ON public.buildings TO service_role;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read buildings" ON public.buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert buildings" ON public.buildings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update buildings" ON public.buildings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete buildings" ON public.buildings FOR DELETE TO authenticated USING (true);

ALTER TABLE public.units ADD COLUMN building_id uuid REFERENCES public.buildings(id) ON DELETE CASCADE;
ALTER TABLE public.units ADD COLUMN grid_x integer;
ALTER TABLE public.units ADD COLUMN grid_y integer;
ALTER TABLE public.units ADD COLUMN grid_w integer;
ALTER TABLE public.units ADD COLUMN grid_h integer;

INSERT INTO public.buildings (id, name, position)
SELECT gen_random_uuid(), 'Zgrada 1', 0 WHERE EXISTS (SELECT 1 FROM public.units);
UPDATE public.units SET building_id = (SELECT id FROM public.buildings ORDER BY created_at LIMIT 1) WHERE building_id IS NULL;


-- ----------------------------------------------------------------------------
-- 0002 — postavka stepenista po spratu (pomjeranje i velicina)
-- ----------------------------------------------------------------------------
ALTER TABLE public.buildings ADD COLUMN staircase_layouts jsonb NOT NULL DEFAULT '{}'::jsonb;


-- ----------------------------------------------------------------------------
-- PROVJERENO U BAZI — RLS politike koje su stvarno aktivne (2026-10-16)
-- ----------------------------------------------------------------------------
-- buildings    : SELECT, INSERT, UPDATE, DELETE  -> authenticated (USING true / WITH CHECK true)
-- unit_groups  : SELECT, INSERT, UPDATE, DELETE  -> authenticated (USING true / WITH CHECK true)
-- units        : SELECT, INSERT, UPDATE, DELETE  -> authenticated (USING true / WITH CHECK true)
-- payments     : SELECT, INSERT, UPDATE, DELETE  -> authenticated (USING true / WITH CHECK true)
--
-- Ukupno 16 politika (4 po tabeli). Anon (odjavljeni korisnik) nema nijednu
-- politiku ni GRANT, pa ne vidi podatke — prijava je obavezna.
-- service_role ima ALL na sve cetiri tabeli (koristi ga samo backend).
--
-- Poglavlje za provjeru:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;


-- ----------------------------------------------------------------------------
-- NAPOMENE
-- ----------------------------------------------------------------------------
-- 1) Prijave korisnika (email + lozinka) vode se u sistemu za autentifikaciju
--    (auth.users) i nisu dio ove skripte.
-- 2) Ova skripta je referentna/snimitak stanja. Za stvarne izmjene strukture
--    koristi migracije u drizzle/migrations/ tako da ostanu uskladjene.
-- 3) Izvoz podataka (CSV) ide iz Lovable Cloud: More -> Database -> Manage ->
--    Settings -> Export data.
