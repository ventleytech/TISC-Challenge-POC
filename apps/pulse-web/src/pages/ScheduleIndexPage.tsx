import { Link } from "react-router-dom";
import { SCHEDULE_KINDS, type ScheduleKind } from "../types/domain";

const copy: Record<ScheduleKind, string> = {
  line: "Corridor / transmission line survey plan",
  feeder: "Distribution feeder run with asset pick",
  substation: "Yard / bay inspection plan",
};

export function ScheduleIndexPage() {
  return (
    <section className="catalog">
      <p className="catalog__eyebrow">
        <Link to="/inspections">Inspections</Link> / schedule
      </p>
      <h1 className="catalog__title">Schedule by asset type</h1>
      <p className="catalog__summary">
        S8 wizard shells — pick a kind. Creates a planned inspection via mock client.
      </p>

      <ul className="wizard-kinds" aria-label="Schedule kinds">
        {SCHEDULE_KINDS.map((kind) => (
          <li key={kind}>
            <Link className="wizard-kind" to={`/inspections/schedule/${kind}`}>
              <span className="wizard-kind__label">{kind}</span>
              <span className="wizard-kind__hint">{copy[kind]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
