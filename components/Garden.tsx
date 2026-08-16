"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Plant from "./Plant";
import Quests from "./Quests";
import Leaderboard from "./Leaderboard";
import Confetti from "./Confetti";
import Celebration from "./Celebration";
import Mascot from "./Mascot";
import CompletionCheckIn, { type Honesty } from "./CompletionCheckIn";
import StreakVerify from "./StreakVerify";
import type { GardenState } from "@/lib/plant";
import type { QuestProgress } from "@/lib/engagement";
import type { Leaderboard as LeaderboardType } from "@/lib/engagement";

type Habit = { id: number; name: string; emoji: string; category: string; isCompleted: boolean };
type Tab = "garden" | "quests" | "board";

const EMOJIS = ["💪", "💧", "🏃", "📖", "🧘", "🥗", "😴", "✍️", "🚭", "💰"];

export default function Garden() {
  const [garden, setGarden] = useState<GardenState | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [quests, setQuests] = useState<QuestProgress[]>([]);
  const [board, setBoard] = useState<LeaderboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("garden");
  const [celebrate, setCelebrate] = useState(false);
  // animation state for the plant + celebration banner
  const [plantAnim, setPlantAnim] = useState<"idle" | "planted" | "grown" | "harvest">("idle");
  const [banner, setBanner] = useState<{ title: string; emoji: string; subtitle?: string } | null>(null);
  const prevStageKey = useRef<string | null>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashBanner(b: { title: string; emoji: string; subtitle?: string }) {
    setBanner(b);
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    celebrateTimer.current = setTimeout(() => setBanner(null), 2600);
  }

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💪");
  // anti-cheat UI state
  const [checkIn, setCheckIn] = useState<Habit | null>(null);
  const [cooldown, setCooldown] = useState<{ habit: Habit; waitSec: number } | null>(null);
  const [streakVerify, setStreakVerify] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const streakVerifyRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [g, h, q, b] = await Promise.all([
        fetch("/api/garden").then((r) => r.json()),
        fetch("/api/habits").then((r) => r.json()),
        fetch("/api/quests").then((r) => r.json()),
        fetch("/api/leaderboard").then((r) => r.json()),
      ]);
      setGarden(g);
      setHabits(h.habits);
      setQuests(q.quests);
      setBoard(b);

      // detect a growth stage-up and celebrate it
      const stageKey = g.stage.key;
      if (prevStageKey.current && prevStageKey.current !== stageKey) {
        setPlantAnim("grown");
        flashBanner({
          title: `${g.stage.emoji} You grew a ${g.stage.name}!`,
          emoji: g.stage.emoji,
          subtitle: "Your consistency is paying off. Keep it up!",
        });
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2000);
        setTimeout(() => setPlantAnim("idle"), 1800);
      }
      prevStageKey.current = stageKey;
      // auto-prompt to verify a streak milestone when it's first reached
      if (g.needsVerify && !streakVerifyRef.current) {
        streakVerifyRef.current = true;
        setStreakVerify(true);
      }
    } catch (e) {
      setError("Could not reach the database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggle(habit: Habit) {
    // undo path: straight through, no check-in
    if (habit.isCompleted) {
      await completeRequest(habit, false);
      return;
    }
    // complete path: open honesty check-in
    setCheckIn(habit);
  }

  async function handleCheckIn(honesty: Honesty, note: string) {
    if (!checkIn) return;
    const habit = checkIn;
    setCheckIn(null);
    const res = await completeRequest(habit, true, honesty, note);
    // streak verification may be needed after gaining a milestone
    if (res?.ok && res.needsVerify) {
      setStreakVerify(true);
    }
  }

  async function completeRequest(
    habit: Habit,
    done: boolean,
    honesty?: Honesty,
    note?: string
  ): Promise<{ ok: boolean; needsVerify?: boolean } | null> {
    const res = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: habit.id, done, honesty, note }),
    });
    const data = await res.json().catch(() => null);

    if (res.status === 429 && data?.cooldown) {
      const waitSec = Math.ceil((data.waitMs ?? 0) / 1000);
      setCooldown({ habit, waitSec });
      startCooldownTimer(waitSec);
      return null;
    }

    if (done) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1600);
      setPlantAnim("grown");
      setTimeout(() => setPlantAnim("idle"), 1400);
      const g = garden;
      if (g && g.totalHabits > 0 && g.doneToday + 1 >= g.totalHabits) {
        setPlantAnim("harvest");
        flashBanner({
          title: "Harvest! 🎉",
          emoji: "🌟",
          subtitle: "All habits done today. Your garden is glowing!",
        });
        setTimeout(() => setPlantAnim("idle"), 2200);
      }
    }
    refresh();
    return data;
  }

  function startCooldownTimer(secs: number) {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    let left = secs;
    cooldownTimer.current = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        if (cooldownTimer.current) clearInterval(cooldownTimer.current);
        setCooldown(null);
      } else {
        setCooldown((c) => (c ? { ...c, waitSec: left } : c));
      }
    }, 1000);
  }

  async function confirmStreak() {
    setStreakVerify(false);
    await fetch("/api/complete", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streak: garden?.streak }),
    });
    flashBanner({
      title: "Streak verified! 🔥",
      emoji: "🔥",
      subtitle: "Honesty locked in. Keep it growing!",
    });
    refresh();
  }

  function declineStreak() {
    setStreakVerify(false);
    // Not verified: show a gentle nudge and let them rebuild honestly.
    flashBanner({
      title: "It's okay 🌱",
      emoji: "🌱",
      subtitle: "Rebuild it one honest habit at a time. Your garden is patient.",
    });
  }

  async function addHabit() {
    if (!name.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), emoji, category: "self" }),
    });
    setName("");
    setAdding(false);
    setPlantAnim("planted");
    flashBanner({ title: "Planted! 🌱", emoji: "🌱", subtitle: "A new seed is in your garden." });
    setTimeout(() => setPlantAnim("idle"), 1400);
    refresh();
  }

  async function removeHabit(id: number) {
    await fetch("/api/habits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  async function claimQuest(id: number) {
    await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questId: id }),
    });
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1600);
    refresh();
  }

  async function share() {
    window.open("/share", "_blank");
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-leaf-300">🌱 loading your garden…</div>;
  if (error) return <div className="min-h-screen grid place-items-center text-red-300">{error}</div>;
  if (!garden) return null;

  const wiltMsg = [
    "Your plant is thriving — keep watering it.",
    "It's droopy — a small habit today revives it.",
    "It's wilting. Complete any habit to bring it back.",
    "It's gone dormant, but it's never too late.",
  ];

  // Duolingo-style mascot encouragement, driven by how your day is going.
  let mascotMsg = "Log a habit and watch me grow!";
  if (garden.wil.level >= 3) mascotMsg = "I'm sleeping… but one habit wakes me up. 🥺";
  else if (garden.wil.level >= 2) mascotMsg = "Help… I'm wilting. Any habit at all revives me!";
  else if (garden.doneToday === 0) mascotMsg = "Your plant is thirsty. Water me with a habit today!";
  else if (garden.doneToday >= garden.totalHabits) mascotMsg = "Every habit done today! You're amazing! 🎉";
  else if (garden.doneToday >= 2) mascotMsg = "Keep going, you're doing great! 💪";
  else mascotMsg = "Nice! One more habit and I'll be so happy. 🌿";

  const allDoneToday = garden.totalHabits > 0 && garden.doneToday >= garden.totalHabits;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "garden", label: "My Garden", icon: "🌱" },
    { id: "quests", label: "Quests", icon: "🎯" },
    { id: "board", label: "Leaderboard", icon: "🏆" },
  ];

  return (
    <div className="min-h-screen">
      {celebrate && <Confetti />}
      {banner && <Celebration title={banner.title} emoji={banner.emoji} subtitle={banner.subtitle} />}
      {checkIn && (
        <CompletionCheckIn
          habitName={checkIn.name}
          emoji={checkIn.emoji}
          onConfirm={handleCheckIn}
          onCancel={() => setCheckIn(null)}
        />
      )}
      {cooldown && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm text-center border-leaf-500/30">
            <div className="text-4xl">⏳</div>
            <h2 className="text-lg font-bold mt-2">Slow down, gardener!</h2>
            <p className="text-sm text-leaf-200/80 mt-1">
              Habits need real time. You can log again in{" "}
              <span className="font-bold text-leaf-300">{cooldown.waitSec}s</span>.
            </p>
            <button
              onClick={() => setCooldown(null)}
              className="mt-4 px-6 py-2.5 rounded-full bg-white/5 text-sm font-semibold hover:bg-white/10"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {streakVerify && garden && (
        <StreakVerify
          streak={garden.streak}
          onConfirm={confirmStreak}
          onDecline={declineStreak}
        />
      )}
      <header className="max-w-4xl mx-auto px-4 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🌱</span> GrowIt
        </div>
        <nav className="flex gap-4 text-sm text-leaf-200">
          <a href="/" className="hover:text-white">Home</a>
          <a href="#share" onClick={share} className="hover:text-white">Share</a>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-24">
        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                tab === t.id ? "bg-leaf-600 text-white" : "glass hover:bg-white/5"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "garden" && (
          <>
            <section className="glass rounded-3xl mt-4 overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="relative h-80 md:h-96">
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="w-64 h-72">
                      <Plant garden={garden} anim={plantAnim} />
                    </div>
                  </div>
                  <span className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-sm font-semibold">
                    {garden.stage.emoji} {garden.stage.name}
                  </span>
                  {garden.wil.level > 0 && (
                    <span className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-sm text-red-200">
                      🥀 {garden.wil.label}
                    </span>
                  )}
                </div>

                <div className="p-6 flex flex-col justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Hey, {garden.plantName} 🌱</h1>
                    <p className="text-leaf-200 text-sm mt-1">{wiltMsg[garden.wil.level]}</p>
                  </div>

                  {/* Duolingo-style mascot + daily goal */}
                  <Mascot message={mascotMsg} />
                  <div>
                    <div className="flex justify-between text-xs text-leaf-200 mb-1">
                      <span className="font-semibold">Daily goal</span>
                      <span>{garden.doneToday}/{garden.totalHabits} habits</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.max(1, garden.totalHabits) }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2.5 rounded-full transition-colors ${
                            i < garden.doneToday ? "progress-bar" : "bg-leaf-900/40"
                          }`}
                        />
                      ))}
                    </div>
                    {allDoneToday && (
                      <p className="mt-2 text-xs text-amber-300 font-semibold">🎉 Daily goal complete!</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Stat label="XP" value={garden.xp} icon="✨" />
                    <Stat label="Streak" value={`${garden.streak}d`} icon="🔥" />
                    <Stat label="Best" value={`${garden.bestStreak}d`} icon="🏆" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-leaf-200 mb-1">
                      <span>{garden.stage.name}</span>
                      <span>{garden.nextStage ? `Next: ${garden.nextStage.name} @ ${garden.nextStageXp} XP` : "Max stage ✨"}</span>
                    </div>
                    <div className="h-3 rounded-full bg-leaf-900/40 overflow-hidden">
                      <div className="h-full progress-bar rounded-full" style={{ width: `${garden.progressPct * 100}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-leaf-300/70">
                    {garden.doneToday}/{garden.totalHabits} habits done today · Global rank #{board?.myRank ?? "…"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Your habits</h2>
                <button
                  onClick={() => setAdding(true)}
                  className="px-4 py-2 rounded-full bg-leaf-600 hover:bg-leaf-500 text-white text-sm font-semibold transition"
                >
                  + Add habit
                </button>
              </div>

              {adding && (
                <div className="glass rounded-2xl p-4 mb-3 flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs text-leaf-300">Habit name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addHabit()}
                      placeholder="e.g. Drink 2L of water"
                      className="mt-1 w-full bg-black/30 border border-leaf-500/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-leaf-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-leaf-300">Icon</label>
                    <div className="mt-1 flex flex-wrap gap-1 max-w-[220px]">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEmoji(e)}
                          className={`text-xl p-1 rounded ${emoji === e ? "bg-leaf-600/40" : "bg-white/5"}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addHabit} className="px-4 py-2 rounded-lg bg-leaf-600 text-white text-sm font-semibold">Save</button>
                    <button onClick={() => setAdding(false)} className="px-3 py-2 rounded-lg bg-white/5 text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {habits.length === 0 && (
                  <div className="glass rounded-2xl p-8 text-center text-leaf-200/70">
                    No habits yet. Add one to plant your first seed 🌱
                  </div>
                )}
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`glass rounded-2xl p-4 flex items-center gap-3 transition ${
                      habit.isCompleted ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggle(habit)}
                      aria-label="toggle habit"
                      className={`w-7 h-7 rounded-full border-2 grid place-items-center text-xs transition ${
                        habit.isCompleted ? "bg-leaf-500 border-leaf-500 text-white" : "border-leaf-500/50"
                      }`}
                    >
                      {habit.isCompleted ? "✓" : ""}
                    </button>
                    <span className="text-xl">{habit.emoji}</span>
                    <span className={`flex-1 ${habit.isCompleted ? "line-through text-leaf-200/50" : ""}`}>
                      {habit.name}
                    </span>
                    <button
                      onClick={() => removeHabit(habit.id)}
                      className="text-leaf-400/50 hover:text-red-300 text-sm px-2"
                      aria-label="delete habit"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "quests" && (
          <section className="mt-4">
            <h2 className="text-xl font-bold mb-4">Quests 🎯</h2>
            <p className="text-sm text-leaf-200/70 mb-4">
              Little goals for every kind of grower — from first-timers to golden-tree legends.
              Complete them to earn bonus XP.
            </p>
            <Quests quests={quests} onClaim={claimQuest} />
          </section>
        )}

        {tab === "board" && board && (
          <section className="mt-4">
            <h2 className="text-xl font-bold mb-4">Global Leaderboard 🏆</h2>
            <Leaderboard board={board} />
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-lg font-bold">{icon} {value}</div>
      <div className="text-xs text-leaf-300">{label}</div>
    </div>
  );
}