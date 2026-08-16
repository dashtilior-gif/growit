import { supabase, isSupabaseConfigured } from "./supabase";

// SQLite is loaded lazily and ONLY when Supabase is not configured (local dev).
// This keeps better-sqlite3 + its DB file out of the production (Vercel) bundle.
type SqliteMod = typeof import("./db");
let sqlite: SqliteMod | null = null;
async function getSqlite(): Promise<SqliteMod> {
  if (!sqlite) sqlite = await import("./db");
  return sqlite;
}

// ---- Types ---------------------------------------------------------------
export type HabitRow = {
  id: number;
  name: string;
  emoji: string;
  category: string;
};

export type ProfileRow = {
  plant_name: string;
  xp: number;
  streak_days: number;
  best_streak: number;
  last_active_on: string | null;
  freeze_tokens: number;
  last_completed_at: number | null;
  verified_streak: number;
};

// ---- Supabase helpers ----------------------------------------------------
async function supabaseProfile(): Promise<ProfileRow> {
  const { data, error } = await supabase!
    .from("profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: insErr } = await supabase!.from("profile").insert({ id: 1 });
    if (insErr) throw insErr;
    return supabaseProfile();
  }
  return data as unknown as ProfileRow;
}

async function supabaseListHabits(): Promise<HabitRow[]> {
  const { data, error } = await supabase!
    .from("habits")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as HabitRow[];
}

async function supabaseAddHabit(name: string, emoji: string, category: string): Promise<number> {
  const { data, error } = await supabase!
    .from("habits")
    .insert({ name, emoji, category })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
}

async function supabaseDeleteHabit(id: number): Promise<void> {
  const { error: cErr } = await supabase!.from("completions").delete().eq("habit_id", id);
  if (cErr) throw cErr;
  const { error } = await supabase!.from("habits").delete().eq("id", id);
  if (error) throw error;
}

async function supabaseIsDoneToday(habitId: number, date: string): Promise<boolean> {
  const { count, error } = await supabase!
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("habit_id", habitId)
    .eq("done_on", date);
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function supabaseCompleteHabit(habitId: number, date: string, honesty: string, note: string): Promise<void> {
  const { error } = await supabase!
    .from("completions")
    .insert({ habit_id: habitId, done_on: date, honesty, note });
  if (error) throw error;
}

async function supabaseUncompleteHabit(habitId: number, date: string): Promise<void> {
  const { error } = await supabase!
    .from("completions")
    .delete()
    .eq("habit_id", habitId)
    .eq("done_on", date);
  if (error) throw error;
}

async function supabaseAllDates(): Promise<string[]> {
  const { data, error } = await supabase!.from("completions").select("done_on");
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => (r as { done_on: string }).done_on))];
}

async function supabaseDoneTodayCount(date: string): Promise<number> {
  const { count, error } = await supabase!
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("done_on", date);
  if (error) throw error;
  return count ?? 0;
}

async function supabaseUpdateXp(xp: number): Promise<void> {
  const { error } = await supabase!.from("profile").update({ xp }).eq("id", 1);
  if (error) throw error;
}

async function supabaseSetPlantName(name: string): Promise<void> {
  const { error } = await supabase!.from("profile").update({ plant_name: name }).eq("id", 1);
  if (error) throw error;
}

async function supabaseTouchActive(date: string): Promise<void> {
  const { error } = await supabase!.from("profile").update({ last_active_on: date }).eq("id", 1);
  if (error) throw error;
}

async function supabaseSetLastCompletedAt(ts: number): Promise<void> {
  const { error } = await supabase!.from("profile").update({ last_completed_at: ts }).eq("id", 1);
  if (error) throw error;
}

async function supabaseSetVerifiedStreak(n: number): Promise<void> {
  const { error } = await supabase!.from("profile").update({ verified_streak: n }).eq("id", 1);
  if (error) throw error;
}

// ---- Types ---------------------------------------------------------------
export type PlayerRow = {
  id: number;
  display_name: string;
  avatar: string;
  xp: number;
  streak: number;
  best_streak: number;
  is_community: number;
};

export type QuestRow = {
  id: number;
  key: string;
  title: string;
  description: string;
  emoji: string;
  kind: string;
  goal: number;
  reward_xp: number;
};

// ---- Supabase helpers (quests + leaderboard) -----------------------------
async function supabaseListPlayers(): Promise<PlayerRow[]> {
  const { data, error } = await supabase!
    .from("players")
    .select("*")
    .order("xp", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlayerRow[];
}

async function supabaseAddPlayer(name: string, avatar: string, xp: number, streak: number, best: number): Promise<number> {
  const { data, error } = await supabase!
    .from("players")
    .insert({ display_name: name, avatar, xp, streak, best_streak: best, is_community: 0 })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
}

async function supabaseUpdatePlayer(id: number, xp: number, streak: number, best: number): Promise<void> {
  const { error } = await supabase!
    .from("players")
    .update({ xp, streak, best_streak: best })
    .eq("id", id)
    .eq("is_community", 0);
  if (error) throw error;
}

async function supabaseListQuests(): Promise<QuestRow[]> {
  const { data, error } = await supabase!
    .from("quests")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as QuestRow[];
}

async function supabaseClaimQuest(questId: number, date: string): Promise<void> {
  const { error } = await supabase!.from("quest_claims").insert({ quest_id: questId, claimed_on: date });
  if (error && !(error as { code?: string }).code?.startsWith("23")) throw error; // ignore unique violation
}

async function supabaseIsQuestClaimed(questId: number, date: string): Promise<boolean> {
  const { count, error } = await supabase!
    .from("quest_claims")
    .select("id", { count: "exact", head: true })
    .eq("quest_id", questId)
    .eq("claimed_on", date);
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function supabaseDistinctDaysUntil(date: string): Promise<number> {
  const { data, error } = await supabase!
    .from("completions")
    .select("done_on")
    .lte("done_on", date);
  if (error) throw error;
  return new Set((data ?? []).map((r) => (r as { done_on: string }).done_on)).size;
}

// ---- Public unified API --------------------------------------------------
export async function listPlayers(): Promise<PlayerRow[]> {
  if (isSupabaseConfigured) return supabaseListPlayers();
  return (await getSqlite()).listPlayers();
}

export async function addPlayer(name: string, avatar: string, xp: number, streak: number, best: number): Promise<number> {
  if (isSupabaseConfigured) return supabaseAddPlayer(name, avatar, xp, streak, best);
  return (await getSqlite()).addPlayer(name, avatar, xp, streak, best);
}

export async function updatePlayer(id: number, xp: number, streak: number, best: number): Promise<void> {
  if (isSupabaseConfigured) return supabaseUpdatePlayer(id, xp, streak, best);
  (await getSqlite()).updatePlayer(id, xp, streak, best);
}

export async function listQuests(): Promise<QuestRow[]> {
  if (isSupabaseConfigured) return supabaseListQuests();
  return (await getSqlite()).listQuests();
}

export async function claimQuest(questId: number, date: string): Promise<void> {
  if (isSupabaseConfigured) return supabaseClaimQuest(questId, date);
  (await getSqlite()).claimQuest(questId, date);
}

export async function isQuestClaimed(questId: number, date: string): Promise<boolean> {
  if (isSupabaseConfigured) return supabaseIsQuestClaimed(questId, date);
  return (await getSqlite()).isQuestClaimed(questId, date);
}

export async function distinctDaysUntil(date: string): Promise<number> {
  if (isSupabaseConfigured) return supabaseDistinctDaysUntil(date);
  return (await getSqlite()).distinctActiveDaysUntil(date);
}
export async function getProfile(): Promise<ProfileRow> {
  if (isSupabaseConfigured) return supabaseProfile();
  return (await getSqlite()).getProfile();
}

export async function listHabits(): Promise<HabitRow[]> {
  if (isSupabaseConfigured) return supabaseListHabits();
  return (await getSqlite()).listHabits();
}

export async function addHabit(name: string, emoji: string, category: string): Promise<number> {
  if (isSupabaseConfigured) return supabaseAddHabit(name, emoji, category);
  return (await getSqlite()).addHabit(name, emoji, category);
}

export async function deleteHabit(id: number): Promise<void> {
  if (isSupabaseConfigured) return supabaseDeleteHabit(id);
  return (await getSqlite()).deleteHabit(id);
}

export async function isDoneToday(habitId: number, date: string): Promise<boolean> {
  if (isSupabaseConfigured) return supabaseIsDoneToday(habitId, date);
  return (await getSqlite()).isDoneToday(habitId, date);
}

export async function completeHabit(habitId: number, date: string, honesty: string = "full", note: string = ""): Promise<void> {
  if (isSupabaseConfigured) return supabaseCompleteHabit(habitId, date, honesty, note);
  (await getSqlite()).completeHabit(habitId, date, honesty, note);
}

export async function setLastCompletedAt(ts: number): Promise<void> {
  if (isSupabaseConfigured) return supabaseSetLastCompletedAt(ts);
  (await getSqlite()).setCompletedNow(ts);
}

export async function setVerifiedStreak(n: number): Promise<void> {
  if (isSupabaseConfigured) return supabaseSetVerifiedStreak(n);
  (await getSqlite()).setVerifiedStreak(n);
}

export async function uncompleteHabit(habitId: number, date: string): Promise<void> {
  if (isSupabaseConfigured) return supabaseUncompleteHabit(habitId, date);
  (await getSqlite()).uncompleteHabit(habitId, date);
}

export async function allCompletionDates(): Promise<string[]> {
  if (isSupabaseConfigured) return supabaseAllDates();
  return (await getSqlite()).allCompletionDates();
}

export async function doneTodayCount(date: string): Promise<number> {
  if (isSupabaseConfigured) return supabaseDoneTodayCount(date);
  return (await getSqlite()).doneTodayCount(date);
}

export async function updateXp(xp: number): Promise<void> {
  if (isSupabaseConfigured) return supabaseUpdateXp(xp);
  (await getSqlite()).updateXp(xp);
}

export async function setPlantName(name: string): Promise<void> {
  if (isSupabaseConfigured) return supabaseSetPlantName(name);
  (await getSqlite()).setPlantName(name);
}

export async function touchActive(date: string): Promise<void> {
  if (isSupabaseConfigured) return supabaseTouchActive(date);
  (await getSqlite()).touchActive(date);
}