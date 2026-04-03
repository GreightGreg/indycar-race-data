import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTeamGridData = (year: number | null, throughRound?: number | null) =>
  useQuery({
    queryKey: ['team_grid', year, throughRound],
    queryFn: async () => {
      // 1. Get completed races
      let racesQ = supabase
        .from('races')
        .select('id, round_number, track_name, track_type, event_name')
        .eq('year', year!)
        .eq('status', 'complete')
        .order('round_number');
      if (throughRound) racesQ = racesQ.lte('round_number', throughRound);
      const { data: races, error: rErr } = await racesQ;
      if (rErr) throw rErr;
      if (!races?.length) return null;

      const raceIds = races.map(r => r.id);

      // 2. Get driver metadata
      const { data: drivers, error: dErr } = await supabase
        .from('driver_metadata')
        .select('*')
        .eq('season_year', year!);
      if (dErr) throw dErr;

      // 3. Get race results (paginated)
      const allResults: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('race_results')
          .select('race_id, car_number, finish_position, start_position')
          .in('race_id', raceIds)
          .range(from, from + 999);
        if (error) throw error;
        allResults.push(...(data || []));
        if (!data || data.length < 1000) break;
        from += 1000;
      }

      // 4. Get qualifying results (ovals)
      const { data: qualResults, error: qErr } = await supabase
        .from('qualifying_results')
        .select('race_id, car_number, qual_position')
        .in('race_id', raceIds);
      if (qErr) throw qErr;

      // 5. Get session_full_results for road/street qualifying
      const { data: sessionResults, error: sErr } = await supabase
        .from('session_full_results')
        .select('race_id, car_number, rank, session_type')
        .in('race_id', raceIds)
        .ilike('session_type', '%Qualifying%');
      if (sErr) throw sErr;

      return { races, drivers: drivers || [], results: allResults, qualResults: qualResults || [], sessionResults: sessionResults || [] };
    },
    enabled: !!year,
  });
