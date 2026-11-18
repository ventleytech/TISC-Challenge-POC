import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EvidenceThumb } from "../components/EvidenceThumb";
import { RingGauge } from "../components/RingGauge";
import { useNow } from "../components/sla";
import {
  assetName,
  listAlerts,
  listAssets,
  listEvidence,
  listFindings,
  listInspections,
  liveApiEnabled,
} from "../mock/client";
import {
  INSPECTION_STATUSES,
  SCHEDULE_KINDS,
  type Alert,
  type Asset,
  type EvidenceObject,
  type Finding,
  type Inspection,
  type InspectionStatus,
  type ScheduleKind,
} from "../types/domain";

/** Happy-path lifecycle shown as the funnel / stepper (cancelled is a side exit). */
const PIPELINE: InspectionStatus[] = INSPECTION_STATUSES.filter(
  (s) => s !== "cancelled",
);

const STAGE_NOTE: Record<InspectionStatus, string> = {
  planned: "Scheduled, crew assigned",
  in_progress: "Capture underway",
  processing: "Perception + rules running",
  review: "Analyst sign-off",
  closed: "Findings published",
  cancelled: "Aborted run",
};

/** Table order: active work first, then queued, then finished. */
const WORK_ORDER: InspectionStatus[] = [
  "in_progress",
  "processing",
  "review",
  "planned",
  "closed",
  "cancelled",
];

/** SLA-hot threshold in hours — matches the legacy table highlight. */
const SLA_HOT_H = 4;

type View = "table" | "board";

const pretty = (s: string) => s.replace(/_/g, " ");
const initials = (s?: string | null) =>
  (s ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Stepper({ status }: { status: InspectionStatus }) {
  const idx = PIPELINE.indexOf(status);
  if (status === "cancelled") {
    return <p className="inx-cancelled">Run cancelled</p>;
  }
  return (
    <ol className="inx-steps" aria-label={`Lifecycle: ${status}`}>
      {PIPELINE.map((s, i) => (
        <li
          key={s}
          data-status={s}
          className={i < idx ? "is-done" : i === idx ? "is-now" : undefined}
          title={`${pretty(s)} — ${STAGE_NOTE[s]}`}
        >
          <i aria-hidden="true" />
          <span>{pretty(s)}</span>
        </li>
      ))}
    </ol>
  );
}

function MiniSteps({ status }: { status: InspectionStatus }) {
  const idx = PIPELINE.indexOf(status);
  return (
    <span
      className={`inx-mini${status === "cancelled" ? " is-cancelled" : ""}`}
      aria-hidden="true"
    >
      {PIPELINE.map((s, i) => (
        <i key={s} className={i <= idx ? "is-on" : undefined} />
      ))}
    </span>
  );
}

function SlaHours({ h }: { h?: number | null }) {
  if (h == null) return <span className="inx-sla mono">—</span>;
  const hot = h <= SLA_HOT_H;
  return (
    <span className={`inx-sla mono${hot ? " is-hot" : ""}`}>
      <span className="inx-sla__bar">
        <i style={{ width: `${Math.min(100, (h / 72) * 100)}%` }} />
      </span>
      {h}h
    </span>
  );
}

export function InspectionsPage() {
  const [status, setStatus] = useState<InspectionStatus | "">("");
  const [kind, setKind] = useState<ScheduleKind | "">("");
  const [siteId, setSiteId] = useState("");
  const [mode, setMode] = useState<"" | "live_pull" | "record_upload">("");
  const [assignee, setAssignee] = useState("");
  const [slaBreach, setSlaBreach] = useState(false);
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("table");
  const [all, setAll] = useState<Inspection[]>([]);
  const [assets, setAssets] = useState<Map<string, Asset>>(new Map());
  const [findings, setFindings] = useState<Finding[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [evidence, setEvidence] = useState<EvidenceObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pane, setPane] = useState<"runs" | "detail">("runs");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const now = useNow(30_000);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [i, a, f, al, e] = await Promise.all([
          listInspections({}),
          listAssets({}),
          listFindings(),
          listAlerts({}),
          listEvidence({}),
        ]);
        if (cancelled) return;
        setAll(i.items);
        setAssets(new Map(a.items.map((x) => [x.id, x])));
        setFindings(f.items);
        setAlerts(al.items);
        setEvidence(e.items);
        setError(null);
        setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load inspections",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const name = useCallback(
    (id: string) => assets.get(id)?.name ?? assetName(id),
    [assets],
  );

  const statusCounts = useMemo(() => {
    const m = new Map<InspectionStatus, number>();
    for (const i of all) m.set(i.status, (m.get(i.status) ?? 0) + 1);
    return m;
  }, [all]);

  const kindCounts = useMemo(() => {
    const m = new Map<ScheduleKind, number>();
    for (const i of all) {
      if (i.schedule_kind) {
        m.set(i.schedule_kind, (m.get(i.schedule_kind) ?? 0) + 1);
      }
    }
    return m;
  }, [all]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const assigneeNeedle = assignee.trim().toLowerCase();
    return all
      .filter((i) => {
        if (status && i.status !== status) return false;
        if (kind && i.schedule_kind !== kind) return false;
        if (siteId && i.site_id !== siteId) return false;
        if (mode && i.mode !== mode) return false;
        if (
          assigneeNeedle &&
          !(i.assignee ?? "").toLowerCase().includes(assigneeNeedle)
        ) {
          return false;
        }
        if (
          slaBreach &&
          !(typeof i.sla_hours_left === "number" && i.sla_hours_left <= 0)
        ) {
          return false;
        }
        if (!needle) return true;
        const hay = [i.id, i.assignee ?? "", ...i.asset_ids.map(name)]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort(
        (a, b) =>
          WORK_ORDER.indexOf(a.status) - WORK_ORDER.indexOf(b.status) ||
          (a.sla_hours_left ?? 1e9) - (b.sla_hours_left ?? 1e9),
      );
  }, [all, status, kind, siteId, mode, assignee, slaBreach, q, name]);

  const selected = useMemo(
    () => visible.find((i) => i.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId],
  );

  const stats = useMemo(() => {
    const active = visible.filter(
      (i) => i.status === "in_progress" || i.status === "processing",
    ).length;
    const hot = visible.filter(
      (i) =>
        i.sla_hours_left != null &&
        i.sla_hours_left <= SLA_HOT_H &&
        i.status !== "closed" &&
        i.status !== "cancelled",
    ).length;
    const linked = visible.reduce((n, i) => n + (i.finding_count ?? 0), 0);
    const done = visible.filter((i) => i.status === "closed").length;
    return { active, hot, linked, done };
  }, [visible]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!visible.length || !selected) return;
      const i = visible.findIndex((x) => x.id === selected.id);
      setSelectedId(visible[(i + dir + visible.length) % visible.length].id);
    },
    [visible, selected],
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const live = liveApiEnabled();

  const selAssets = useMemo(() => selected?.asset_ids ?? [], [selected]);
  const selFindings = useMemo(
    () => findings.filter((f) => selAssets.includes(f.asset_id)).slice(0, 5),
    [findings, selAssets],
  );
  const selAlerts = useMemo(
    () => (selected ? alerts.filter((a) => a.inspection_id === selected.id) : []),
    [alerts, selected],
  );
  const selEvidence = useMemo(
    () =>
      selected
        ? evidence.filter((e) => e.inspection_id === selected.id).slice(0, 4)
        : [],
    [evidence, selected],
  );

  const row = (insp: Inspection, index: number) => (
    <tr
      key={insp.id}
      data-status={insp.status}
      style={{ animationDelay: `${Math.min(index, 14) * 40}ms` }}
      className={`dense-table__row dense-table__row--click inx-row${selected?.id === insp.id ? " is-selected" : ""}`}
      onClick={() => {
        setSelectedId(insp.id);
        setPane("detail");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedId(insp.id);
          setPane("detail");
        }
      }}
      tabIndex={0}
    >
      <td>
        <span className="mono">{insp.id}</span>
        <MiniSteps status={insp.status} />
      </td>
      <td>
        <span className={`chip chip--status-${insp.status}`}>
          {pretty(insp.status)}
        </span>
      </td>
      <td className="inx-assets">
        {insp.asset_ids.map((id) => (
          <span key={id} className="inx-asset" data-crit={assets.get(id)?.criticality}>
            {name(id)}
          </span>
        ))}
        {insp.asset_ids.length === 0 ? "—" : null}
      </td>
      <td>{insp.schedule_kind ?? "—"}</td>
      <td>
        <span className="inx-crew">
          <i aria-hidden="true">{initials(insp.assignee)}</i>
          {insp.assignee ?? "—"}
        </span>
      </td>
      <td>
        {insp.planned_at
          ? new Date(insp.planned_at).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          }) +
          " " +
          new Date(insp.planned_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "—"}
      </td>
      <td>
        <SlaHours h={insp.sla_hours_left} />
      </td>
      <td>
        <span className="inx-count mono">{insp.finding_count ?? 0}</span>
      </td>
    </tr>
  );

  return (
    <section className="evx inx evx--compact">
      <header className="page-chrome">
        <div className="page-chrome__lead">
          <p className="evx-eyebrow">TPulse · inspections</p>
          <h1 className="page-chrome__title">Inspection runs</h1>
          <p className="page-chrome__sub">
            Capture → perception → review. Filter the queue, open a run for
            detail.
          </p>
        </div>
        <div className="page-chrome__metrics" aria-label="Inspection summary">
          <div className="page-chrome__metric">
            <b>{visible.length}</b>
            <span>In view</span>
          </div>
          <div className="page-chrome__metric">
            <b>{stats.active}</b>
            <span>Live</span>
          </div>
          <div className="page-chrome__metric is-hot">
            <b>{stats.hot}</b>
            <span>SLA ≤ {SLA_HOT_H}h</span>
          </div>
          <div className="page-chrome__metric">
            <b>{stats.linked}</b>
            <span>Findings</span>
          </div>
        </div>
        <div className="page-chrome__actions">
          <span className={`evx-source evx-source--${live ? "live" : "mock"}`}>
            <i aria-hidden="true" />
            {live ? "Live" : "Mock · offline"}
          </span>
          <Link className="btn btn--primary btn--sm" to="/inspections/schedule">
            Schedule
          </Link>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setTick((n) => n + 1)}
          >
            Refresh
          </button>
          <Link className="btn btn--ghost btn--sm" to="/map">
            Map
          </Link>
        </div>
      </header>

      <div className="pane-tabs" role="tablist" aria-label="Inspection panes">
        <button
          type="button"
          role="tab"
          aria-selected={pane === "runs"}
          className={pane === "runs" ? "is-on" : undefined}
          onClick={() => setPane("runs")}
        >
          Runs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "detail"}
          className={pane === "detail" ? "is-on" : undefined}
          onClick={() => setPane("detail")}
          disabled={!selected}
        >
          Detail{selected ? ` · ${selected.id}` : ""}
        </button>
      </div>

      <div className="evx-toolbar" role="group" aria-label="Inspection filters">
        <div className="evx-pills">
          <button
            type="button"
            className={`evx-pill${status === "" ? " is-on" : ""}`}
            onClick={() => setStatus("")}
          >
            All <b>{all.length}</b>
          </button>
          {INSPECTION_STATUSES.filter((s) => statusCounts.has(s)).map((s) => (
            <button
              key={s}
              type="button"
              data-status={s}
              className={`evx-pill${status === s ? " is-on" : ""}`}
              onClick={() => setStatus(status === s ? "" : s)}
            >
              <i aria-hidden="true" />
              {pretty(s)} <b>{statusCounts.get(s)}</b>
            </button>
          ))}
        </div>
        <div className="evx-selects">
          <label>
            <span>Search</span>
            <input
              className="filters__select alx-search"
              type="search"
              placeholder="id, crew, asset…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label>
            <span>Site</span>
            <select
              className="filters__select"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">All</option>
              <option value="site-north">North Ridge</option>
              <option value="site-south">South Basin</option>
              <option value="site-west">West Gate</option>
              <option value="site-east">East Pier</option>
            </select>
          </label>
          <label>
            <span>Mode</span>
            <select
              className="filters__select"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as "" | "live_pull" | "record_upload")
              }
            >
              <option value="">All</option>
              <option value="live_pull">live pull</option>
              <option value="record_upload">record upload</option>
            </select>
          </label>
          <label>
            <span>Assignee</span>
            <input
              className="filters__select"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Crew…"
            />
          </label>
          <label className="filters__field--check">
            <span>SLA breach</span>
            <input
              type="checkbox"
              checked={slaBreach}
              onChange={(e) => setSlaBreach(e.target.checked)}
            />
          </label>
          <label>
            <span>Schedule kind</span>
            <select
              className="filters__select"
              value={kind}
              onChange={(e) => setKind(e.target.value as ScheduleKind | "")}
            >
              <option value="">All</option>
              {SCHEDULE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k} ({kindCounts.get(k) ?? 0})
                </option>
              ))}
            </select>
          </label>
          <div className="inx-view" role="group" aria-label="View">
            {(["table", "board"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={view === v ? "is-on" : undefined}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="catalog__error">{error}</p> : null}

      <div
        className={`evx-stage evx-stage--tabbed${pane === "detail" ? " is-detail" : " is-runs"}`}
      >
        {pane === "runs" && view === "table" ? (
          <div className="table-wrap inx-table">
            <table className="dense-table" aria-label="Inspections">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Status</th>
                  <th>Assets</th>
                  <th>Kind</th>
                  <th>Crew</th>
                  <th>Planned</th>
                  <th>SLA</th>
                  <th>Findings</th>
                </tr>
              </thead>
              <tbody>{visible.map(row)}</tbody>
            </table>
          </div>
        ) : null}
        {pane === "runs" && view === "board" ? (
          <div className="inx-board" aria-label="Inspection board">
            {INSPECTION_STATUSES.filter(
              (s) => !status || s === status,
            ).map((s) => {
              const col = visible.filter((i) => i.status === s);
              return (
                <section key={s} data-status={s} className="inx-col">
                  <header>
                    <i aria-hidden="true" />
                    <h2>{pretty(s)}</h2>
                    <b>{col.length}</b>
                  </header>
                  <ul>
                    {col.map((insp, index) => (
                      <li key={insp.id}>
                        <button
                          type="button"
                          data-status={insp.status}
                          className={`inx-kcard${selected?.id === insp.id ? " is-selected" : ""}`}
                          style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                          onClick={() => {
                            setSelectedId(insp.id);
                            setPane("detail");
                          }}
                        >
                          <span className="inx-kcard__id mono">{insp.id}</span>
                          <span className="inx-kcard__assets">
                            {insp.asset_ids.map(name).join(", ") || "No assets"}
                          </span>
                          <span className="inx-kcard__foot">
                            <span className="inx-crew">
                              <i aria-hidden="true">{initials(insp.assignee)}</i>
                              {insp.assignee ?? "unassigned"}
                            </span>
                            <SlaHours h={insp.sla_hours_left} />
                          </span>
                          <span className="inx-kcard__count mono">
                            {insp.finding_count ?? 0} findings
                          </span>
                        </button>
                      </li>
                    ))}
                    {col.length === 0 ? (
                      <li className="inx-col__empty">Empty</li>
                    ) : null}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : null}

        {pane === "detail" ? (
          <aside className="evx-inspector inx-inspector inx-inspector--pane" aria-label="Inspection detail">
            {selected ? (
              <div
                key={selected.id}
                className="evx-inspector__in"
                data-status={selected.status}
              >
                <div className="inx-inspector__bar">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setPane("runs")}
                  >
                    ← Runs
                  </button>
                  <span className="mono">{selected.id}</span>
                </div>
                <div className="inx-focus">
                  <RingGauge
                    value={
                      selected.sla_hours_left == null
                        ? 1
                        : Math.min(1, selected.sla_hours_left / 72)
                    }
                    size={104}
                    stroke={8}
                    tone={
                      selected.sla_hours_left == null
                        ? "steel"
                        : selected.sla_hours_left <= SLA_HOT_H
                          ? "breach"
                          : selected.sla_hours_left <= 24
                            ? "warn"
                            : "volt"
                    }
                    label={
                      selected.sla_hours_left == null
                        ? "—"
                        : `${selected.sla_hours_left}h`
                    }
                    sub="SLA left"
                  />
                  <div>
                    <span className={`chip chip--status-${selected.status}`}>
                      {pretty(selected.status)}
                    </span>
                    <h2 className="mono">{selected.id}</h2>
                    <p>{STAGE_NOTE[selected.status]}</p>
                  </div>
                </div>

                <Stepper status={selected.status} />

                <dl className="evx-facts">
                  <div>
                    <dt>Crew</dt>
                    <dd>{selected.assignee ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Kind</dt>
                    <dd>{selected.schedule_kind ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>{selected.mode?.replace(/_/g, " ") ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Site</dt>
                    <dd className="mono">{selected.site_id ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Planned</dt>
                    <dd>
                      {selected.planned_at
                        ? new Date(selected.planned_at).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Timing</dt>
                    <dd>
                      {selected.planned_at
                        ? (() => {
                          const h = Math.round(
                            (new Date(selected.planned_at).getTime() - now) /
                            3_600_000,
                          );
                          return h >= 0 ? `starts in ${h}h` : `${-h}h ago`;
                        })()
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Findings</dt>
                    <dd className="mono">{selected.finding_count ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Open alerts</dt>
                    <dd className="mono">
                      {selAlerts.filter((a) => !a.ack_at).length}
                    </dd>
                  </div>
                </dl>

                <div className="inx-block">
                  <p className="alx-sub">Assets</p>
                  <ul className="inx-alist">
                    {selAssets.map((id) => (
                      <li key={id} data-crit={assets.get(id)?.criticality}>
                        <Link to={`/assets/${id}`}>{name(id)}</Link>
                        <span className="mono">{assets.get(id)?.kind ?? id}</span>
                        <Link
                          className="inx-alist__map"
                          to={`/map?asset=${encodeURIComponent(id)}`}
                        >
                          map
                        </Link>
                      </li>
                    ))}
                    {selAssets.length === 0 ? <li>No assets linked</li> : null}
                  </ul>
                </div>

                {selFindings.length > 0 ? (
                  <div className="inx-block">
                    <p className="alx-sub">Findings on these assets</p>
                    <ul className="inx-flist">
                      {selFindings.map((f) => (
                        <li key={f.id} data-class={f.class_id}>
                          <i aria-hidden="true" />
                          <Link to={`/findings/${f.id}`}>{pretty(f.class_id)}</Link>
                          <span className={`badge badge--${f.severity}`}>
                            {f.severity}
                          </span>
                          <b className="mono">{f.risk_score}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selEvidence.length > 0 ? (
                  <div className="alx-evid">
                    <p className="alx-sub">Evidence</p>
                    <ul>
                      {selEvidence.map((ev) => (
                        <li key={ev.id} data-class={ev.class_id ?? ev.kind}>
                          <EvidenceThumb ev={ev} className="alx-evid__img" />
                          <span>{ev.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="alx-actions">
                  {(selected.mode === "live_pull" ||
                    selected.status === "in_progress") && (
                      <Link
                        className="btn btn--primary btn--sm"
                        to={`/inspections/${selected.id}/live`}
                      >
                        Live session
                      </Link>
                    )}
                  {(selected.mode === "record_upload" ||
                    selected.status === "planned") && (
                      <Link
                        className="btn btn--primary btn--sm"
                        to={`/inspections/${selected.id}/upload`}
                      >
                        Upload session
                      </Link>
                    )}
                  <Link className="btn btn--ghost btn--sm alx-ghost" to="/evidence">
                    Evidence
                  </Link>
                  <Link className="btn btn--ghost btn--sm alx-ghost" to="/alerts">
                    Alerts
                  </Link>
                </div>
                <p className="evx-inspector__foot">↑/↓ or j/k to browse runs</p>
              </div>
            ) : (
              <p className="evx-inspector__empty">
                {loaded ? "No inspection selected." : "Loading inspections…"}
              </p>
            )}
          </aside>
        ) : null}
      </div>

      {visible.length === 0 && loaded && !error ? (
        <p className="catalog__empty">No inspections match filters.</p>
      ) : null}
    </section>
  );
}
