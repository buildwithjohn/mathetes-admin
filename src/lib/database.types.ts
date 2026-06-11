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
export type AnnouncementBanner = "event" | "urgent";
export type AskPrivacy = "public" | "private";
export type AskStatus = "awaiting" | "answered";
export type ReportTargetType =
  | "message"
  | "user"
  | "prayer_request"
  | "ask_question";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ModerationSeverity = "low" | "medium" | "high";
export type ModerationAction = "logged" | "soft_deleted" | "escalated";
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
          discipler_id: string | null;
          campus_id: string | null;
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
          discipler_id?: string | null;
          campus_id?: string | null;
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
          discipler_id?: string | null;
          campus_id?: string | null;
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
      announcements: {
        Row: {
          id: string;
          parish_id: string;
          title: string;
          body_md: string;
          event_data: Json | null;
          banner: AnnouncementBanner | null;
          photos: string[];
          status: ContentStatus;
          publish_date: string | null;
          posted_at: string | null;
          posted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          title: string;
          body_md?: string;
          event_data?: Json | null;
          banner?: AnnouncementBanner | null;
          photos?: string[];
          status?: ContentStatus;
          publish_date?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          title?: string;
          body_md?: string;
          event_data?: Json | null;
          banner?: AnnouncementBanner | null;
          photos?: string[];
          status?: ContentStatus;
          publish_date?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ask_questions: {
        Row: {
          id: string;
          parish_id: string;
          asker_id: string;
          body: string;
          category: string | null;
          privacy: AskPrivacy;
          urgent: boolean;
          status: AskStatus;
          response_body: string | null;
          answered_at: string | null;
          answered_by: string | null;
          public_anonymized: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          asker_id: string;
          body: string;
          category?: string | null;
          privacy?: AskPrivacy;
          urgent?: boolean;
          status?: AskStatus;
          response_body?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          public_anonymized?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          asker_id?: string;
          body?: string;
          category?: string | null;
          privacy?: AskPrivacy;
          urgent?: boolean;
          status?: AskStatus;
          response_body?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          public_anonymized?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      verse_images: {
        Row: {
          id: string;
          user_id: string;
          verse_ref: string;
          verse_text: string;
          theme: "minimal" | "organic" | "bold";
          aspect_ratio: "square" | "story";
          watermark: boolean;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verse_ref: string;
          verse_text: string;
          theme?: "minimal" | "organic" | "bold";
          aspect_ratio?: "square" | "story";
          watermark?: boolean;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          verse_ref?: string;
          verse_text?: string;
          theme?: "minimal" | "organic" | "bold";
          aspect_ratio?: "square" | "story";
          watermark?: boolean;
          url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      campuses: {
        Row: {
          id: string;
          parish_id: string;
          slug: string;
          name: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          slug: string;
          name: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          slug?: string;
          name?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      engagement_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          target_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          target_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          target_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_count: number;
          longest: number;
          last_check_in: string | null;
          grace_used_this_month: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_count?: number;
          longest?: number;
          last_check_in?: string | null;
          grace_used_this_month?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_count?: number;
          longest?: number;
          last_check_in?: string | null;
          grace_used_this_month?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          preview: string | null;
          target_id: string | null;
          target_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          preview?: string | null;
          target_id?: string | null;
          target_url?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          preview?: string | null;
          target_id?: string | null;
          target_url?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          parish_id: string;
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: string | null;
          status: ReportStatus;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parish_id: string;
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason?: string | null;
          status?: ReportStatus;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parish_id?: string;
          reporter_id?: string;
          target_type?: ReportTargetType;
          target_id?: string;
          reason?: string | null;
          status?: ReportStatus;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      moderation_log: {
        Row: {
          id: string;
          message_id: string | null;
          flag: string;
          severity: ModerationSeverity;
          action_taken: ModerationAction;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id?: string | null;
          flag: string;
          severity: ModerationSeverity;
          action_taken: ModerationAction;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string | null;
          flag?: string;
          severity?: ModerationSeverity;
          action_taken?: ModerationAction;
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
      answer_question: {
        Args: { p_id: string; p_response: string; p_public?: boolean };
        Returns: Database["public"]["Tables"]["ask_questions"]["Row"];
      };
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
