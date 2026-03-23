import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRaces = () =>
  useQuery({
    queryKey: ['races'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('races')
        .select('*, seasons(*)')
        .order('year', { ascending: false })
        .order('race_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useRaceResults = (raceId: string | null) =>
  useQuery({
    queryKey: ['race_results', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('race_results')
        .select('*')
        .eq('race_id', raceId!)
        .order('finish_position');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useRaceDetails = (raceId: string | null) =>
  useQuery({
    queryKey: ['race_details', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useCautions = (raceId: string | null) =>
  useQuery({
    queryKey: ['cautions', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cautions')
        .select('*')
        .eq('race_id', raceId!)
        .order('caution_number');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const usePenalties = (raceId: string | null) =>
  useQuery({
    queryKey: ['penalties', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('penalties')
        .select('*')
        .eq('race_id', raceId!)
        .order('lap_number');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useSessionStats = (raceId: string | null) =>
  useQuery({
    queryKey: ['session_statistics', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_statistics')
        .select('*')
        .eq('race_id', raceId!);
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useSessionResults = (raceId: string | null) =>
  useQuery({
    queryKey: ['session_results', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_results')
        .select('*')
        .eq('race_id', raceId!)
        .order('position');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useRacePositions = (raceId: string | null) =>
  useQuery({
    queryKey: ['race_positions', raceId],
    queryFn: async () => {
      // 250 laps × 25 cars = 6250 rows, need to exceed default 1000 limit
      const allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('race_positions')
          .select('*')
          .eq('race_id', raceId!)
          .order('lap_number')
          .order('position')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allRows.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allRows;
    },
    enabled: !!raceId,
  });

export const useLapsLed = (raceId: string | null) =>
  useQuery({
    queryKey: ['laps_led', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('laps_led')
        .select('*')
        .eq('race_id', raceId!)
        .order('laps_led', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const usePitStops = (raceId: string | null) =>
  useQuery({
    queryKey: ['pit_stops', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pit_stops')
        .select('*')
        .eq('race_id', raceId!)
        .order('stop_number');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const usePitExecution = (raceId: string | null) =>
  useQuery({
    queryKey: ['pit_execution', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pit_execution')
        .select('*')
        .eq('race_id', raceId!)
        .order('best_transit_time');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useFastestLaps = (raceId: string | null, sectionName: string, sessionType: string = 'Race') =>
  useQuery({
    queryKey: ['fastest_laps', raceId, sectionName, sessionType],
    queryFn: async () => {
      let query = supabase
        .from('fastest_laps')
        .select('*')
        .eq('race_id', raceId!)
        .eq('section_name', sectionName)
        .order('rank');

      query = sessionType === 'Qualifying'
        ? query.ilike('session_type', 'Qualifying%')
        : query.eq('session_type', sessionType);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useFastestLapSections = (raceId: string | null, sessionType: string = 'Race') =>
  useQuery({
    queryKey: ['fastest_lap_sections', raceId, sessionType],
    queryFn: async () => {
      let query = supabase
        .from('fastest_laps')
        .select('section_name, section_length_miles')
        .eq('race_id', raceId!)
        .eq('rank', 1);

      query = sessionType === 'Qualifying'
        ? query.ilike('session_type', 'Qualifying%')
        : query.eq('session_type', sessionType);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useFastestLapSessionTypes = (raceId: string | null) =>
  useQuery({
    queryKey: ['fastest_lap_session_types', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fastest_laps')
        .select('session_type')
        .eq('race_id', raceId!)
        .eq('rank', 1)
        .eq('section_name', 'Lap');
      if (error) throw error;

      const unique = new Set(
        data.map((d) => d.session_type.startsWith('Qualifying') ? 'Qualifying' : d.session_type),
      );
      const order = ['Race', 'Practice 1', 'Practice 2', 'Practice Final', 'Qualifying'];
      return order.filter((s) => unique.has(s));
    },
    enabled: !!raceId,
  });

export const useChampionshipStandings = (raceId: string | null) =>
  useQuery({
    queryKey: ['championship', raceId],
    queryFn: async () => {
      // Get the race details to know the year and round
      const { data: race, error: raceErr } = await supabase
        .from('races')
        .select('year, round_number')
        .eq('id', raceId!)
        .single();
      if (raceErr) throw raceErr;

      // Get all race results for races in same year up to this round
      const { data: races, error: racesErr } = await supabase
        .from('races')
        .select('id, round_number')
        .eq('year', race.year)
        .eq('status', 'complete')
        .lte('round_number', race.round_number);
      if (racesErr) throw racesErr;

      const raceIds = races.map(r => r.id);

      const { data: results, error: resultsErr } = await supabase
        .from('race_results')
        .select('car_number, driver_name, engine, race_points, race_id')
        .in('race_id', raceIds);
      if (resultsErr) throw resultsErr;

      // Aggregate by driver
      const driverTotals: Record<string, {
        car_number: string;
        driver_name: string;
        engine: string;
        pointsByRound: Record<number, number>;
        total: number;
      }> = {};

      for (const r of results) {
        if (!driverTotals[r.car_number]) {
          driverTotals[r.car_number] = {
            car_number: r.car_number,
            driver_name: r.driver_name,
            engine: r.engine,
            pointsByRound: {},
            total: 0,
          };
        }
        const roundNum = races.find(rc => rc.id === r.race_id)?.round_number || 0;
        driverTotals[r.car_number].pointsByRound[roundNum] = (driverTotals[r.car_number].pointsByRound[roundNum] || 0) + r.race_points;
        driverTotals[r.car_number].total += r.race_points;
      }

      const sorted = Object.values(driverTotals).sort((a, b) => b.total - a.total);
      const maxPts = sorted[0]?.total || 1;
      const currentRound = race.round_number;

      return sorted.map((d, i) => ({
        rank: i + 1,
        car: d.car_number,
        driver_name: d.driver_name,
        engine: d.engine,
        r2: d.pointsByRound[currentRound] || 0,
        r1: d.total - (d.pointsByRound[currentRound] || 0),
        total: d.total,
        gap: i === 0 ? '—' : `${d.total - maxPts}`,
        maxPts,
      }));
    },
    enabled: !!raceId,
  });

// Color palette for driver lines (distinct from UI blue/yellow)
export const DRIVER_COLORS: Record<string, string> = {
  '2': '#e74c3c', '3': '#2ecc71', '4': '#9b59b6', '5': '#ff8c00', '6': '#1abc9c',
  '7': '#e67e22', '8': '#5dade2', '9': '#27ae60', '10': '#8e44ad', '12': '#c0392b',
  '14': '#d4a017', '15': '#16a085', '18': '#95a5a6', '19': '#2980b9', '20': '#f1c40f',
  '21': '#e91e63', '26': '#00bcd4', '27': '#4caf50', '28': '#ff5722', '45': '#795548',
  '47': '#607d8b', '60': '#ab47bc', '66': '#00e676', '76': '#ff7043', '77': '#b0bec5',
};
