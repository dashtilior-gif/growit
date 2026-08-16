"use client";

// Duolingo-style mascot speech bubble. The plant "talks" to encourage you.
export default function Mascot({ message }: { message: string }) {
  return (
    <div className="flex items-end gap-3">
      <div className="text-4xl leading-none animate-bounce">🌱</div>
      <div className="relative glass rounded-2xl px-4 py-3 max-w-[260px]">
        <span className="absolute -left-1.5 top-4 w-3 h-3 rotate-45 bg-[rgba(18,33,26,0.6)] border-l border-b border-[rgba(134,239,172,0.15)]" />
        <p className="bubble-pop text-sm text-leaf-100">{message}</p>
      </div>
    </div>
  );
}