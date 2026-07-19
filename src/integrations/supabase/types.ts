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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academies: {
        Row: {
          address: string | null
          approved: boolean
          city: string | null
          cover_url: string | null
          created_at: string
          description_ar: string | null
          id: string
          logo_url: string | null
          name_ar: string
          owner_id: string | null
          phone: string | null
          rating: number | null
          reviews_count: number | null
          verified: boolean
        }
        Insert: {
          address?: string | null
          approved?: boolean
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          id?: string
          logo_url?: string | null
          name_ar: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          verified?: boolean
        }
        Update: {
          address?: string | null
          approved?: boolean
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          id?: string
          logo_url?: string | null
          name_ar?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          verified?: boolean
        }
        Relationships: []
      }
      academy_sports: {
        Row: {
          academy_id: string
          sport_id: string
        }
        Insert: {
          academy_id: string
          sport_id: string
        }
        Update: {
          academy_id?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_sports_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          academy_id: string | null
          booking_date: string
          coach_id: string | null
          created_at: string
          duration_min: number
          id: string
          notes: string | null
          player_id: string
          price: number
          qr_code: string
          sport_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          academy_id?: string | null
          booking_date: string
          coach_id?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          player_id: string
          price?: number
          qr_code?: string
          sport_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          academy_id?: string | null
          booking_date?: string
          coach_id?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          player_id?: string
          price?: number
          qr_code?: string
          sport_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_availability: {
        Row: {
          coach_id: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          coach_id: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          coach_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sports: {
        Row: {
          coach_id: string
          sport_id: string
        }
        Insert: {
          coach_id: string
          sport_id: string
        }
        Update: {
          coach_id?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_sports_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          approved: boolean
          avatar_url: string | null
          bio_ar: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          experience_years: number | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          languages: string[] | null
          price_per_session: number
          rating: number | null
          reviews_count: number | null
          session_duration_min: number
          title_ar: string | null
          user_id: string | null
          verified: boolean
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          bio_ar?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          experience_years?: number | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          languages?: string[] | null
          price_per_session?: number
          rating?: number | null
          reviews_count?: number | null
          session_duration_min?: number
          title_ar?: string | null
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          bio_ar?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          experience_years?: number | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          languages?: string[] | null
          price_per_session?: number
          rating?: number | null
          reviews_count?: number | null
          session_duration_min?: number
          title_ar?: string | null
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      favorites: {
        Row: {
          academy_id: string | null
          coach_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          academy_id?: string | null
          coach_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          academy_id?: string | null
          coach_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          onboarded: boolean
          phone: string | null
          primary_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          onboarded?: boolean
          phone?: string | null
          primary_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          onboarded?: boolean
          phone?: string | null
          primary_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          academy_id: string | null
          author_id: string
          coach_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          academy_id?: string | null
          author_id: string
          coach_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          academy_id?: string | null
          author_id?: string
          coach_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          emoji: string
          id: string
          name_ar: string
          slug: string
          sort_order: number
        }
        Insert: {
          emoji?: string
          id?: string
          name_ar: string
          slug: string
          sort_order?: number
        }
        Update: {
          emoji?: string
          id?: string
          name_ar?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "player" | "coach" | "academy" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rejected"
      gender_type: "male" | "female"
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
    Enums: {
      app_role: ["player", "coach", "academy", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
      ],
      gender_type: ["male", "female"],
    },
  },
} as const
