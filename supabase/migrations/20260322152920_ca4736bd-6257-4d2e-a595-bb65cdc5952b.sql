
-- New tables for session data

CREATE TABLE public.session_full_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  session_type text NOT NULL,
  rank integer NOT NULL,
  car_number text NOT NULL,
  driver_name text,
  engine text,
  best_time text,
  best_speed numeric,
  diff_to_leader text,
  gap_to_ahead text,
  best_lap_number integer,
  total_laps integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.qualifying_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  qual_position integer NOT NULL,
  car_number text NOT NULL,
  driver_name text,
  engine text,
  lap1_time text,
  lap2_time text,
  total_time text,
  avg_speed numeric,
  best_lap_time text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.qualifying_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  car_number text NOT NULL,
  driver_name text,
  lap_number integer NOT NULL,
  dogleg_time numeric,
  front_stretch_time numeric,
  turn1_entry_time numeric,
  turn1_exit_time numeric,
  turn2_entry_time numeric,
  turn2_exit_time numeric,
  turn3_entry_time numeric,
  turn3_exit_time numeric,
  turn4_time numeric,
  full_lap_time numeric,
  dogleg_speed numeric,
  front_stretch_speed numeric,
  turn1_entry_speed numeric,
  turn1_exit_speed numeric,
  turn2_entry_speed numeric,
  turn2_exit_speed numeric,
  turn3_entry_speed numeric,
  turn3_exit_speed numeric,
  turn4_speed numeric,
  full_lap_speed numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.combined_practice_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  car_number text NOT NULL,
  driver_name text,
  engine text,
  best_time text,
  best_speed numeric,
  best_session text,
  total_laps integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add session_type to fastest_laps
ALTER TABLE public.fastest_laps ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'Race';

-- RLS policies for all new tables
ALTER TABLE public.session_full_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifying_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifying_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combined_practice_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.session_full_results FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON public.qualifying_results FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON public.qualifying_sectors FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON public.combined_practice_results FOR SELECT TO public USING (true);
