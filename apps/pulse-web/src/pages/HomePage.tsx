import { Link } from "react-router-dom";
import { CorridorVisual } from "../components/CorridorVisual";

export function HomePage() {
  return (
    <section className="hero" aria-labelledby="vp-brand">
      <div className="hero__atmosphere" aria-hidden="true">
        <CorridorVisual />
      </div>

      <div className="hero__copy">
        <p className="hero__plane">Sense · Media · Stream · Data</p>
        <h1 id="vp-brand" className="hero__brand">
          VoltPulse
        </h1>
        <p className="hero__lede">
          Drone and media inspection OS for energy corridors — detect, rank,
          alert.
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary" to="/inspections">
            Open inspections
          </Link>
          <Link className="btn btn--ghost" to="/alerts">
            View alerts
          </Link>
        </div>
      </div>
    </section>
  );
}
