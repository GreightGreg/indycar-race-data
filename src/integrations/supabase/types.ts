export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cautions: {
        Row: {
          caution_number: number
          end_lap: number
          id: string
          laps: number | null
          race_id: string
          reason: string | null
          start_lap: number
          total_laps: number
        }
        Insert: {
          caution_number: number
          end_lap: number
          id?: string
          laps?: number | null
          race_id: string
          reason?: string | null
          start_lap: number
          total_laps: number
        }
        Update: {
          caution_number?: number
          end_lap?: number
          id?: string
          laps?: number | null
          race_id?: string
          reason?: string | null
          start_lap?: number
          total_laps?: number
        }
        Relationships: [
          {
            foreignKeyName: "cautions_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      combined_practice_results: {
        Row: {
          best_session: string | null
          best_speed: number | null
          best_time: string | null
          car_number: string
          created_at: string
          driver_name: string | null
          engine: string | null
          id: string
          race_id: string
          rank: number
          total_laps: number | null
        }
        Insert: {
          best_session?: string | null
          best_speed?: number | null
          best_time?: string | null
          car_number: string
          created_at?: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          race_id: string
          rank: number
          total_laps?: number | null
        }
        Update: {
          best_session?: string | null
          best_speed?: number | null
          best_time?: string | null
          car_number?: string
          created_at?: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          race_id?: string
          rank?: number
          total_laps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "combined_practice_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_metadata: {
        Row: {
          car_number: string
          driver_name: string
          engine: string
          id: string
          indy_only_round: number | null
          is_full_season: boolean
          is_rookie: boolean
          nationality: string
          nationality_code: string
          season_year: number
          team: string
        }
        Insert: {
          car_number: string
          driver_name: string
          engine: string
          id?: string
          indy_only_round?: number | null
          is_full_season?: boolean
          is_rookie?: boolean
          nationality: string
          nationality_code: string
          season_year?: number
          team: string
        }
        Update: {
          car_number?: string
          driver_name?: string
          engine?: string
          id?: string
          indy_only_round?: number | null
          is_full_season?: boolean
          is_rookie?: boolean
          nationality?: string
          nationality_code?: string
          season_year?: number
          team?: string
        }
        Relationships: []
      }
      fastest_laps: {
        Row: {
          car_number: string
          driver_name: string | null
          engine: string | null
          id: string
          lap_number: number | null
          race_id: string
          rank: number
          section_length: number | null
          section_length_miles: number | null
          section_name: string
          section_speed: number | null
          section_time: string | null
          session_type: string
          speed: number | null
          time: string | null
        }
        Insert: {
          car_number: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          lap_number?: number | null
          race_id: string
          rank: number
          section_length?: number | null
          section_length_miles?: number | null
          section_name: string
          section_speed?: number | null
          section_time?: string | null
          session_type?: string
          speed?: number | null
          time?: string | null
        }
        Update: {
          car_number?: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          lap_number?: number | null
          race_id?: string
          rank?: number
          section_length?: number | null
          section_length_miles?: number | null
          section_name?: string
          section_speed?: number | null
          section_time?: string | null
          session_type?: string
          speed?: number | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fastest_laps_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      laps_led: {
        Row: {
          car_number: string
          driver_name: string | null
          id: string
          laps_led: number
          longest_consecutive: number
          race_id: string
          start_lap_of_longest: number | null
          stints: number
        }
        Insert: {
          car_number: string
          driver_name?: string | null
          id?: string
          laps_led?: number
          longest_consecutive?: number
          race_id: string
          start_lap_of_longest?: number | null
          stints?: number
        }
        Update: {
          car_number?: string
          driver_name?: string | null
          id?: string
          laps_led?: number
          longest_consecutive?: number
          race_id?: string
          start_lap_of_longest?: number | null
          stints?: number
        }
        Relationships: [
          {
            foreignKeyName: "laps_led_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          car_number: string
          id: string
          infraction: string | null
          lap: number | null
          lap_number: number | null
          penalty: string | null
          race_id: string
          reason: string | null
        }
        Insert: {
          car_number: string
          id?: string
          infraction?: string | null
          lap?: number | null
          lap_number?: number | null
          penalty?: string | null
          race_id: string
          reason?: string | null
        }
        Update: {
          car_number?: string
          id?: string
          infraction?: string | null
          lap?: number | null
          lap_number?: number | null
          penalty?: string | null
          race_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penalties_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      pit_execution: {
        Row: {
          best_transit_time: number | null
          car_number: string
          driver_name: string | null
          entry_route: string | null
          id: string
          pit_lane_speed: number | null
          race_id: string
        }
        Insert: {
          best_transit_time?: number | null
          car_number: string
          driver_name?: string | null
          entry_route?: string | null
          id?: string
          pit_lane_speed?: number | null
          race_id: string
        }
        Update: {
          best_transit_time?: number | null
          car_number?: string
          driver_name?: string | null
          entry_route?: string | null
          id?: string
          pit_lane_speed?: number | null
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pit_execution_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      pit_stops: {
        Row: {
          car_number: string
          driver_name: string | null
          id: string
          lap: number | null
          lap_number: number
          race_id: string
          race_lap: number | null
          stop_number: number
          time_of_race: string | null
        }
        Insert: {
          car_number: string
          driver_name?: string | null
          id?: string
          lap?: number | null
          lap_number: number
          race_id: string
          race_lap?: number | null
          stop_number: number
          time_of_race?: string | null
        }
        Update: {
          car_number?: string
          driver_name?: string | null
          id?: string
          lap?: number | null
          lap_number?: number
          race_id?: string
          race_lap?: number | null
          stop_number?: number
          time_of_race?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pit_stops_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifying_results: {
        Row: {
          avg_speed: number | null
          best_lap_time: string | null
          car_number: string
          comment: string | null
          created_at: string
          driver_name: string | null
          engine: string | null
          id: string
          lap1_time: string | null
          lap2_time: string | null
          qual_position: number
          race_id: string
          total_time: string | null
        }
        Insert: {
          avg_speed?: number | null
          best_lap_time?: string | null
          car_number: string
          comment?: string | null
          created_at?: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          lap1_time?: string | null
          lap2_time?: string | null
          qual_position: number
          race_id: string
          total_time?: string | null
        }
        Update: {
          avg_speed?: number | null
          best_lap_time?: string | null
          car_number?: string
          comment?: string | null
          created_at?: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          lap1_time?: string | null
          lap2_time?: string | null
          qual_position?: number
          race_id?: string
          total_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualifying_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifying_sectors: {
        Row: {
          car_number: string
          created_at: string
          dogleg_speed: number | null
          dogleg_time: number | null
          driver_name: string | null
          front_stretch_speed: number | null
          front_stretch_time: number | null
          full_lap_speed: number | null
          full_lap_time: number | null
          id: string
          lap_number: number
          race_id: string
          turn1_entry_speed: number | null
          turn1_entry_time: number | null
          turn1_exit_speed: number | null
          turn1_exit_time: number | null
          turn2_entry_speed: number | null
          turn2_entry_time: number | null
          turn2_exit_speed: number | null
          turn2_exit_time: number | null
          turn3_entry_speed: number | null
          turn3_entry_time: number | null
          turn3_exit_speed: number | null
          turn3_exit_time: number | null
          turn4_speed: number | null
          turn4_time: number | null
        }
        Insert: {
          car_number: string
          created_at?: string
          dogleg_speed?: number | null
          dogleg_time?: number | null
          driver_name?: string | null
          front_stretch_speed?: number | null
          front_stretch_time?: number | null
          full_lap_speed?: number | null
          full_lap_time?: number | null
          id?: string
          lap_number: number
          race_id: string
          turn1_entry_speed?: number | null
          turn1_entry_time?: number | null
          turn1_exit_speed?: number | null
          turn1_exit_time?: number | null
          turn2_entry_speed?: number | null
          turn2_entry_time?: number | null
          turn2_exit_speed?: number | null
          turn2_exit_time?: number | null
          turn3_entry_speed?: number | null
          turn3_entry_time?: number | null
          turn3_exit_speed?: number | null
          turn3_exit_time?: number | null
          turn4_speed?: number | null
          turn4_time?: number | null
        }
        Update: {
          car_number?: string
          created_at?: string
          dogleg_speed?: number | null
          dogleg_time?: number | null
          driver_name?: string | null
          front_stretch_speed?: number | null
          front_stretch_time?: number | null
          full_lap_speed?: number | null
          full_lap_time?: number | null
          id?: string
          lap_number?: number
          race_id?: string
          turn1_entry_speed?: number | null
          turn1_entry_time?: number | null
          turn1_exit_speed?: number | null
          turn1_exit_time?: number | null
          turn2_entry_speed?: number | null
          turn2_entry_time?: number | null
          turn2_exit_speed?: number | null
          turn2_exit_time?: number | null
          turn3_entry_speed?: number | null
          turn3_entry_time?: number | null
          turn3_exit_speed?: number | null
          turn3_exit_time?: number | null
          turn4_speed?: number | null
          turn4_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qualifying_sectors_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_laps: {
        Row: {
          car_number: string
          driver_name: string | null
          flag: string | null
          flag_status: string | null
          gap: string | null
          gap_to_leader: string | null
          id: string
          lap_number: number
          lap_speed: number | null
          lap_time: string | null
          race_id: string
          speed: number | null
        }
        Insert: {
          car_number: string
          driver_name?: string | null
          flag?: string | null
          flag_status?: string | null
          gap?: string | null
          gap_to_leader?: string | null
          id?: string
          lap_number: number
          lap_speed?: number | null
          lap_time?: string | null
          race_id: string
          speed?: number | null
        }
        Update: {
          car_number?: string
          driver_name?: string | null
          flag?: string | null
          flag_status?: string | null
          gap?: string | null
          gap_to_leader?: string | null
          id?: string
          lap_number?: number
          lap_speed?: number | null
          lap_time?: string | null
          race_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "race_laps_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_pit_times: {
        Row: {
          car_number: string
          driver_name: string
          id: string
          lap_number: number
          pit_speed: number | null
          pit_time_seconds: number
          race_id: string | null
        }
        Insert: {
          car_number: string
          driver_name: string
          id?: string
          lap_number: number
          pit_speed?: number | null
          pit_time_seconds: number
          race_id?: string | null
        }
        Update: {
          car_number?: string
          driver_name?: string
          id?: string
          lap_number?: number
          pit_speed?: number | null
          pit_time_seconds?: number
          race_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_pit_times_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_positions: {
        Row: {
          car_number: string
          id: string
          lap_number: number
          position: number
          race_id: string
        }
        Insert: {
          car_number: string
          id?: string
          lap_number: number
          position: number
          race_id: string
        }
        Update: {
          car_number?: string
          id?: string
          lap_number?: number
          position?: number
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_positions_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_results: {
        Row: {
          avg_speed: number | null
          car_number: string
          championship_rank: number | null
          created_at: string
          driver_name: string
          elapsed_time: string | null
          engine: string
          finish_position: number
          id: string
          laps_completed: number
          laps_down: number
          pit_stops: number
          race_id: string
          race_points: number
          start_position: number
          status: string
          time_gap: string | null
          total_points: number
        }
        Insert: {
          avg_speed?: number | null
          car_number: string
          championship_rank?: number | null
          created_at?: string
          driver_name: string
          elapsed_time?: string | null
          engine: string
          finish_position: number
          id?: string
          laps_completed: number
          laps_down?: number
          pit_stops?: number
          race_id: string
          race_points?: number
          start_position: number
          status?: string
          time_gap?: string | null
          total_points?: number
        }
        Update: {
          avg_speed?: number | null
          car_number?: string
          championship_rank?: number | null
          created_at?: string
          driver_name?: string
          elapsed_time?: string | null
          engine?: string
          finish_position?: number
          id?: string
          laps_completed?: number
          laps_down?: number
          pit_stops?: number
          race_id?: string
          race_points?: number
          start_position?: number
          status?: string
          time_gap?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "race_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          avg_speed: number | null
          best_lead_lap_driver: string | null
          best_lead_lap_speed: number | null
          best_lead_lap_time: string | null
          caution_laps: number | null
          created_at: string
          drivers_led: number | null
          drivers_who_led: number | null
          event_name: string
          fastest_lap_car: string | null
          fastest_lap_driver: string | null
          fastest_lap_number: number | null
          fastest_lap_speed: number | null
          fastest_lap_time: string | null
          files_received: string[] | null
          green_laps: number | null
          id: string
          lead_changes: number | null
          most_improved_car: string | null
          most_improved_driver: string | null
          most_improved_positions: number | null
          position_passes: number | null
          race_date: string
          race_time: string | null
          round_number: number
          season_id: string | null
          season_year: number | null
          status: string
          total_laps: number | null
          total_passes: number | null
          total_race_time: string | null
          track_length_miles: number | null
          track_map_url: string | null
          track_name: string
          track_type: string | null
          year: number
        }
        Insert: {
          avg_speed?: number | null
          best_lead_lap_driver?: string | null
          best_lead_lap_speed?: number | null
          best_lead_lap_time?: string | null
          caution_laps?: number | null
          created_at?: string
          drivers_led?: number | null
          drivers_who_led?: number | null
          event_name: string
          fastest_lap_car?: string | null
          fastest_lap_driver?: string | null
          fastest_lap_number?: number | null
          fastest_lap_speed?: number | null
          fastest_lap_time?: string | null
          files_received?: string[] | null
          green_laps?: number | null
          id?: string
          lead_changes?: number | null
          most_improved_car?: string | null
          most_improved_driver?: string | null
          most_improved_positions?: number | null
          position_passes?: number | null
          race_date: string
          race_time?: string | null
          round_number: number
          season_id?: string | null
          season_year?: number | null
          status?: string
          total_laps?: number | null
          total_passes?: number | null
          total_race_time?: string | null
          track_length_miles?: number | null
          track_map_url?: string | null
          track_name: string
          track_type?: string | null
          year: number
        }
        Update: {
          avg_speed?: number | null
          best_lead_lap_driver?: string | null
          best_lead_lap_speed?: number | null
          best_lead_lap_time?: string | null
          caution_laps?: number | null
          created_at?: string
          drivers_led?: number | null
          drivers_who_led?: number | null
          event_name?: string
          fastest_lap_car?: string | null
          fastest_lap_driver?: string | null
          fastest_lap_number?: number | null
          fastest_lap_speed?: number | null
          fastest_lap_time?: string | null
          files_received?: string[] | null
          green_laps?: number | null
          id?: string
          lead_changes?: number | null
          most_improved_car?: string | null
          most_improved_driver?: string | null
          most_improved_positions?: number | null
          position_passes?: number | null
          race_date?: string
          race_time?: string | null
          round_number?: number
          season_id?: string | null
          season_year?: number | null
          status?: string
          total_laps?: number | null
          total_passes?: number | null
          total_race_time?: string | null
          track_length_miles?: number | null
          track_map_url?: string | null
          track_name?: string
          track_type?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "races_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          series_name: string
          total_rounds: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          series_name?: string
          total_rounds?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          series_name?: string
          total_rounds?: number
          year?: number
        }
        Relationships: []
      }
      session_full_results: {
        Row: {
          best_lap_number: number | null
          best_speed: number | null
          best_time: string | null
          car_number: string
          created_at: string
          diff_to_leader: string | null
          driver_name: string | null
          engine: string | null
          gap_to_ahead: string | null
          id: string
          race_id: string
          rank: number
          session_type: string
          total_laps: number | null
        }
        Insert: {
          best_lap_number?: number | null
          best_speed?: number | null
          best_time?: string | null
          car_number: string
          created_at?: string
          diff_to_leader?: string | null
          driver_name?: string | null
          engine?: string | null
          gap_to_ahead?: string | null
          id?: string
          race_id: string
          rank: number
          session_type: string
          total_laps?: number | null
        }
        Update: {
          best_lap_number?: number | null
          best_speed?: number | null
          best_time?: string | null
          car_number?: string
          created_at?: string
          diff_to_leader?: string | null
          driver_name?: string | null
          engine?: string | null
          gap_to_ahead?: string | null
          id?: string
          race_id?: string
          rank?: number
          session_type?: string
          total_laps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_full_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      session_results: {
        Row: {
          best_speed: number | null
          best_time: string | null
          car_number: string
          driver_name: string | null
          engine: string | null
          id: string
          laps_run: number | null
          position: number
          race_id: string
          session_type: string
        }
        Insert: {
          best_speed?: number | null
          best_time?: string | null
          car_number: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          laps_run?: number | null
          position: number
          race_id: string
          session_type: string
        }
        Update: {
          best_speed?: number | null
          best_time?: string | null
          car_number?: string
          driver_name?: string | null
          engine?: string | null
          id?: string
          laps_run?: number | null
          position?: number
          race_id?: string
          session_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      session_statistics: {
        Row: {
          id: string
          laps: number
          miles: number | null
          race_id: string
          session_type: string
          time_on_track: string | null
        }
        Insert: {
          id?: string
          laps?: number
          miles?: number | null
          race_id: string
          session_type: string
          time_on_track?: string | null
        }
        Update: {
          id?: string
          laps?: number
          miles?: number | null
          race_id?: string
          session_type?: string
          time_on_track?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_statistics_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
