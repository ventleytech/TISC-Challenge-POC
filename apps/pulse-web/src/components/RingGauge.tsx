type Props = {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  tone?: "volt" | "ok" | "warn" | "breach" | "steel";
};

/** Fresh SVG progress ring used across ops pages. */
export function RingGauge({
  value,
  size = 96,
  stroke = 7,
  label,
  sub,
  tone = "volt",
}: Props) {
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className={`rg rg--${tone}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label ?? "gauge"} ${Math.round(v * 100)}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="rg__track"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="rg__arc"
          strokeWidth={stroke}
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="rg__txt">
        <b>{label ?? `${Math.round(v * 100)}%`}</b>
        {sub ? <small>{sub}</small> : null}
      </span>
    </span>
  );
}
