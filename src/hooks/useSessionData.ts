import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSessionFullResults = (raceId: string | null, sessionType: string) =>
  useQuery({
    queryKey: ['session_full_results', raceId, sessionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_full_results')
        .select('*')
        .eq('race_id', raceId!)
        .eq('session_type', sessionType)
        .order('rank');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useQualifyingResults = (raceId: string | null) =>
  useQuery({
    queryKey: ['qualifying_results', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualifying_results')
        .select('*')
        .eq('race_id', raceId!)
        .order('qual_position');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useQualifyingSectors = (raceId: string | null) =>
  useQuery({
    queryKey: ['qualifying_sectors', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualifying_sectors')
        .select('*')
        .eq('race_id', raceId!)
        .order('car_number')
        .order('lap_number');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });

export const useCombinedPracticeResults = (raceId: string | null) =>
  useQuery({
    queryKey: ['combined_practice_results', raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('combined_practice_results')
        .select('*')
        .eq('race_id', raceId!)
        .order('rank');
      if (error) throw error;
      return data;
    },
    enabled: !!raceId,
  });
