// Admin-side convenience helpers over the canonical, backend-owned
// `database.types.ts` (which is a verbatim copy from ../mathetes-backend and is
// never hand-edited, so re-syncs are a pure copy). Import DB types from here.
export * from "./database.types";
import type { Database } from "./database.types";

type DB = Database["public"];

export type Tables<T extends keyof DB["Tables"]> = DB["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DB["Tables"]> = DB["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DB["Tables"]> = DB["Tables"][T]["Update"];

// Domain enums. The introspected backend file types these columns loosely as
// `string`; the DB CHECK constraints enforce the precise values, so admin code
// uses these literal unions for validation and exhaustive UI mapping. (Reads
// from the loose row types are cast to these at the query boundary.)
export type ContentStatus = "draft" | "scheduled" | "published";
export type PlanDifficulty = "starter" | "intermediate" | "deep";
export type UserRole =
  | "member"
  | "house_leader"
  | "discipler"
  | "pastor"
  | "admin";
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
export type AnnouncementBanner = "event" | "urgent";
