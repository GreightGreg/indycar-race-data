import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSeasonRaces = (year: number | null) =>
  useQuery({
    queryKey: ['season_races', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('year', year!)
        .eq('status', 'complete')
        .order('round_number');
      if (error) throw error;
      return data;
    },
    enabled: !!year,
  });

export const useSeasonResults = (year: number | null) =>
  useQuery({
    queryKey: ['season_results', year],
    queryFn: async () => {
      // Get all race_ids for this season year
      const { data: races, error: racesErr } = await supabase
        .from('races')
        .select('id, round_number')
        .eq('year', year!)
        .eq('status', 'complete')
        .order('round_number');
      if (racesErr) throw racesErr;
      if (!races?.length) return { results: [], raceIds: [], rounds: [] };

      const raceIds = races.map(r => r.id);
      const rounds = races.map(r => r.round_number);

      // Paginate results since many races × many drivers can exceed 1000
      const allResults: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('race_results')
          .select('*')
          .in('race_id', raceIds)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allResults.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }

      return { results: allResults, raceIds, rounds, racesMap: Object.fromEntries(races.map(r => [r.id, r.round_number])) };
    },
    enabled: !!year,
  });

export const useSeasonLapsLed = (year: number | null) =>
  useQuery({
    queryKey: ['season_laps_led', year],
    queryFn: async () => {
      const { data: races } = await supabase
        .from('races')
        .select('id')
        .eq('year', year!)
        .eq('status', 'complete');
      if (!races?.length) return [];

      const raceIds = races.map(r => r.id);
      const { data, error } = await supabase
        .from('laps_led')
        .select('*')
        .in('race_id', raceIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!year,
  });

export const useSeasonFastestPitTransit = (year: number | null) =>
  useQuery({
    queryKey: ['season_fastest_pit_transit', year],
    queryFn: async () => {
      const { data: races } = await supabase
        .from('races')
        .select('id, event_name, round_number')
        .eq('year', year!)
        .eq('status', 'complete');
      if (!races?.length) return [];

      const raceIds = races.map(r => r.id);
      const raceMap = Object.fromEntries(races.map(r => [r.id, r]));

      const { data, error } = await supabase
        .from('fastest_laps')
        .select('*')
        .in('race_id', raceIds)
        .eq('section_name', 'PI to PO')
        .eq('session_type', 'Race')
        .order('rank');
      if (error) throw error;
      return (data || []).map(d => ({ ...d, _race: raceMap[d.race_id] }));
    },
    enabled: !!year,
  });
