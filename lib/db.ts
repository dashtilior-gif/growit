import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// The database lives on the server's writable disk (NOT the app bundle).
const DATA_DIR =
  process.env.GROWIT_DATA_DIR ||
  path.join(process.cwd(), ".data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, "growit.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '💪',
    category TEXT NOT NULL DEFAULT 'self',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    done_on TEXT NOT NULL,           -- local date YYYY-MM-DD
    honesty TEXT NOT NULL DEFAULT 'full', -- full | partial | none (anti-cheat)
    note TEXT NOT NULL DEFAULT '',    -- optional proof note
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (habit_id, done_on)
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    plant_name TEXT NOT NULL DEFAULT 'Sprout',
    xp INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_active_on TEXT,
    freeze_tokens INTEGER NOT NULL DEFAULT 1,
    last_completed_at INTEGER,        -- epoch ms, for anti-cheat cooldown
    verified_streak INTEGER NOT NULL DEFAULT 0  -- highest streak the user proved
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🌱',
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    is_community INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    emoji TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'milestone', -- milestone | daily
    goal INTEGER NOT NULL DEFAULT 1,
    reward_xp INTEGER NOT NULL DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS quest_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    claimed_on TEXT NOT NULL,
    UNIQUE (quest_id, claimed_on)
  );

  CREATE INDEX IF NOT EXISTS idx_completions_habit ON completions(habit_id);
  CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(done_on);

  INSERT OR IGNORE INTO quests (key, title, description, emoji, kind, goal, reward_xp) VALUES
    ('first_habit', 'First Steps', 'Add your very first habit', '🌱', 'milestone', 1, 10),
    ('three_day', '3 Habits in a Day', 'Complete 3 habits in one day', '💧', 'daily', 3, 20),
    ('streak_3', 'On a Roll', 'Reach a 3-day streak', '🔥', 'milestone', 3, 15),
    ('streak_7', 'Week Warrior', 'Reach a 7-day streak', '⭐', 'milestone', 7, 40),
    ('xp_100', 'Century Club', 'Reach 100 XP', '💯', 'milestone', 100, 30),
    ('xp_300', 'Golden Grower', 'Grow a Golden Fruit Tree (320 XP)', '🌟', 'milestone', 320, 80),
    ('calendar_5', 'Coming Back', 'Show up on 5 different days', '📅', 'milestone', 5, 25);

  INSERT OR IGNORE INTO players (display_name, avatar, xp, streak, best_streak, is_community) VALUES
    ('Maya 🌸', '🌸', 412, 21, 34, 1),
    ('Coach Pete', '🧑‍🦱', 388, 14, 20, 1),
    ('Sunny Sally', '🌻', 355, 19, 26, 1),
    ('Tiny Tom', '🦖', 301, 9, 15, 1),
    ('Grace', '💖', 274, 12, 18, 1),
    ('Pixel Pop', '🦄', 240, 8, 11, 1),
    ('Nana June', '🧑‍🍳', 210, 17, 21, 1),
    ('Skip Skipper', '🚀', 180, 4, 9, 1),
    ('Breezy Bea', '🍃', 150, 10, 12, 1),
    ('Kiddo Kai', '🎮', 120, 3, 5, 1),
    ('Wandering Will', '🧳', 90, 2, 4, 1),
    ('Newbie Nova', '🐣', 40, 1, 1, 1);
`);

// Migrations run after table creation so they don't crash a fresh DB.
function tryColumn(table: string, colDef: string): void {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${colDef}`).run();
  } catch {
    /* column already exists — fine */
  }
}
tryColumn("completions", "honesty TEXT NOT NULL DEFAULT 'full'");
tryColumn("completions", "note TEXT NOT NULL DEFAULT ''");
tryColumn("profile", "last_completed_at INTEGER");
tryColumn("profile", "verified_streak INTEGER NOT NULL DEFAULT 0");


// -- Profile singleton -----------------------------------------------------
export function ensureProfile(): void {
  db.prepare("INSERT OR IGNORE INTO profile (id) VALUES (1)").run();
}

export function getProfile() {
  ensureProfile();
  return db
    .prepare(
      `SELECT plant_name, xp, streak_days, best_streak, last_active_on, freeze_tokens, last_completed_at, verified_streak FROM profile WHERE id = 1`
    )
    .get() as
    | {
        plant_name: string;
        xp: number;
        streak_days: number;
        best_streak: number;
        last_active_on: string | null;
        freeze_tokens: number;
        last_completed_at: number | null;
        verified_streak: number;
      };
}

export function updateXp(xp: number): void {
  db.prepare("UPDATE profile SET xp = ? WHERE id = 1").run(xp);
}

export function setPlantName(name: string): void {
  db.prepare("UPDATE profile SET plant_name = ? WHERE id = 1").run(name);
}

export function touchActive(date: string): void {
  db.prepare("UPDATE profile SET last_active_on = ? WHERE id = 1").run(date);
}

export function doneTodayCount(date: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM completions WHERE done_on = ?")
    .get(date) as { c: number };
  return row.c;
}

// -- Habits ---------------------------------------------------------------
export type HabitRow = {
  id: number;
  name: string;
  emoji: string;
  category: string;
};

export function listHabits(): HabitRow[] {
  return db.prepare("SELECT * FROM habits ORDER BY id ASC").all() as HabitRow[];
}

export function addHabit(name: string, emoji: string, category: string): number {
  const info = db
    .prepare("INSERT INTO habits (name, emoji, category) VALUES (?, ?, ?)")
    .run(name, emoji, category);
  return Number(info.lastInsertRowid);
}

export function deleteHabit(id: number): void {
  db.prepare("DELETE FROM completions WHERE habit_id = ?").run(id);
  db.prepare("DELETE FROM habits WHERE id = ?").run(id);
}

// -- Completions ----------------------------------------------------------
export function isDoneToday(habitId: number, date: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM completions WHERE habit_id = ? AND done_on = ?")
    .get(habitId, date);
  return !!row;
}

export function completeHabit(habitId: number, date: string, honesty: string = "full", note: string = ""): void {
  db.prepare("INSERT OR IGNORE INTO completions (habit_id, done_on, honesty, note) VALUES (?, ?, ?, ?)").run(
    habitId,
    date,
    honesty,
    note
  );
}

export function uncompleteHabit(habitId: number, date: string): void {
  db.prepare("DELETE FROM completions WHERE habit_id = ? AND done_on = ?").run(habitId, date);
}

// Anti-cheat: last completion timestamp (epoch ms) to enforce a cooldown.
export function lastCompletedAt(): number | null {
  const row = db.prepare("SELECT last_completed_at AS t FROM profile WHERE id = 1").get() as { t: number | null };
  return row.t;
}

export function setCompletedNow(ts = Date.now()): void {
  db.prepare("UPDATE profile SET last_completed_at = ? WHERE id = 1").run(ts);
}

// Anti-cheat: mark the highest streak the user has explicitly verified.
export function verifiedStreak(): number {
  const row = db.prepare("SELECT verified_streak AS v FROM profile WHERE id = 1").get() as { v: number };
  return row.v;
}

export function setVerifiedStreak(n: number): void {
  db.prepare("UPDATE profile SET verified_streak = ? WHERE id = 1").run(n);
}

export function completionsForHabit(habitId: number): string[] {
  const rows = db
    .prepare("SELECT done_on FROM completions WHERE habit_id = ? ORDER BY done_on ASC")
    .all(habitId) as { done_on: string }[];
  return rows.map((r) => r.done_on);
}

export function allCompletionDates(): string[] {
  const rows = db
    .prepare("SELECT done_on FROM completions GROUP BY done_on")
    .all() as { done_on: string }[];
  return rows.map((r) => r.done_on);
}

// -- Leaderboard ----------------------------------------------------------
export type PlayerRow = {
  id: number;
  display_name: string;
  avatar: string;
  xp: number;
  streak: number;
  best_streak: number;
  is_community: number;
};

export function listPlayers(): PlayerRow[] {
  return db.prepare("SELECT * FROM players ORDER BY xp DESC").all() as PlayerRow[];
}

export function addPlayer(name: string, avatar: string, xp: number, streak: number, best: number): number {
  const info = db
    .prepare(
      "INSERT INTO players (display_name, avatar, xp, streak, best_streak, is_community) VALUES (?, ?, ?, ?, ?, 0)"
    )
    .run(name, avatar, xp, streak, best);
  return Number(info.lastInsertRowid);
}

export function updatePlayer(id: number, xp: number, streak: number, best: number): void {
  db.prepare("UPDATE players SET xp = ?, streak = ?, best_streak = ? WHERE id = ? AND is_community = 0").run(
    xp, streak, best, id
  );
}

// -- Quests ----------------------------------------------------------------
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

export function listQuests(): QuestRow[] {
  return db.prepare("SELECT * FROM quests ORDER BY id ASC").all() as QuestRow[];
}

export function claimQuest(questId: number, date: string): void {
  db.prepare("INSERT OR IGNORE INTO quest_claims (quest_id, claimed_on) VALUES (?, ?)").run(questId, date);
}

export function isQuestClaimed(questId: number, date: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM quest_claims WHERE quest_id = ? AND claimed_on = ?")
    .get(questId, date);
  return !!row;
}

export function distinctActiveDays(): number {
  const row = db.prepare("SELECT COUNT(DISTINCT done_on) AS c FROM completions").get() as { c: number };
  return row.c;
}

export function distinctActiveDaysUntil(date: string): number {
  const row = db
    .prepare("SELECT COUNT(DISTINCT done_on) AS c FROM completions WHERE done_on <= ?")
    .get(date) as { c: number };
  return row.c;
}

// -- Tests -----------------------------------------------------------------
export function getDb() {
  return db;
}

export default db;