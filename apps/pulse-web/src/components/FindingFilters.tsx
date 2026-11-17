import {
  DETECTION_CLASSES,
  SEVERITIES,
  type DetectionClass,
  type Severity,
} from "../types/domain";

export type FindingFilterState = {
  classId: DetectionClass | "";
  severity: Severity | "";
  minRisk: string;
};

type FindingFiltersProps = {
  value: FindingFilterState;
  onChange: (next: FindingFilterState) => void;
};

export function FindingFilters({ value, onChange }: FindingFiltersProps) {
  return (
    <div className="filters" role="group" aria-label="Finding filters">
      <label className="filters__field">
        <span className="filters__label">Class</span>
        <select
          className="filters__select"
          value={value.classId}
          onChange={(e) =>
            onChange({
              ...value,
              classId: e.target.value as DetectionClass | "",
            })
          }
        >
          <option value="">All</option>
          {DETECTION_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Severity</span>
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
        <span className="filters__label">Min risk</span>
        <input
          className="filters__input"
          type="number"
          min={0}
          max={100}
          placeholder="0"
          value={value.minRisk}
          onChange={(e) => onChange({ ...value, minRisk: e.target.value })}
        />
      </label>
    </div>
  );
}
