import {
  ASSET_KINDS,
  CRITICALITIES,
  type AssetKind,
  type Criticality,
} from "../types/domain";

export type AssetFilterState = {
  kind: AssetKind | "";
  criticality: Criticality | "";
  q: string;
};

type Props = {
  value: AssetFilterState;
  onChange: (next: AssetFilterState) => void;
};

export function AssetFilters({ value, onChange }: Props) {
  return (
    <form
      className="filters"
      aria-label="Asset filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="filters__field">
        <span className="filters__label">Search</span>
        <input
          className="filters__input"
          type="search"
          value={value.q}
          placeholder="Name"
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </label>
      <label className="filters__field">
        <span className="filters__label">Kind</span>
        <select
          className="filters__select"
          value={value.kind}
          onChange={(e) =>
            onChange({ ...value, kind: e.target.value as AssetKind | "" })
          }
        >
          <option value="">All</option>
          {ASSET_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label className="filters__field">
        <span className="filters__label">Criticality</span>
        <select
          className="filters__select"
          value={value.criticality}
          onChange={(e) =>
            onChange({
              ...value,
              criticality: e.target.value as Criticality | "",
            })
          }
        >
          <option value="">All</option>
          {CRITICALITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
