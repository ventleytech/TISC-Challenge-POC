import { NavLink, Outlet, useLocation } from "react-router-dom";

const primary: { to: string; label: string; end?: boolean; hint: string }[] = [
  { to: "/", label: "Home", end: true, hint: "Brand" },
  { to: "/inspections", label: "Inspections", hint: "Lifecycle" },
  { to: "/assets", label: "Assets", hint: "Registry" },
  { to: "/priority", label: "Priority", hint: "Risk board" },
  { to: "/map", label: "Map", hint: "Corridor" },
  { to: "/alerts", label: "Alerts", hint: "SLA / ack" },
  { to: "/evidence", label: "Evidence", hint: "Objects" },
  { to: "/admin", label: "Admin", hint: "Ops health" },
];

export function AppShell() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className={`shell${isHome ? " shell--home" : " shell--ops"}`}>
      {isHome ? (
        <header className="topbar">
          <NavLink to="/" className="topbar__mark" end>
            <span className="topbar__mark-glyph" aria-hidden="true" />
            <span className="topbar__mark-text">VoltPulse</span>
          </NavLink>
          <nav className="topbar__nav" aria-label="Primary">
            {primary
              .filter((l) => l.to !== "/")
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `topbar__link${isActive ? " is-active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
          </nav>
        </header>
      ) : (
        <aside className="rail" aria-label="VoltPulse navigation">
          <NavLink to="/" className="rail__brand" end>
            <span className="rail__glyph" aria-hidden="true" />
            <span className="rail__brand-text">
              <strong>VoltPulse</strong>
              <span>Energy inspection OS</span>
            </span>
          </NavLink>
          <nav className="rail__nav">
            <p className="rail__sec">Operate</p>
            {primary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rail__link${isActive ? " is-active" : ""}`
                }
              >
                <span className="rail__link-label">{link.label}</span>
                <span className="rail__link-hint">{link.hint}</span>
              </NavLink>
            ))}
          </nav>
          <div className="rail__foot">
            <span className="rail__plane">Sense · Media · Stream · Data</span>
            <span className="rail__live">
              <i className="rail__pulse" aria-hidden="true" /> Demo utility
            </span>
          </div>
        </aside>
      )}
      <div className="shell__stage">
        {!isHome ? (
          <header className="opsbar">
            <p className="opsbar__crumb">
              VoltPulse <span>/</span> {pathname.replace(/^\//, "") || "home"}
            </p>
            <p className="opsbar__tag">Industrial preview · mock bus</p>
          </header>
        ) : null}
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
