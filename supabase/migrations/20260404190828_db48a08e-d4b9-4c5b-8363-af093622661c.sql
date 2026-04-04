CREATE TABLE IF NOT EXISTS public.race_lap_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id uuid REFERENCES public.races(id) ON DELETE CASCADE,
  car_number text NOT NULL,
  driver_name text NOT NULL,
  lap_number integer NOT NULL,
  section_name text NOT NULL,
  section_time decimal,
  section_speed decimal,
  is_pit_lap boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_rls_race ON public.race_lap_sections(race_id);
CREATE INDEX idx_rls_car ON public.race_lap_sections(race_id, car_number);
CREATE INDEX idx_rls_section ON public.race_lap_sections(race_id, section_name);
CREATE INDEX idx_rls_lap ON public.race_lap_sections(race_id, lap_number);