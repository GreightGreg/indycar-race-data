
CREATE TABLE IF NOT EXISTS public.driver_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_year integer NOT NULL DEFAULT 2026,
  car_number text NOT NULL,
  driver_name text NOT NULL,
  team text NOT NULL,
  nationality text NOT NULL,
  nationality_code text NOT NULL,
  engine text NOT NULL,
  is_full_season boolean NOT NULL DEFAULT true,
  is_rookie boolean NOT NULL DEFAULT false,
  indy_only_round integer DEFAULT null,
  UNIQUE(season_year, car_number)
);

ALTER TABLE public.driver_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.driver_metadata FOR SELECT TO public USING (true);

CREATE TABLE IF NOT EXISTS public.race_pit_times (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id uuid REFERENCES public.races(id) ON DELETE CASCADE,
  car_number text NOT NULL,
  driver_name text NOT NULL,
  lap_number integer NOT NULL,
  pit_time_seconds decimal NOT NULL,
  pit_speed decimal
);

CREATE INDEX IF NOT EXISTS idx_race_pit_times_race_id ON public.race_pit_times(race_id);
CREATE INDEX IF NOT EXISTS idx_race_pit_times_car ON public.race_pit_times(race_id, car_number);

ALTER TABLE public.race_pit_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.race_pit_times FOR SELECT TO public USING (true);
