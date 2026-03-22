
-- Create seasons table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  series_name TEXT NOT NULL DEFAULT 'NTT INDYCAR SERIES',
  total_rounds INTEGER NOT NULL DEFAULT 18,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create races table
CREATE TABLE public.races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  event_name TEXT NOT NULL,
  track_name TEXT NOT NULL,
  track_length_miles DECIMAL,
  race_date DATE NOT NULL,
  total_laps INTEGER,
  green_laps INTEGER,
  caution_laps INTEGER,
  total_race_time TEXT,
  avg_speed DECIMAL,
  lead_changes INTEGER,
  drivers_who_led INTEGER,
  fastest_lap_speed DECIMAL,
  fastest_lap_time TEXT,
  fastest_lap_driver TEXT,
  fastest_lap_car TEXT,
  fastest_lap_number INTEGER,
  best_lead_lap_speed DECIMAL,
  best_lead_lap_time TEXT,
  best_lead_lap_driver TEXT,
  total_passes INTEGER,
  position_passes INTEGER,
  most_improved_driver TEXT,
  most_improved_car TEXT,
  most_improved_positions INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, round_number)
);

-- Create race_results table
CREATE TABLE public.race_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  finish_position INTEGER NOT NULL,
  start_position INTEGER NOT NULL,
  car_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  engine TEXT NOT NULL,
  laps_completed INTEGER NOT NULL,
  laps_down INTEGER NOT NULL DEFAULT 0,
  time_gap TEXT,
  pit_stops INTEGER NOT NULL DEFAULT 0,
  elapsed_time TEXT,
  avg_speed DECIMAL,
  status TEXT NOT NULL DEFAULT 'Running',
  race_points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  championship_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create race_laps table
CREATE TABLE public.race_laps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  lap_number INTEGER NOT NULL,
  car_number TEXT NOT NULL,
  driver_name TEXT,
  lap_time TEXT,
  lap_speed DECIMAL,
  gap_to_leader TEXT,
  flag_status TEXT
);

-- Create race_positions table
CREATE TABLE public.race_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  lap_number INTEGER NOT NULL,
  car_number TEXT NOT NULL,
  position INTEGER NOT NULL
);

-- Create pit_stops table
CREATE TABLE public.pit_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  car_number TEXT NOT NULL,
  driver_name TEXT,
  stop_number INTEGER NOT NULL,
  lap_number INTEGER NOT NULL,
  race_lap INTEGER,
  time_of_race TEXT
);

-- Create pit_execution table
CREATE TABLE public.pit_execution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  car_number TEXT NOT NULL,
  driver_name TEXT,
  best_transit_time DECIMAL,
  pit_lane_speed DECIMAL,
  entry_route TEXT
);

-- Create fastest_laps table
CREATE TABLE public.fastest_laps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_length_miles DECIMAL,
  rank INTEGER NOT NULL,
  car_number TEXT NOT NULL,
  driver_name TEXT,
  section_time TEXT,
  section_speed DECIMAL,
  lap_number INTEGER
);

-- Create cautions table
CREATE TABLE public.cautions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  caution_number INTEGER NOT NULL,
  start_lap INTEGER NOT NULL,
  end_lap INTEGER NOT NULL,
  total_laps INTEGER NOT NULL,
  reason TEXT
);

-- Create penalties table
CREATE TABLE public.penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  car_number TEXT NOT NULL,
  reason TEXT,
  lap_number INTEGER,
  penalty TEXT
);

-- Create laps_led table
CREATE TABLE public.laps_led (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  car_number TEXT NOT NULL,
  driver_name TEXT,
  laps_led INTEGER NOT NULL DEFAULT 0,
  stints INTEGER NOT NULL DEFAULT 0,
  longest_consecutive INTEGER NOT NULL DEFAULT 0,
  start_lap_of_longest INTEGER
);

-- Create session_results table
CREATE TABLE public.session_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  position INTEGER NOT NULL,
  car_number TEXT NOT NULL,
  driver_name TEXT,
  engine TEXT,
  best_time TEXT,
  best_speed DECIMAL,
  laps_run INTEGER
);

-- Create session_statistics table
CREATE TABLE public.session_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  laps INTEGER NOT NULL DEFAULT 0,
  miles DECIMAL,
  time_on_track TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pit_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pit_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fastest_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cautions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laps_led ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_statistics ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (dashboard is public)
CREATE POLICY "Public read access" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.races FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.race_results FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.race_laps FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.race_positions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.pit_stops FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.pit_execution FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.fastest_laps FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.cautions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.penalties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.laps_led FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.session_results FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.session_statistics FOR SELECT USING (true);

-- Create indexes for common queries
CREATE INDEX idx_races_season ON public.races(season_id);
CREATE INDEX idx_races_year_round ON public.races(year, round_number);
CREATE INDEX idx_races_status ON public.races(status);
CREATE INDEX idx_race_results_race ON public.race_results(race_id);
CREATE INDEX idx_race_positions_race_lap ON public.race_positions(race_id, lap_number);
CREATE INDEX idx_pit_stops_race ON public.pit_stops(race_id);
CREATE INDEX idx_fastest_laps_race_section ON public.fastest_laps(race_id, section_name);
CREATE INDEX idx_cautions_race ON public.cautions(race_id);
CREATE INDEX idx_penalties_race ON public.penalties(race_id);
CREATE INDEX idx_laps_led_race ON public.laps_led(race_id);
CREATE INDEX idx_session_results_race ON public.session_results(race_id);
CREATE INDEX idx_session_statistics_race ON public.session_statistics(race_id);

-- Create storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('race-pdfs', 'race-pdfs', false);

-- Storage policies for race PDFs
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'race-pdfs');
CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT USING (bucket_id = 'race-pdfs');
