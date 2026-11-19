import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { EvidenceLightbox } from "../components/EvidenceLightbox";
import { EvidenceThumb } from "../components/EvidenceThumb";
import { RingGauge } from "../components/RingGauge";
import {
  SLA_WARN_MS,
  formatClock,
  slaLeft,
  slaTone,
  useNow,
  type SlaTone,
} from "../components/sla";
import {
  ackAlert,
  assetName,
  escalateAlert,
  listAlerts,
  listEvidence,
  listFindings,
  listInspections,
  liveApiEnabled,
} from "../mock/client";
import {
  SEVERITIES,
  type Alert,
  type EvidenceObject,
  type Finding,
  type Inspection,
  type Severity,
} from "../types/domain";

type SortKey = "due" | "severity" | "risk";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "due", label: "SLA due" },
  { key: "severity", label: "Severity" },
  { key: "risk", label: "Risk score" },
];

const LANES: { tone: SlaTone | "acked"; title: string; hint: string }[] = [
  { tone: "breach", title: "Breached", hint: "SLA elapsed — escalate now" },
  { tone: "warn", title: "Escalating", hint: "Under 30 minutes" },
  { tone: "ok", title: "On track", hint: "Inside the SLA window" },
  { tone: "none", title: "No SLA", hint: "Untimed alerts" },
  { tone: "acked", title: "Acknowledged", hint: "Operator owns it" },
];

const pretty = (s: string) => s.replace(/_/g, " ");

function sevRank(s: Severity): number {
  return SEVERITIES.length - SEVERITIES.indexOf(s);
}

function laneOf(a: Alert, now: number): SlaTone | "acked" {
  return a.ack_at ? "acked" : slaTone(a.sla_due_at, now);
}

function remainingLabel(a: Alert, now: number): string {
  if (!a.sla_due_at) return "no SLA";
  const ms = new Date(a.sla_due_at).getTime() - now;
  return ms < 0 ? `+${formatClock(ms)} over` : formatClock(ms);
}

export function AlertsPage() {
  const { canWrite } = useAuth();
  const [severity, setSeverity] = useState<Severity | "">("");
  const [dept, setDept] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("due");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Alert[]>([]);
  const [findings, setFindings] = useState<Map<string, Finding>>(new Map());
  const [inspections, setInspections] = useState<Map<string, Inspection>>(
    new Map(),
  );
  const [evidence, setEvidence] = useState<EvidenceObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acking, setAcking] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const now = useNow(1000);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [a, f, i, e] = await Promise.all([
          listAlerts({ openOnly }),
          listFindings(),
          listInspections({}),
          listEvidence({}),
        ]);
        if (cancelled) return;
        setItems(a.items);
        setFindings(new Map(f.items.map((x) => [x.id, x])));
        setInspections(new Map(i.items.map((x) => [x.id, x])));
        setEvidence(e.items);
        setError(null);
        setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load alerts",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openOnly, tick]);

  const onAck = useCallback(async (alertId: string) => {
    if (!canWrite) {
      setError("Viewer cannot acknowledge alerts");
      return;
    }
    setAcking(alertId);
    try {
      const updated = await ackAlert(alertId);
      if (!updated) {
        setError(`Alert ${alertId} not found`);
        return;
      }
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ack failed");
    } finally {
      setAcking(null);
    }
  }, [canWrite]);

  const onEscalate = useCallback(async (alertId: string) => {
    if (!canWrite) return;
    await escalateAlert(alertId);
    setTick((n) => n + 1);
  }, [canWrite]);

  const sevCounts = useMemo(() => {
    const m = new Map<Severity, number>();
    for (const a of items) m.set(a.severity, (m.get(a.severity) ?? 0) + 1);
    return m;
  }, [items]);

  const risk = useCallback(
    (a: Alert) => findings.get(a.finding_id)?.risk_score ?? 0,
    [findings],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = items.filter((a) => {
      if (severity && a.severity !== severity) return false;
      if (dept && a.dept_code !== dept) return false;
      if (!needle) return true;
      const f = findings.get(a.finding_id);
      const hay = [
        a.title,
        a.id,
        a.finding_id,
        a.inspection_id ?? "",
        a.dept_code ?? "",
        f?.class_id ?? "",
        f ? assetName(f.asset_id) : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
    const byDue = (a: Alert, b: Alert) =>
      (a.sla_due_at ?? "9") < (b.sla_due_at ?? "9") ? -1 : 1;
    return rows.sort((a, b) => {
      if (sort === "severity") {
        return sevRank(b.severity) - sevRank(a.severity) || byDue(a, b);
      }
      if (sort === "risk") return risk(b) - risk(a) || byDue(a, b);
      return byDue(a, b);
    });
  }, [items, severity, dept, q, sort, findings, risk]);

  const lanes = useMemo(
    () =>
      LANES.map((lane) => ({
        ...lane,
        rows: visible.filter((a) => laneOf(a, now) === lane.tone),
      })).filter((l) => l.rows.length > 0),
    [visible, now],
  );

  /** Flat order = lane order, so keyboard nav follows what the eye sees. */
  const flat = useMemo(() => lanes.flatMap((l) => l.rows), [lanes]);
  const selected = useMemo(
    () => flat.find((a) => a.id === selectedId) ?? flat[0] ?? null,
    [flat, selectedId],
  );

  const stats = useMemo(() => {
    const open = visible.filter((a) => !a.ack_at);
    const breach = open.filter((a) => slaTone(a.sla_due_at, now) === "breach");
    const warn = open.filter((a) => slaTone(a.sla_due_at, now) === "warn");
    const acked = visible.length - open.length;
    const health = open.length ? 1 - breach.length / open.length : 1;
    const next = open
      .filter((a) => a.sla_due_at && new Date(a.sla_due_at).getTime() > now)
      .sort((a, b) => (a.sla_due_at! < b.sla_due_at! ? -1 : 1))[0];
    return {
      open: open.length,
      breach: breach.length,
      warn: warn.length,
      acked,
      health,
      next,
    };
  }, [visible, now]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!flat.length || !selected) return;
      const i = flat.findIndex((a) => a.id === selected.id);
      setSelectedId(flat[(i + dir + flat.length) % flat.length].id);
    },
    [flat, selected],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "a" && canWrite && selected && !selected.ack_at) {
        void onAck(selected.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, selected, onAck, canWrite]);

  const live = liveApiEnabled();
  const healthTone =
    stats.health >= 0.8 ? "ok" : stats.health >= 0.5 ? "warn" : "breach";
  const sevTotal = [...sevCounts.values()].reduce((a, b) => a + b, 0);

  const selFinding = selected ? findings.get(selected.finding_id) : undefined;
  const selInspection = selected?.inspection_id
    ? inspections.get(selected.inspection_id)
    : undefined;
  const selEvidence = useMemo(() => {
    if (!selected) return [];
    const byFinding = evidence.filter((e) => e.finding_id === selected.finding_id);
    if (byFinding.length) return byFinding.slice(0, 4);
    return evidence
      .filter((e) => e.inspection_id === selected.inspection_id)
      .slice(0, 4);
  }, [evidence, selected]);

  return (
    <section className="page-view">
      <header className="alert-hero">
        <div className="evx-hero__mesh" aria-hidden="true" />
        <div className="alx-hero__sweep" aria-hidden="true" />
        <div className="evx-hero__copy">
          <p className="evx-eyebrow">TPulse · alert desk</p>
          <h1 className="evx-title">
            Alert desk
          </h1>
          <p className="evx-sub">
            Every critical finding opens a timed alert. Watch the SLA burn down,
            acknowledge from the keyboard, and jump straight to the crop that
            triggered it.
          </p>
          <div className="evx-hero__actions">
            <span className={`evx-source evx-source--${live ? "live" : "mock"}`}>
              <i aria-hidden="true" />
              {live ? "Live · pulse-api" : "Mock bus · offline"}
            </span>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setTick((n) => n + 1)}
            >
              Refresh
            </button>
            <Link className="btn-outline" to="/priority">
              Priority board
            </Link>
            <Link className="btn-outline" to="/map">
              Corridor map
            </Link>
          </div>
        </div>

        <div className="alx-hero__side">
          <RingGauge
            value={stats.health}
            size={132}
            stroke={9}
            tone={healthTone}
            label={`${Math.round(stats.health * 100)}%`}
            sub="SLA health"
          />
          <div className="evx-metrics alx-metrics" aria-label="Alert summary">
            <div className="evx-metric evx-metric--bad">
              <span className="evx-metric__n">{stats.breach}</span>
              <span className="evx-metric__l">Breached</span>
            </div>
            <div className="evx-metric evx-metric--warn">
              <span className="evx-metric__n">{stats.warn}</span>
              <span className="evx-metric__l">Under 30m</span>
            </div>
            <div className="evx-metric">
              <span className="evx-metric__n">{stats.open}</span>
              <span className="evx-metric__l">Open</span>
            </div>
            <div className="evx-metric">
              <span className="evx-metric__n">{stats.acked}</span>
              <span className="evx-metric__l">Acked</span>
            </div>
            <div className="evx-mix" role="group" aria-label="Severity mix">
              <div className="evx-mix__bar">
                {SEVERITIES.filter((s) => sevCounts.has(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    data-sev={s}
                    title={`${s} · ${sevCounts.get(s)}`}
                    className={`evx-mix__seg${severity === s ? " selected" : ""}`}
                    style={{ flexGrow: sevCounts.get(s) }}
                    onClick={() => setSeverity(severity === s ? "" : s)}
                  />
                ))}
                {sevTotal === 0 ? <span className="evx-mix__empty" /> : null}
              </div>
              <p className="evx-mix__cap">
                {stats.next
                  ? `Next deadline in ${remainingLabel(stats.next, now)} · ${stats.next.title}`
                  : "No upcoming deadlines"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="filter-row" role="group" aria-label="Alert filters">
        <div className="chip-group">
          <button
            type="button"
            className={`filter-chip${severity === "" ? " selected" : ""}`}
            onClick={() => setSeverity("")}
          >
            All <b>{items.length}</b>
          </button>
          {SEVERITIES.filter((s) => sevCounts.has(s)).map((s) => (
            <button
              key={s}
              type="button"
              data-sev={s}
              className={`filter-chip${severity === s ? " selected" : ""}`}
              onClick={() => setSeverity(severity === s ? "" : s)}
            >
              <i aria-hidden="true" />
              {s} <b>{sevCounts.get(s)}</b>
            </button>
          ))}
        </div>
        <div className="evx-selects">
          <label>
            <span>Search</span>
            <input
              className="filters__select alx-search"
              type="search"
              placeholder="title, asset, class, id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label>
            <span>Sort</span>
            <select
              className="filters__select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Dept</span>
            <select
              className="filters__select"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option value="">All</option>
              <option value="NR-OPS">NR-OPS</option>
              <option value="SB-OPS">SB-OPS</option>
              <option value="WG-YARD">WG-YARD</option>
              <option value="COMPLIANCE">COMPLIANCE</option>
            </select>
          </label>
          <label className="evx-toggle">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
            />
            <span>Open only</span>
          </label>
        </div>
      </div>

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="evx-stage">
        <div className="alx-lanes" aria-label="Alerts">
          {lanes.map((lane) => (
            <section key={lane.tone} className={`alx-lane alx-lane--${lane.tone}`}>
              <header className="alx-lane__head">
                <h2>{lane.title}</h2>
                <span className="alx-lane__count">{lane.rows.length}</span>
                <p>{lane.hint}</p>
              </header>
              <ul className="alx-list">
                {lane.rows.map((alert, index) => {
                  const f = findings.get(alert.finding_id);
                  const tone = laneOf(alert, now);
                  const left = slaLeft(alert.sla_due_at, now);
                  return (
                    <li key={alert.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        data-sev={alert.severity}
                        data-class={f?.class_id}
                        className={`alx-card alx-card--${tone}${selected?.id === alert.id ? " is-selected" : ""}`}
                        style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                        onClick={() => setSelectedId(alert.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(alert.id);
                          }
                        }}
                      >
                        <span className="alx-card__stripe" aria-hidden="true" />
                        <div className="alx-card__main">
                          <div className="alx-card__top">
                            <span className="alx-card__title">{alert.title}</span>
                            <span className={`badge badge--${alert.severity}`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="alx-card__meta">
                            {f ? (
                              <>
                                <span className="alx-tag" data-class={f.class_id}>
                                  <i aria-hidden="true" />
                                  {pretty(f.class_id)}
                                </span>
                                <span>{assetName(f.asset_id)}</span>
                                <span>
                                  risk <b className="mono">{f.risk_score}</b>
                                </span>
                              </>
                            ) : (
                              <span className="mono">{alert.finding_id}</span>
                            )}
                          </p>
                          <div
                            className="alx-bar"
                            aria-hidden="true"
                            title="Share of assumed 4h SLA window remaining"
                          >
                            <i style={{ width: `${Math.max(left, tone === "breach" ? 1 : 0.02) * 100}%` }} />
                            <u style={{ left: `${(SLA_WARN_MS / (4 * 3_600_000)) * 100}%` }} />
                          </div>
                        </div>
                        <div className="alx-card__side">
                          <span className="alx-clock mono">
                            {alert.ack_at ? "acked" : remainingLabel(alert, now)}
                          </span>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={Boolean(alert.ack_at) || acking === alert.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void onAck(alert.id);
                            }}
                          >
                            {alert.ack_at
                              ? "Acked"
                              : acking === alert.id
                                ? "…"
                                : "Ack"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {flat.length === 0 && loaded && !error ? (
            <p className="catalog__empty">No alerts match filters.</p>
          ) : null}
        </div>

        <aside className="evx-inspector alx-inspector" aria-label="Alert inspector">
          {selected ? (
            <div
              key={selected.id}
              className="evx-inspector__in"
              data-sev={selected.severity}
            >
              <div className="alx-focus">
                <RingGauge
                  value={selected.ack_at ? 1 : slaLeft(selected.sla_due_at, now)}
                  size={120}
                  stroke={8}
                  tone={
                    selected.ack_at
                      ? "ok"
                      : (({ none: "steel", ok: "volt", warn: "warn", breach: "breach" }) as const)[
                      slaTone(selected.sla_due_at, now)
                      ]
                  }
                  label={selected.ack_at ? "ACK" : remainingLabel(selected, now)}
                  sub={
                    selected.ack_at
                      ? "owned"
                      : slaTone(selected.sla_due_at, now) === "breach"
                        ? "over SLA"
                        : "to SLA"
                  }
                />
                <div>
                  <span className={`badge badge--${selected.severity}`}>
                    {selected.severity}
                  </span>
                  <h2>{selected.title}</h2>
                  <p className="mono">{selected.id}</p>
                </div>
              </div>

              <ol className="alx-timeline" aria-label="Escalation timeline">
                {(
                  [
                    ["Raised", "Finding opened alert", true],
                    [
                      "Warn",
                      "T−30m escalation",
                      slaTone(selected.sla_due_at, now) !== "ok",
                    ],
                    [
                      "Due",
                      selected.sla_due_at
                        ? new Date(selected.sla_due_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "no SLA",
                      slaTone(selected.sla_due_at, now) === "breach",
                    ],
                    [
                      "Ack",
                      selected.ack_at
                        ? new Date(selected.ack_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "pending",
                      Boolean(selected.ack_at),
                    ],
                  ] as const
                ).map(([name, note, done]) => (
                  <li key={name} className={done ? "is-done" : undefined}>
                    <i aria-hidden="true" />
                    <b>{name}</b>
                    <span>{note}</span>
                  </li>
                ))}
              </ol>

              <dl className="evx-facts">
                <div>
                  <dt>Class</dt>
                  <dd>{selFinding ? pretty(selFinding.class_id) : "—"}</dd>
                </div>
                <div>
                  <dt>Risk score</dt>
                  <dd className="mono">{selFinding?.risk_score ?? "—"}</dd>
                </div>
                <div>
                  <dt>Asset</dt>
                  <dd>
                    {selFinding ? (
                      <Link to={`/assets/${selFinding.asset_id}`}>
                        {assetName(selFinding.asset_id)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Finding</dt>
                  <dd className="mono">{selected.finding_id}</dd>
                </div>
                <div>
                  <dt>Inspection</dt>
                  <dd>
                    {selInspection ? (
                      <>
                        <span className={`chip chip--status-${selInspection.status}`}>
                          {pretty(selInspection.status)}
                        </span>{" "}
                        <span className="mono">{selInspection.id}</span>
                      </>
                    ) : (
                      <span className="mono">{selected.inspection_id ?? "—"}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Crew</dt>
                  <dd>{selInspection?.assignee ?? "—"}</dd>
                </div>
              </dl>

              {selFinding ? (
                <p className="alx-reco">
                  <span>Recommended action</span>
                  {selFinding.recommendation}
                </p>
              ) : null}

              {selEvidence.length > 0 ? (
                <div className="alx-evid">
                  <p className="alx-sub">Triggering evidence</p>
                  <ul>
                    {selEvidence.map((ev, i) => (
                      <li key={ev.id} data-class={ev.class_id ?? ev.kind}>
                        <button
                          type="button"
                          className="alx-evid__btn"
                          onClick={() => {
                            setLbIndex(i);
                            setLightbox(true);
                          }}
                        >
                          <EvidenceThumb ev={ev} className="alx-evid__img" />
                          <span>{ev.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="alx-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    !canWrite ||
                    Boolean(selected.ack_at) ||
                    acking === selected.id
                  }
                  onClick={() => void onAck(selected.id)}
                >
                  {selected.ack_at ? "Acknowledged" : "Acknowledge"}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={!canWrite || Boolean(selected.escalated_at)}
                  onClick={() => void onEscalate(selected.id)}
                >
                  {selected.escalated_at ? "Escalated" : "Escalate"}
                </button>
                <Link
                  className="btn btn--ghost btn--sm alx-ghost"
                  to={`/findings/${selected.finding_id}`}
                >
                  Finding detail
                </Link>
                {selFinding ? (
                  <Link
                    className="btn btn--ghost btn--sm alx-ghost"
                    to={`/map?asset=${encodeURIComponent(selFinding.asset_id)}`}
                  >
                    Locate on map
                  </Link>
                ) : null}
              </div>
              <p className="evx-inspector__foot">
                ↑/↓ or j/k to browse · a to acknowledge
                {selected.dept_code ? ` · dept ${selected.dept_code}` : ""}
              </p>
            </div>
          ) : (
            <p className="evx-inspector__empty">
              {loaded ? "No alert selected." : "Loading alerts…"}
            </p>
          )}
        </aside>
      </div>

      {lightbox && selEvidence.length > 0 ? (
        <EvidenceLightbox
          items={selEvidence}
          index={lbIndex}
          onClose={() => setLightbox(false)}
          onIndex={setLbIndex}
        />
      ) : null}
    </section>
  );
}
