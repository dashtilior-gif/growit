import React from "react";
import type { GardenState } from "@/lib/plant";

// Animation state: 'idle' | 'planted' | 'grown' | 'harvest'
type Anim = "idle" | "planted" | "grown" | "harvest";

// SVG plant that visually reflects stage + wilting, with a cozy garden scene.
export default function Plant({ garden, anim = "idle" }: { garden: GardenState; anim?: Anim }) {
  const { stage, wil } = garden;
  const wilt = wil.level;
  const droop = wilt * 0.22;
  const gray = wilt > 0;
  const leaf = gray ? "#8fa08f" : "#4ade80";
  const leaf2 = gray ? "#a3b0a3" : "#22c55e";
  const trunk = gray ? "#9c8f82" : "#7c5a35";
  const healthy = !gray;

  const trunkH =
    stage.key === "seed" ? 0
    : stage.key === "sprout" ? 18
    : stage.key === "sapling" ? 46
    : stage.key === "bloom" ? 80
    : 96;

  const animClass =
    anim === "planted" ? "planted-in" : anim === "grown" ? "grow-pop" : anim === "harvest" ? "plant-bob" : "";
  const showSparkle = anim === "harvest" || stage.key === "golden";

  return (
    <svg viewBox="0 0 200 220" className={`w-full h-full drop-shadow-lg ${anim === "idle" ? "plant-bob" : animClass}`}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={healthy ? "#1d4ed8" : "#334155"} />
          <stop offset="100%" stopColor={healthy ? "#22c55e" : "#475569"} />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="200" height="150" fill="url(#sky)" rx="14" />

      {/* Sun */}
      {healthy && <circle cx="42" cy="34" r="16" fill="url(#sun)" />}
      {wilt >= 2 && <circle cx="42" cy="34" r="10" fill="#64748b" />}

      {/* Clouds */}
      {healthy && (
        <g fill="#ffffff" opacity="0.85">
          <ellipse cx="130" cy="30" rx="18" ry="8" />
          <ellipse cx="144" cy="26" rx="12" ry="6" />
          <ellipse cx="118" cy="26" rx="10" ry="5" />
        </g>
      )}
      {healthy && (
        <g fill="#ffffff" opacity="0.6">
          <ellipse cx="90" cy="48" rx="12" ry="6" />
        </g>
      )}

      {/* Ground */}
      <rect x="0" y="150" width="200" height="70" fill="#0d2418" />
      <rect x="0" y="150" width="200" height="8" fill="#1c4a2f" />

      {/* small grass */}
      <g fill="#1f6b3d">
        <path d="M20 152 l3 10 l3 -10 z" />
        <path d="M40 152 l3 10 l3 -10 z" />
        <path d="M160 152 l3 10 l3 -10 z" />
        <path d="M180 152 l3 10 l3 -10 z" />
        <path d="M75 152 l3 10 l3 -10 z" />
        <path d="M120 152 l3 10 l3 -10 z" />
      </g>

      {/* Soil mound */}
      <ellipse cx="100" cy="196" rx="64" ry="16" fill="#6f452a" />
      <ellipse cx="100" cy="192" rx="64" ry="12" fill="#8b5e3c" />
      <ellipse cx="82" cy="190" rx="14" ry="4" fill="#9c7a52" opacity="0.5" />
      <ellipse cx="120" cy="193" rx="10" ry="3" fill="#6b4a2c" opacity="0.5" />

      {/* Stage art */}
      <g style={{ transformOrigin: "100px 195px", transform: `rotate(${-droop}deg)` }}>
        {stage.key === "seed" && (
          <>
            <ellipse cx="100" cy="188" rx="10" ry="7" fill="#a16207" />
            <path d="M100 188 q3 -6 0 -10 q-3 4 0 10" fill="#65a30d" />
          </>
        )}

        {stage.key === "sprout" && (
          <g>
            <path d="M100 190 q1 -14 0 -24" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M100 168 q-14 -6 -22 -2 q8 10 22 2" fill={leaf} />
            <path d="M100 158 q14 -8 22 -4 q-8 12 -22 4" fill={leaf} />
          </g>
        )}

        {(stage.key === "sapling" || stage.key === "bloom" || stage.key === "golden") && (
          <>
            <path
              d={`M100 190 L100 ${190 - trunkH}`}
              stroke={trunk}
              strokeWidth={stage.key === "sapling" ? 8 : 12}
              strokeLinecap="round"
            />
            {stage.key === "sapling" && (
              <g fill={leaf}>
                <ellipse cx="78" cy="150" rx="16" ry="9" transform="rotate(-20 78 150)" />
                <ellipse cx="122" cy="150" rx="16" ry="9" transform="rotate(20 122 150)" />
                <ellipse cx="100" cy="136" rx="16" ry="9" />
              </g>
            )}
            {(stage.key === "bloom" || stage.key === "golden") && (
              <g>
                <ellipse cx="72" cy="125" rx="26" ry="18" fill={leaf} transform="rotate(-24 72 125)" />
                <ellipse cx="128" cy="125" rx="26" ry="18" fill={leaf2} transform="rotate(24 128 125)" />
                <ellipse cx="100" cy="108" rx="30" ry="20" fill={leaf} />
                <ellipse cx="86" cy="150" rx="18" ry="11" fill={leaf2} transform="rotate(-14 86 150)" />
                <ellipse cx="114" cy="150" rx="18" ry="11" fill={leaf} transform="rotate(14 114 150)" />
                {stage.key === "golden" && (
                  <g>
                    <circle cx="100" cy="120" r="7" fill="#fde047" />
                    <circle cx="120" cy="132" r="6" fill="#fde047" />
                    <circle cx="80" cy="132" r="6" fill="#fde047" />
                    <circle cx="100" cy="100" r="5" fill="#fef08a" />
                    <circle cx="112" cy="118" r="4" fill="#fbbf24" />
                    <circle cx="88" cy="124" r="4" fill="#fbbf24" />
                  </g>
                )}
              </g>
            )}
          </>
        )}
      </g>

      {/* Wilt indicators */}
      {wilt > 0 && (
        <text x="100" y="52" textAnchor="middle" fontSize="16">
          {wilt >= 3 ? "💤" : "🥀"}
        </text>
      )}

      {/* Growth / harvest celebration overlays */}
      {(anim === "grown" || anim === "harvest") && (
        <g fill="#7dd3fc">
          <circle className="droplet" cx="120" cy="120" r="4" />
          <circle className="droplet" cx="150" cy="150" r="3" style={{ animationDelay: "0.3s" }} />
          <circle className="droplet" cx="90" cy="100" r="3" style={{ animationDelay: "0.55s" }} />
        </g>
      )}

      {anim === "harvest" && (
        <circle cx="100" cy="120" r="30" fill="none" stroke="#fde047" strokeWidth="3" className="harvest-ring" />
      )}

      {showSparkle && (
        <g fill="#fef08a">
          <circle className="sparkle" cx="135" cy="90" r="3" />
          <circle className="sparkle" cx="60" cy="120" r="2.5" style={{ animationDelay: "0.4s" }} />
          <circle className="sparkle" cx="150" cy="130" r="2" style={{ animationDelay: "0.7s" }} />
          <circle className="sparkle" cx="45" cy="95" r="2" style={{ animationDelay: "0.9s" }} />
        </g>
      )}
    </svg>
  );
}