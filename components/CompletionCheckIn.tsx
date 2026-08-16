"use client";

import { useState } from "react";

export type Honesty = "full" | "partial" | "none";

type Props = {
  habitName: string;
  emoji: string;
  onConfirm: (honesty: Honesty, note: string) => void;
  onCancel: () => void;
};

const OPTIONS: { value: Honesty; emoji: string; label: string; hint: string; xp: string }[] = [
  { value: "full", emoji: "💪", label: "Knocked it out", hint: "Genuinely did it", xp: "+6 XP" },
  { value: "partial", emoji: "😅", label: "Barely / partially", hint: "Some, but not all", xp: "+3 XP" },
  { value: "none", emoji: "🙈", label: "Honestly? No", hint: "Didn't really do it", xp: "+0 XP" },
];

export default function CompletionCheckIn({ habitName, emoji, onConfirm, onCancel }: Props) {
  const [honesty, setHonesty] = useState<Honesty | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="glass rounded-3xl p-6 w-full max-w-md border-leaf-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center">
          {emoji} {habitName}
        </h2>
        <p className="text-center text-sm text-leaf-200/70 mt-1">
          Be honest — the plant knows. 🌿
        </p>

        <div className="mt-5 space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setHonesty(o.value)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left border transition ${
                honesty === o.value
                  ? "bg-leaf-600/30 border-leaf-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="text-2xl">{o.emoji}</span>
              <span className="flex-1">
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-xs text-leaf-200/60">{o.hint}</span>
              </span>
              <span className="text-xs font-bold text-leaf-300">{o.xp}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs text-leaf-300">Proof note (optional) — what did you actually do?</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && honesty && onConfirm(honesty, note)}
            placeholder="e.g. 3 sets of 25 before lunch"
            className="mt-1 w-full bg-black/30 border border-leaf-500/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-leaf-400"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-full bg-white/5 text-sm font-semibold hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => honesty && onConfirm(honesty, note)}
            disabled={!honesty}
            className="flex-1 px-4 py-2.5 rounded-full bg-leaf-500 text-leaf-950 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Log it
          </button>
        </div>
      </div>
    </div>
  );
}