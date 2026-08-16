"use client";

import type { Leaderboard } from "@/lib/engagement";

export default function Leaderboard({ board }: { board: Leaderboard }) {
  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;

  return (
    <div>
      <div className="glass rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-leaf-200">Your global rank</div>
          <div className="text-3xl font-extrabold">
            #{board.myRank} <span className="text-lg text-leaf-300">of {board.players.length}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-leaf-200">Your XP</div>
          <div className="text-3xl font-extrabold">✨ {board.myXp}</div>
        </div>
      </div>

      <div className="space-y-2">
        {board.players.map((p) => (
          <div
            key={`${p.rank}-${p.name}`}
            className={`glass rounded-2xl px-4 py-3 flex items-center gap-3 ${
              p.isMe ? "ring-2 ring-leaf-500" : ""
            }`}
          >
            <span className="w-8 text-center font-bold">{medal(p.rank)}</span>
            <span className="text-2xl">{p.avatar}</span>
            <span className="flex-1 font-medium">
              {p.name}
              {p.isMe && <span className="ml-2 text-[10px] bg-leaf-600 text-white px-1.5 py-0.5 rounded-full">you</span>}
            </span>
            <span className="text-sm text-leaf-300">🔥{p.streak}d</span>
            <span className="w-16 text-right font-bold">✨ {p.xp}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-leaf-300/50">
        Global garden ranks every grower by total XP. Stay consistent to climb 🚀
      </p>
    </div>
  );
}