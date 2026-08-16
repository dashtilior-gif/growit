"use client";

type Props = {
  streak: number;
  onConfirm: () => void;
  onDecline: () => void;
};

export default function StreakVerify({ streak, onConfirm, onDecline }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="glass rounded-3xl p-6 w-full max-w-sm text-center border-amber-500/30">
        <div className="text-5xl">🔥</div>
        <h2 className="text-2xl font-extrabold mt-3">{streak}-day streak!</h2>
        <p className="text-sm text-leaf-200/80 mt-2">
          That&apos;s a big milestone. To keep it real, confirm honestly: did you actually keep this streak
          for {streak} days straight?
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-full bg-leaf-500 text-leaf-950 text-sm font-bold hover:bg-leaf-400"
          >
            Yes — I really did it ✅
          </button>
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 rounded-full bg-white/5 text-sm font-semibold hover:bg-white/10"
          >
            Not quite
          </button>
        </div>
      </div>
    </div>
  );
}