import { NextRequest, NextResponse } from "next/server";
import {
  getProfile,
  updateXp,
  completeHabit,
  uncompleteHabit,
  touchActive,
  isDoneToday,
  setLastCompletedAt,
  setVerifiedStreak,
} from "@/lib/data";
import {
  todayStr,
  XP_PER_COMPLETION,
  COMPLETION_COOLDOWN_MS,
  STREAK_VERIFY_THRESHOLDS,
} from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const habitId = Number(body?.habitId);
  const done = body?.done !== false; // true = complete, false = undo
  const honesty: "full" | "partial" | "none" =
    body?.honesty === "partial" || body?.honesty === "none" ? body.honesty : "full";
  const note: string = typeof body?.note === "string" ? body.note.slice(0, 280) : "";
  if (!habitId) return NextResponse.json({ error: "habitId required" }, { status: 400 });

  const today = todayStr();
  const profile = await getProfile();

  if (done) {
    const before = await isDoneToday(habitId, today);
    if (!before) {
      // Anti-cheat cooldown: block rapid-fire completions.
      const lastTs = profile.last_completed_at;
      const now = Date.now();
      if (lastTs && now - lastTs < COMPLETION_COOLDOWN_MS) {
        const waitMs = COMPLETION_COOLDOWN_MS - (now - lastTs);
        return NextResponse.json(
          { ok: false, cooldown: true, waitMs, message: "Slow down! Habits need real time." },
          { status: 429 }
        );
      }

      // Honesty scales XP: full = full, partial = half, none = 0.
      const xpGain =
        honesty === "full" ? XP_PER_COMPLETION : honesty === "partial" ? Math.floor(XP_PER_COMPLETION / 2) : 0;

      await completeHabit(habitId, today, honesty, note);
      await updateXp(profile.xp + xpGain);
      await setLastCompletedAt(Date.now());
    }
  } else {
    const wasDone = await isDoneToday(habitId, today);
    if (wasDone) {
      await uncompleteHabit(habitId, today);
      await updateXp(Math.max(0, profile.xp - XP_PER_COMPLETION));
    }
  }

  await touchActive(today);

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  // Streak milestone verification: user explicitly confirms a streak is real.
  const body = await req.json().catch(() => null);
  const streak = Number(body?.streak);
  if (!STREAK_VERIFY_THRESHOLDS.includes(streak)) {
    return NextResponse.json({ ok: false, error: "invalid streak" }, { status: 400 });
  }
  await setVerifiedStreak(streak);
  return NextResponse.json({ ok: true });
}