import { useId, useMemo } from "react";
import type { EvidenceObject } from "../types/domain";

/** Deterministic PRNG so the same evidence id always renders the same art. */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = {
  ev: Pick<EvidenceObject, "id" | "kind" | "class_id">;
  className?: string;
};

/**
 * Procedural stand-in for a real crop — used by the mock store and as the
 * fallback when a signed URL expires or the object store is unreachable.
 * Fresh SVG, per detection class; not captured imagery.
 */
export function EvidenceArt({ ev, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const noiseSeed = useMemo(() => Math.floor(seeded(`${ev.id}:n`)() * 99), [ev.id]);
  const body = useMemo(() => {
    const r = seeded(ev.id);
    const n = (lo: number, hi: number) => lo + r() * (hi - lo);

    if (ev.kind === "crop" && ev.class_id) {
      switch (ev.class_id) {
        case "corrosion":
          return (
            <>
              <rect width="320" height="240" fill="#5b5754" />
              <rect width="320" height="240" filter={`url(#${uid}g)`} opacity="0.5" />
              {Array.from({ length: 34 }, (_, i) => (
                <ellipse
                  key={i}
                  cx={n(20, 300)}
                  cy={n(14, 226)}
                  rx={n(10, 42)}
                  ry={n(8, 30)}
                  fill={`hsl(${n(14, 28)} ${n(60, 80)}% ${n(30, 44)}%)`}
                  opacity={n(0.35, 0.8)}
                  filter={`url(#${uid}b)`}
                />
              ))}
              <path d="M0 150 H320 M0 190 H320" stroke="#2a2826" strokeOpacity="0.5" strokeWidth="3" />
            </>
          );
        case "crack": {
          let x = n(10, 40);
          let y = n(80, 160);
          const pts = [`M${x} ${y}`];
          for (let i = 0; i < 18; i++) {
            x += n(10, 24);
            y += n(-22, 22);
            pts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          return (
            <>
              <rect width="320" height="240" fill="#8d9193" />
              <rect width="320" height="240" filter={`url(#${uid}g)`} opacity="0.55" />
              <path d={pts.join(" ")} stroke="#15171a" strokeWidth="3.2" fill="none" strokeLinejoin="round" />
              <path d={pts.join(" ")} stroke="#000" strokeOpacity="0.25" strokeWidth="9" fill="none" filter={`url(#${uid}b)`} />
              <path d={`M${n(120, 200)} ${n(60, 160)} l${n(20, 50)} ${n(-50, 50)}`} stroke="#1d1f22" strokeWidth="1.6" fill="none" />
            </>
          );
        }
        case "vegetation":
          return (
            <>
              <rect width="320" height="240" fill={`url(#${uid}sky)`} />
              <rect y="150" width="320" height="90" fill="#24502c" />
              {Array.from({ length: 70 }, (_, i) => (
                <circle
                  key={i}
                  cx={n(0, 320)}
                  cy={n(80, 240)}
                  r={n(8, 28)}
                  fill={`hsl(${n(90, 140)} ${n(40, 60)}% ${n(20, 38)}%)`}
                  opacity={n(0.55, 0.95)}
                />
              ))}
              <path d="M150 0 L168 150" stroke="#1d242b" strokeWidth="5" />
              <path d="M0 60 C80 90 220 40 320 70" stroke="#1d242b" strokeWidth="2.4" fill="none" />
            </>
          );
        case "thermal_hotspot":
          return (
            <>
              <rect width="320" height="240" fill={`url(#${uid}heat)`} />
              <circle cx={n(120, 200)} cy={n(90, 150)} r={n(34, 56)} fill={`url(#${uid}core)`} />
              <rect width="320" height="240" filter={`url(#${uid}g)`} opacity="0.22" />
            </>
          );
        case "sag":
          return (
            <>
              <rect width="320" height="240" fill={`url(#${uid}sky)`} />
              <rect x="14" width="8" height="240" fill="#2c353b" />
              <rect x="298" width="8" height="240" fill="#2c353b" />
              <path d="M18 60 Q160 210 302 60" stroke="#141b20" strokeWidth="3.4" fill="none" />
              <path d="M18 84 Q160 232 302 84" stroke="#141b20" strokeOpacity="0.55" strokeWidth="2.4" fill="none" />
            </>
          );
      }
    }

    switch (ev.kind) {
      case "ir_frame":
        return (
          <>
            <rect width="320" height="240" fill={`url(#${uid}heat)`} />
            <rect x="120" y="40" width="80" height="160" fill="#240a3a" opacity="0.55" />
            <circle cx={n(130, 190)} cy={n(70, 130)} r="26" fill={`url(#${uid}core)`} />
          </>
        );
      case "clip":
        return (
          <>
            <rect width="320" height="240" fill="#0d1d25" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={i * 40 + 4} y="10" width="32" height="220" rx="3" fill="#143342" stroke="#2a9aad" strokeOpacity="0.4" />
            ))}
            <circle cx="160" cy="120" r="34" fill="#c8f24a" opacity="0.92" />
            <path d="M150 102 L184 120 L150 138 Z" fill="#0a1f28" />
          </>
        );
      case "report":
        return (
          <>
            <rect width="320" height="240" fill="#dfe8ee" />
            <rect x="70" y="14" width="180" height="212" rx="4" fill="#f6f9fb" stroke="#1a6b7a" strokeOpacity="0.4" />
            {Array.from({ length: 11 }, (_, i) => (
              <rect key={i} x="88" y={36 + i * 17} width={i % 4 === 0 ? 84 : 144 - (i % 3) * 22} height="5" rx="2" fill={i === 0 ? "#1a6b7a" : "#9db3be"} />
            ))}
            <rect x="188" y="168" width="46" height="40" rx="3" fill="#c8f24a" opacity="0.8" />
          </>
        );
      default:
        return (
          <>
            <rect width="320" height="240" fill={`url(#${uid}sky)`} />
            <path d="M0 200 C80 180 140 214 220 190 C260 178 300 196 320 188 V240 H0Z" fill="#17323b" opacity="0.55" />
            <path d="M120 232 L150 40 H170 L200 232 M132 190 H188 M138 140 H182 M146 90 H174 M132 190 L170 140 M188 190 L150 140 M138 140 L174 90 M182 140 L146 90" stroke="#0d1f27" strokeWidth="4" fill="none" />
            <path d="M0 52 C100 40 220 66 320 46" stroke="#0d1f27" strokeOpacity="0.6" strokeWidth="1.6" fill="none" />
          </>
        );
    }
  }, [ev.id, ev.kind, ev.class_id, uid]);

  return (
    <svg
      className={className}
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${ev.class_id ?? ev.kind} preview`}
    >
      <defs>
        <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb4c8" />
          <stop offset="1" stopColor="#d9e6ec" />
        </linearGradient>
        <linearGradient id={`${uid}heat`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b0a4a" />
          <stop offset="0.5" stopColor="#8a1f6a" />
          <stop offset="1" stopColor="#e36a1f" />
        </linearGradient>
        <radialGradient id={`${uid}core`}>
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset="0.35" stopColor="#ffd23a" />
          <stop offset="0.7" stopColor="#f0561f" stopOpacity="0.85" />
          <stop offset="1" stopColor="#8a1f6a" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}b`}>
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={`${uid}g`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={noiseSeed} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.2" />
        </filter>
      </defs>
      {body}
    </svg>
  );
}
