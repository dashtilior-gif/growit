import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Credentials come from environment variables (never hardcode them).
// Server-side: prefer the SERVICE ROLE key (bypasses RLS) for a single-user app.
// NEXT_PUBLIC_* variants also work so the same code can run on the browser.
const url =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, key)
  : null;