ALTER TABLE public.race_lap_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.race_lap_sections FOR SELECT USING (true);