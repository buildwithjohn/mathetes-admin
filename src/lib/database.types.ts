// Database types for the Mathetes backend.
//
// These mirror the schema in ../mathetes-backend (migrations 0001 identity and
// 0002 content). Regenerate the authoritative version after any migration:
//   cd ../mathetes-backend && ./scripts/generate-types.sh
// which runs `supabase gen types typescript --local` and copies the result here.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentStatus = "draft" | "scheduled" | "published";
export type UserRole =
  | "member"
  | "house_leader"
  | "discipler"
  | "pastor"
  | "admin";

export interface Database {
  public: {
    Tables: {
      parishes: {
        Row: {
          id: string;
          slug: string;
          name: string;
          abbr: string;
          campus_name: string | null;
          network_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          abbr: string;
          campus_name?: string | null;
          network_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          abbr?: string;
          campus_name?: string | null;
          network_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      houses: {
        Row: {
          id: string;
          parish_id: string;
          slug: string;
          name: string;
          color: string;
          verse: string | null;
          verse_ref: string | null;
          leader_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          slug: string;
          name: string;
          color: string;
          verse?: string | null;
          verse_ref?: string | null;
          leader_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          slug?: string;
          name?: string;
          color?: string;
          verse?: string | null;
          verse_ref?: string | null;
          leader_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          auth_id: string;
          parish_id: string | null;
          house_id: string | null;
          name: string;
          photo_url: string | null;
          photo_visibility: "parish" | "house" | "none";
          role: UserRole;
          gender: "male" | "female" | null;
          year: string | null;
          dept: string | null;
          pinned_verse_ref: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          parish_id?: string | null;
          house_id?: string | null;
          name: string;
          photo_url?: string | null;
          photo_visibility?: "parish" | "house" | "none";
          role?: UserRole;
          gender?: "male" | "female" | null;
          year?: string | null;
          dept?: string | null;
          pinned_verse_ref?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          parish_id?: string | null;
          house_id?: string | null;
          name?: string;
          photo_url?: string | null;
          photo_visibility?: "parish" | "house" | "none";
          role?: UserRole;
          gender?: "male" | "female" | null;
          year?: string | null;
          dept?: string | null;
          pinned_verse_ref?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      user_privacy: {
        Row: {
          user_id: string;
          dm_who: "all_parish" | "house" | "discipler" | "none";
          cross_gender_dm_approval: boolean;
          mentions_notify: boolean;
        };
        Insert: {
          user_id: string;
          dm_who?: "all_parish" | "house" | "discipler" | "none";
          cross_gender_dm_approval?: boolean;
          mentions_notify?: boolean;
        };
        Update: {
          user_id?: string;
          dm_who?: "all_parish" | "house" | "discipler" | "none";
          cross_gender_dm_approval?: boolean;
          mentions_notify?: boolean;
        };
        Relationships: [];
      };
      devotional_series: {
        Row: {
          id: string;
          parish_id: string;
          title: string;
          description: string | null;
          total_days: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          title: string;
          description?: string | null;
          total_days?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          title?: string;
          description?: string | null;
          total_days?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      devotionals: {
        Row: {
          id: string;
          parish_id: string;
          series_id: string | null;
          day_in_series: number | null;
          title: string;
          body_md: string;
          scripture_refs: string[];
          reading_time_minutes: number | null;
          audio_url: string | null;
          author_id: string | null;
          publish_date: string | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          series_id?: string | null;
          day_in_series?: number | null;
          title: string;
          body_md?: string;
          scripture_refs?: string[];
          reading_time_minutes?: number | null;
          audio_url?: string | null;
          author_id?: string | null;
          publish_date?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          series_id?: string | null;
          day_in_series?: number | null;
          title?: string;
          body_md?: string;
          scripture_refs?: string[];
          reading_time_minutes?: number | null;
          audio_url?: string | null;
          author_id?: string | null;
          publish_date?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      word_of_day: {
        Row: {
          id: string;
          parish_id: string;
          verse_ref: string;
          verse_text: string;
          reflection_md: string | null;
          prompt: string | null;
          author_id: string | null;
          publish_date: string | null;
          status: ContentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          verse_ref: string;
          verse_text: string;
          reflection_md?: string | null;
          prompt?: string | null;
          author_id?: string | null;
          publish_date?: string | null;
          status?: ContentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          verse_ref?: string;
          verse_text?: string;
          reflection_md?: string | null;
          prompt?: string | null;
          author_id?: string | null;
          publish_date?: string | null;
          status?: ContentStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      content_assets: {
        Row: {
          id: string;
          devotional_id: string | null;
          word_of_day_id: string | null;
          url: string;
          kind: "image" | "audio";
          created_at: string;
        };
        Insert: {
          id?: string;
          devotional_id?: string | null;
          word_of_day_id?: string | null;
          url: string;
          kind: "image" | "audio";
          created_at?: string;
        };
        Update: {
          id?: string;
          devotional_id?: string | null;
          word_of_day_id?: string | null;
          url?: string;
          kind?: "image" | "audio";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      todays_word_of_day: {
        Row: Database["public"]["Tables"]["word_of_day"]["Row"];
        Relationships: [];
      };
      todays_devotional: {
        Row: Database["public"]["Tables"]["devotionals"]["Row"];
        Relationships: [];
      };
    };
    Functions: {
      current_parish_id: { Args: Record<string, never>; Returns: string };
      current_profile_id: { Args: Record<string, never>; Returns: string };
      current_house_id: { Args: Record<string, never>; Returns: string };
      current_user_role: { Args: Record<string, never>; Returns: string };
      is_parish_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience helpers (mirrors the tail of a generated types file).
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
