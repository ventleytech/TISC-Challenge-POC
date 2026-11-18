import { NavLink, Outlet, useLocation } from "react-router-dom";
import { t } from "../i18n";

function navItems() {
  return [
    { to: "/", label: "Home", end: true as boolean | undefined, hint: "Brand" },
    { to: "/inspections", label: t("nav.inspections"), hint: "Lifecycle" },
    { to: "/assets", label: t("nav.assets"), hint: "Registry" },
    { to: "/priority", label: "Priority", hint: "Risk board" },
    { to: "/map", label: t("nav.map"), hint: "Corridor" },
    { to: "/alerts", label: t("nav.alerts"), hint: "SLA / ack" },
    { to: "/evidence", label: t("nav.evidence"), hint: "Objects" },
    { to: "/admin", label: t("nav.admin"), hint: "Ops health" },
  ];
}

export function AppShell() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const primary = navItems();

  return (
    <div className={`shell${isHome ? " shell--home" : " shell--ops"}`}>
      {isHome ? (
        <header className="topbar">
          <NavLink to="/" className="topbar__mark" end>
            <span className="topbar__mark-glyph" aria-hidden="true" />
            <span className="topbar__mark-text">{t("app.name")}</span>
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
              <strong>{t("app.name")}</strong>
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
              {t("app.name")} <span>/</span>{" "}
              {pathname.replace(/^\//, "") || "home"}
            </p>
            <p className="opsbar__tag">Industrial preview · live-by-default</p>
          </header>
        ) : null}
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
