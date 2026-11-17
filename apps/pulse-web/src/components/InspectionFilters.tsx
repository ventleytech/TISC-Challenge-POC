import {
  INSPECTION_STATUSES,
  SCHEDULE_KINDS,
  type InspectionStatus,
  type ScheduleKind,
} from "../types/domain";

export type InspectionFilterState = {
  status: InspectionStatus | "";
  scheduleKind: ScheduleKind | "";
};

type Props = {
  value: InspectionFilterState;
  onChange: (next: InspectionFilterState) => void;
};

export function InspectionFilters({ value, onChange }: Props) {
  return (
    <form
      className="filters"
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
              {s}
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
    </form>
  );
}
