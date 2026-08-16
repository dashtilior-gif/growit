"use client";

// Lightweight CSS confetti burst shown on completing a habit / quest.
export default function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ["#22c55e", "#4ade80", "#a3e635", "#fde047", "#f472b6", "#38bdf8"];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${left}%`,
              top: "-20px",
              width: size,
              height: size,
              backgroundColor: color,
              animation: `confetti-fall ${1 + Math.random() * 1.2}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}