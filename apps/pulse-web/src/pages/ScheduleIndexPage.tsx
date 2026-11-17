import { Link } from "react-router-dom";
import { assetsForScheduleKind } from "../mock/client";
import { SCHEDULE_KINDS, type ScheduleKind } from "../types/domain";

const copy: Record<
  ScheduleKind,
  {
    hint: string;
    fields: string;
    eta: string;
    lastRun: string;
    payload: string;
  }
> = {
  line: {
    hint: "Corridor / transmission line survey plan",
    fields: "Span km · RGB/IR payload · outage window",
    eta: "42–90 min",
    lastRun: "2026-11-18 · Drone Pod A",
    payload: "RGB + IR dual",
  },
  feeder: {
    hint: "Distribution feeder run with asset pick",
    fields: "Feeder ID · crew · clearance notes",
    eta: "25–55 min",
    lastRun: "2026-11-10 · Crew South",
    payload: "RGB primary",
  },
  substation: {
    hint: "Yard / bay inspection plan",
    fields: "Bay list · IR sweep · switching hold",
    eta: "60–120 min",
    lastRun: "2026-11-15 · Analyst Mira",
    payload: "IR + clip",
  },
};

export function ScheduleIndexPage() {
  return (
    <section className="catalog catalog--wide">
      <p className="catalog__eyebrow">
        <Link to="/inspections">Inspections</Link> / schedule
      </p>
      <h1 className="catalog__title">Schedule by asset type</h1>
      <p className="catalog__summary">
        S8 wizards — pick a kind. Creates a planned inspection via mock client.
        Cards carry ETA, last run, and payload weight for demo.
      </p>

      <ul className="wizard-kinds wizard-kinds--rich" aria-label="Schedule kinds">
        {SCHEDULE_KINDS.map((kind, index) => {
          const assets = assetsForScheduleKind(kind);
          const meta = copy[kind];
          return (
            <li key={kind} style={{ animationDelay: `${index * 70}ms` }}>
              <Link
                className="wizard-kind wizard-kind--rich"
                to={`/inspections/schedule/${kind}`}
              >
                <span className="wizard-kind__label">{kind}</span>
                <span className="wizard-kind__hint">{meta.hint}</span>
                <ul className="wizard-kind__stats">
                  <li>
                    <strong>{assets.length}</strong> assets ready
                  </li>
                  <li>
                    <strong>{meta.eta}</strong> typical ETA
                  </li>
                  <li>
                    <strong>{meta.payload}</strong>
                  </li>
                </ul>
                <span className="wizard-kind__fields">{meta.fields}</span>
                <span className="wizard-kind__last">Last: {meta.lastRun}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
