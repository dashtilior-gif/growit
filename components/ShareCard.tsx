"use client";

import { useRef } from "react";
import Plant from "./Plant";
import type { GardenState } from "@/lib/plant";

export default function ShareCard({ garden }: { garden: GardenState }) {
  const ref = useRef<HTMLDivElement>(null);

  async function download() {
    // lightweight capture: rasterize the card to an image via canvas + SVG foreignObject
    const node = ref.current;
    if (!node) return;
    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.margin = "0";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:1080px;height:1350px;font-family:Arial,sans-serif">
            ${node.outerHTML}
          </div>
        </foreignObject>
      </svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement("canvas");
      c.width = 1080; c.height = 1350;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#0c1310";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, 1080, 1350);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "growit-share.png";
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div className="max-w-md w-full">
      <div ref={ref} className="rounded-3xl overflow-hidden border border-leaf-500/30 bg-[#0f1d16]">
        <div className="p-6 text-center bg-gradient-to-b from-leaf-800/40 to-transparent">
          <div className="text-2xl">🌱 GrowIt</div>
          <div className="text-sm text-leaf-300 mt-1">My {garden.stage.name.toLowerCase()} is thriving</div>
        </div>
        <div className="grid place-items-center h-80">
          <div className="w-56 h-64">
            <Plant garden={garden} />
          </div>
        </div>
        <div className="px-6 pb-6 text-center">
          <div className="text-5xl font-extrabold">🔥 {garden.streak}-day streak</div>
          <div className="text-leaf-200 mt-2">{garden.stage.emoji} {garden.stage.name} · ✨ {garden.xp} XP · 🏆 best {garden.bestStreak}d</div>
          {garden.wil.level > 0 && (
            <div className="mt-2 text-red-300 text-sm">⚠️ {garden.wil.label} — help me revive it!</div>
          )}
          <div className="mt-4 text-leaf-400/70 text-sm">grow.it — stop breaking promises. grow something beautiful.</div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={download}
          className="flex-1 py-3 rounded-full bg-leaf-600 hover:bg-leaf-500 text-white font-semibold transition"
        >
          ⬇ Download share image
        </button>
        <button
          onClick={() => window.close()}
          className="px-5 py-3 rounded-full glass hover:bg-white/5 font-semibold transition"
        >
          Back
        </button>
      </div>
    </div>
  );
}