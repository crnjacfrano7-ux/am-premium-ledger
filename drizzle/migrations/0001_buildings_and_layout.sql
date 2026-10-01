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