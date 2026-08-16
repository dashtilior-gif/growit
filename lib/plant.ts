import { listHabits, allCompletionDates, getProfile, doneTodayCount } from "./data";

// ---- Helpers -------------------------------------------------------------
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((da - db) / 86400000);
}

// ---- Growth stages -------------------------------------------------------
export type Stage = {
  key: string;
  name: string;
  emoji: string;
  minXp: number;
  art: string;
};

export const STAGES: Stage[] = [
  { key: "seed", name: "Seed", emoji: "🌰", minXp: 0, art: "a tiny seed nestled in dark soil" },
  { key: "sprout", name: "Sprout", emoji: "🌱", minXp: 30, art: "a bright green sprout with two leaves" },
  { key: "sapling", name: "Sapling", emoji: "🌿", minXp: 80, art: "a young sapling with a thin trunk" },
  { key: "bloom", name: "Blooming Tree", emoji: "🌳", minXp: 180, art: "a full tree with thick branches" },
  { key: "golden", name: "Golden Fruit Tree", emoji: "🌟", minXp: 320, art: "a radiant golden tree with glowing fruit" },
];

export function stageForXp(xp: number): Stage {
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (xp >= s.minXp) stage = s;
  }
  return stage;
}

export function nextStage(xp: number): Stage | null {
  return STAGES.find((s) => s.minXp > xp) ?? null;
}

export function stageProgress(xp: number): number {
  const cur = stageForXp(xp);
  const next = nextStage(xp);
  if (!next) return 1;
  const span = next.minXp - cur.minXp;
  return Math.min(1, (xp - cur.minXp) / span);
}

// XP cost of a single completion (flat, keeps it predictable).
export const XP_PER_COMPLETION = 6;

// Anti-cheat: minimum time between two completions (ms). Stops button-mashing.
export const COMPLETION_COOLDOWN_MS = 90_000; // 90 seconds

// Anti-cheat: at these streak milestones the user must verify the streak is real.
export const STREAK_VERIFY_THRESHOLDS = [3, 7, 14, 30];

// ---- Wilting / loss-aversion ------------------------------------------------
export type WilState = {
  level: number; // 0 healthy, 1 droopy, 2 wilting, 3 dormant
  label: string;
  missedDays: number;
};

export function wilStateFor(missedDays: number): WilState {
  if (missedDays <= 0) return { level: 0, label: "Healthy", missedDays };
  if (missedDays === 1) return { level: 1, label: "Droopy", missedDays };
  if (missedDays <= 3) return { level: 2, label: "Wilting", missedDays };
  return { level: 3, label: "Dormant", missedDays };
}

// ---- Garden state (assembled for the UI + share) -----------------------------
export type GardenState = {
  xp: number;
  stage: Stage;
  stageIndex: number;
  nextStage: Stage | null;
  nextStageXp: number | null;
  progressPct: number;
  streak: number;
  bestStreak: number;
  wil: WilState;
  doneToday: number;
  totalHabits: number;
  freezeTokens: number;
  plantName: string;
  verifiedStreak: number;
  needsVerify: boolean;
};

export async function computeGarden(): Promise<GardenState> {
  const profile = await getProfile();
  const dates = new Set(await allCompletionDates());
  const today = todayStr();

  // Streak: count consecutive days ending today (or yesterday if none today yet).
  let streak = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const doneToday = await doneTodayCount(today);
  const totalHabits = (await listHabits()).length;

  const lastDone = profile.last_active_on;
  let missedDays = 0;
  if (lastDone) {
    let probe = addDays(lastDone, 1);
    while (probe < today && !dates.has(probe)) {
      missedDays++;
      probe = addDays(probe, 1);
    }
  }

  const stage = stageForXp(profile.xp);
  const next = nextStage(profile.xp);
  const wil = wilStateFor(missedDays);

  // Streak verification: if the current streak crosses an un-verified milestone,
  // the UI must ask the player to prove it before it "counts".
  const verifiedStreak = profile.verified_streak || 0;
  const needsVerify =
    STREAK_VERIFY_THRESHOLDS.includes(streak) && streak > verifiedStreak;

  return {
    xp: profile.xp,
    stage,
    stageIndex: STAGES.findIndex((s) => s.key === stage.key),
    nextStage: next,
    nextStageXp: next?.minXp ?? null,
    progressPct: stageProgress(profile.xp),
    streak,
    bestStreak: Math.max(profile.best_streak, streak),
    wil,
    doneToday,
    totalHabits,
    freezeTokens: profile.freeze_tokens,
    plantName: profile.plant_name,
    verifiedStreak,
    needsVerify,
  };
}