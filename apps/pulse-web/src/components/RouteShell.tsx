type RouteShellProps = {
  title: string;
  summary: string;
};

/** Empty catalog route — no fake dashboard rows. */
export function RouteShell({ title, summary }: RouteShellProps) {
  return (
    <section className="route-shell">
      <p className="route-shell__eyebrow">TPulse</p>
      <h1 className="route-shell__title">{title}</h1>
      <p className="route-shell__summary">{summary}</p>
      <p className="route-shell__empty">No records yet — shell only.</p>
    </section>
  );
}
