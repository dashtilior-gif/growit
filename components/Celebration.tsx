"use client";

// Full-width celebration banner (Duolingo-style level-up) shown on planted/grown/harvest.
export default function Celebration({
  title,
  emoji,
  subtitle,
  color = "bg-leaf-600",
}: {
  title: string;
  emoji: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`banner-in mx-auto max-w-md rounded-3xl ${color} text-white p-5 text-center shadow-2xl`}
      >
        <div className="text-5xl mb-2 animate-bounce">{emoji}</div>
        <div className="text-2xl font-extrabold">{title}</div>
        {subtitle && <div className="mt-1 text-white/90 text-sm">{subtitle}</div>}
      </div>
    </div>
  );
}