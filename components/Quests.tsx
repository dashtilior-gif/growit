"use client";

import { useState } from "react";
import type { QuestProgress } from "@/lib/engagement";

export default function Quests({
  quests,
  onClaim,
}: {
  quests: QuestProgress[];
  onClaim: (id: number) => Promise<void>;
}) {
  const [claimed, setClaimed] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function claim(q: QuestProgress) {
    setBusy(q.id);
    await onClaim(q.id);
    setClaimed((c) => ({ ...c, [q.id]: true }));
    setBusy(null);
  }

  return (
    <div className="space-y-3">
      {quests.map((q) => {
        const done = q.claimed || claimed[q.id];
        const progress = Math.min(100, (q.current / q.goal) * 100);
        return (
          <div key={q.id} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="text-3xl">{q.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{q.title}</span>
                {q.kind === "daily" && (
                  <span className="text-[10px] bg-leaf-600/30 text-leaf-200 px-1.5 py-0.5 rounded-full">daily</span>
                )}
              </div>
              <div className="text-xs text-leaf-200/70">{q.description}</div>
              <div className="mt-1.5 h-2 rounded-full bg-leaf-900/40 overflow-hidden">
                <div
                  className="h-full progress-bar rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-leaf-300/70">
                {q.current}/{q.goal} · +{q.reward_xp} XP
              </div>
            </div>
            {done ? (
              <span className="text-leaf-300 text-sm font-semibold whitespace-nowrap">✓ Done</span>
            ) : q.claimable ? (
              <button
                onClick={() => claim(q)}
                disabled={busy === q.id}
                className="px-4 py-2 rounded-full bg-leaf-500 hover:bg-leaf-400 text-leaf-950 text-sm font-bold transition disabled:opacity-50"
              >
                {busy === q.id ? "…" : "Claim"}
              </button>
            ) : (
              <span className="text-xs text-leaf-300/50 whitespace-nowrap">in progress</span>
            )}
          </div>
        );
      })}
    </div>
  );
}