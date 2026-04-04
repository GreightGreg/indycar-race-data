
CREATE POLICY "Allow public insert" ON public.race_lap_sections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete" ON public.race_lap_sections
  FOR DELETE USING (true);
