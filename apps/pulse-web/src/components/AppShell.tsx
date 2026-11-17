import { NavLink, Outlet, useLocation } from "react-router-dom";

const links: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Home", end: true },
  { to: "/inspections", label: "Inspections" },
  { to: "/assets", label: "Assets" },
  { to: "/alerts", label: "Alerts" },
];

export function AppShell() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className={`shell${isHome ? " shell--home" : ""}`}>
      <header className="topbar">
        <NavLink to="/" className="topbar__mark" end>
          <span className="topbar__mark-glyph" aria-hidden="true" />
          <span className="topbar__mark-text">VoltPulse</span>
        </NavLink>
        <nav className="topbar__nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `topbar__link${isActive ? " is-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}
