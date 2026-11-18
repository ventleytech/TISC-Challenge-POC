import {
  INSPECTION_MODES,
  INSPECTION_STATUSES,
  SCHEDULE_KINDS,
  SEVERITIES,
  type InspectionMode,
  type InspectionStatus,
  type ScheduleKind,
  type Severity,
} from "../types/domain";

export type InspectionFilterState = {
  status: InspectionStatus | "";
  scheduleKind: ScheduleKind | "";
  siteId: string;
  severity: Severity | "";
  assignee: string;
  slaBreach: boolean;
  mode: InspectionMode | "";
};

type Props = {
  value: InspectionFilterState;
  onChange: (next: InspectionFilterState) => void;
  sites?: { id: string; label: string }[];
};

const DEFAULT_SITES = [
  { id: "site-north", label: "North Ridge" },
  { id: "site-south", label: "South Basin" },
  { id: "site-west", label: "West Gate" },
  { id: "site-east", label: "East Pier" },
];

export function InspectionFilters({
  value,
  onChange,
  sites = DEFAULT_SITES,
}: Props) {
  return (
    <form
      className="filters filters--dense"
      aria-label="Inspection filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="filters__field">
        <span className="filters__label">Status</span>
        <select
          className="filters__select"
          value={value.status}
          onChange={(e) =>
            onChange({
              ...value,
              status: e.target.value as InspectionStatus | "",
            })
          }
        >
          <option value="">All</option>
          {INSPECTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Site</span>
        <select
          className="filters__select"
          value={value.siteId}
          onChange={(e) => onChange({ ...value, siteId: e.target.value })}
        >
          <option value="">All</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Schedule kind</span>
        <select
          className="filters__select"
          value={value.scheduleKind}
          onChange={(e) =>
            onChange({
              ...value,
              scheduleKind: e.target.value as ScheduleKind | "",
            })
          }
        >
          <option value="">All</option>
          {SCHEDULE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Mode</span>
        <select
          className="filters__select"
          value={value.mode}
          onChange={(e) =>
            onChange({
              ...value,
              mode: e.target.value as InspectionMode | "",
            })
          }
        >
          <option value="">All</option>
          {INSPECTION_MODES.map((m) => (
            <option key={m} value={m}>
              {m.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Severity (linked)</span>
        <select
          className="filters__select"
          value={value.severity}
          onChange={(e) =>
            onChange({
              ...value,
              severity: e.target.value as Severity | "",
            })
          }
        >
          <option value="">All</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Assignee</span>
        <input
          className="filters__input"
          value={value.assignee}
          onChange={(e) => onChange({ ...value, assignee: e.target.value })}
          placeholder="Crew…"
        />
      </label>
      <label className="filters__field filters__field--check">
        <input
          type="checkbox"
          checked={value.slaBreach}
          onChange={(e) =>
            onChange({ ...value, slaBreach: e.target.checked })
          }
        />
        <span className="filters__label">SLA breach only</span>
      </label>
    </form>
  );
}
