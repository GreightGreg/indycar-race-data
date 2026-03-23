
-- Add missing columns to races table
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS race_time text;
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS drivers_led integer;
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS files_received text[] DEFAULT '{}';
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS season_year integer;

-- Backfill season_year from year for existing rows
UPDATE public.races SET season_year = year WHERE season_year IS NULL;

-- Add alias columns for cautions (code inserts 'laps', table has 'total_laps')
-- We'll just rename to avoid confusion - actually we can't rename without breaking existing code
-- Instead add the column the parser uses
-- cautions: code inserts 'laps' but column is 'total_laps' - not adding since it would be redundant

-- race_laps: code uses 'speed', 'gap', 'flag' but table has 'lap_speed', 'gap_to_leader', 'flag_status'
-- fastest_laps: code uses 'section_length', 'time', 'speed', 'engine' but table has 'section_length_miles', 'section_time', 'section_speed' and no 'engine'
-- pit_stops: code uses 'lap' but table has 'lap_number'
-- penalties: code uses 'infraction', 'lap' but table has 'reason', 'lap_number'

-- Add missing columns that don't exist at all
ALTER TABLE public.fastest_laps ADD COLUMN IF NOT EXISTS engine text;
ALTER TABLE public.fastest_laps ADD COLUMN IF NOT EXISTS section_length numeric;
ALTER TABLE public.fastest_laps ADD COLUMN IF NOT EXISTS time text;
ALTER TABLE public.fastest_laps ADD COLUMN IF NOT EXISTS speed numeric;

ALTER TABLE public.race_laps ADD COLUMN IF NOT EXISTS speed numeric;
ALTER TABLE public.race_laps ADD COLUMN IF NOT EXISTS gap text;
ALTER TABLE public.race_laps ADD COLUMN IF NOT EXISTS flag text;

ALTER TABLE public.cautions ADD COLUMN IF NOT EXISTS laps integer;

ALTER TABLE public.pit_stops ADD COLUMN IF NOT EXISTS lap integer;

ALTER TABLE public.penalties ADD COLUMN IF NOT EXISTS infraction text;
ALTER TABLE public.penalties ADD COLUMN IF NOT EXISTS lap integer;
