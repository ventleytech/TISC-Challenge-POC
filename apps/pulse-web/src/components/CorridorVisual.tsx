/** Abstract corridor silhouette — fresh SVG, not proprietary chrome. */
export function CorridorVisual() {
  return (
    <svg
      className="corridor"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Abstract energy corridor"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#9eb8c4" />
          <stop offset="45%" stopColor="#c5d4dc" />
          <stop offset="100%" stopColor="#e8eef2" />
        </linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#1a6b7a" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#c4f04d" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0f2a33" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#sky)" />
      <rect width="1440" height="900" fill="url(#haze)" />

      {/* distant ridge */}
      <path
        d="M0 620 C180 580 320 640 480 600 C640 560 760 620 920 590 C1080 560 1240 610 1440 570 L1440 900 L0 900 Z"
        fill="#0f2a33"
        opacity="0.16"
      />

      {/* conductor lines */}
      <g
        fill="none"
        stroke="#0f2a33"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        className="corridor__lines"
      >
        <path d="M-40 210 C360 160 720 280 1480 190" />
        <path d="M-40 250 C360 200 720 320 1480 230" />
        <path d="M-40 290 C360 240 720 360 1480 270" />
      </g>

      {/* towers */}
      <g fill="#0f2a33" opacity="0.55" className="corridor__towers">
        <path d="M220 180 L236 180 L248 620 L208 620 Z" />
        <path d="M200 260 H256 L248 280 H208 Z" />
        <path d="M204 360 H252 L244 380 H212 Z" />
        <path d="M980 150 L996 150 L1010 620 L966 620 Z" />
        <path d="M960 230 H1016 L1008 250 H968 Z" />
        <path d="M964 340 H1012 L1004 360 H972 Z" />
      </g>

      {/* volt pulse mark in field */}
      <g className="corridor__pulse" transform="translate(1180 120)">
        <circle cx="40" cy="40" r="36" fill="#0f2a33" opacity="0.7" />
        <path
          d="M22 22h22L32 42h16L24 66l6-20H22l8-24z"
          fill="#c4f04d"
        />
      </g>
    </svg>
  );
}
