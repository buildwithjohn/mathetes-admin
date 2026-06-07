// Placeholder database types.
//
// Regenerate the real ones from the backend after any migration:
//   cd ../mathetes-backend && ./scripts/generate-types.sh
// which runs `supabase gen types typescript --local` and copies the result
// here. Until then this structural stub keeps the app type-safe without `any`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableShape = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export interface Database {
  public: {
    Tables: Record<string, TableShape>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
}
