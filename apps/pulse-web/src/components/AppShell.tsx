import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";
import { listAlerts, liveApiEnabled } from "../mock/client";
import type { Alert } from "../types/domain";

function navItems(opts: { isPlatform: boolean; isAdmin: boolean }) {
  const operate = [
    { to: "/", label: "Home", end: true as boolean | undefined, hint: "Brand" },
    { to: "/inspections", label: t("nav.inspections"), hint: "Runs · tasks" },
    { to: "/priority", label: "Priority", hint: "Risk board" },
    { to: "/alerts", label: t("nav.alerts"), hint: "SLA / ack" },
    { to: "/map", label: t("nav.map"), hint: "Corridor" },
    { to: "/evidence", label: t("nav.evidence"), hint: "Objects" },
    { to: "/assets", label: t("nav.assets"), hint: "Registry" },
  ];
  const system = [
    { to: "/admin/users", label: t("nav.admin"), hint: "Users · config" },
    { to: "/labels", label: "Labels", hint: "TP / FP queue" },
  ];
  if (opts.isPlatform) {
    system.push({
      to: "/platform/utilities",
      label: "Platform",
      hint: "Utilities",
    });
  }
  return { operate, system };
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { principal, live, degraded, logout, canWrite, isPlatform, isAdmin, refreshMe } =
    useAuth();
  const { operate, system } = navItems({ isPlatform, isAdmin });
  const [search, setSearch] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState<Alert[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listAlerts({ openOnly: true }).then((res) => {
      if (!cancelled) setNotifs(res.items.slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const unread = useMemo(
    () => notifs.filter((a) => !a.ack_at).length,
    [notifs],
  );

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    if (q.startsWith("fnd-") || q.startsWith("finding")) {
      navigate(`/findings/${q.replace(/^finding[:/]/, "")}`);
    } else if (q.startsWith("ast-")) {
      navigate(`/assets/${q}`);
    } else if (q.toLowerCase().includes("alert")) {
      navigate("/alerts");
    } else {
      navigate(`/inspections?q=${encodeURIComponent(q)}`);
    }
    setSearch("");
  }

  return (
    <div className="shell shell--ops">
      <aside className="rail" aria-label="TPulse navigation">
        <NavLink to="/" className="rail__brand" end>
          <span className="rail__glyph" aria-hidden="true" />
          <span className="rail__brand-text">
            <strong>{t("app.name")}</strong>
            <span>Transmission Pulse</span>
          </span>
        </NavLink>
        <nav className="rail__nav">
          <p className="rail__sec">Operate</p>
          {operate.map((link) => (
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
          <p className="rail__sec">System</p>
          {system.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
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
            <i className="rail__pulse" aria-hidden="true" />{" "}
            {principal?.utility_id ?? "platform"}
          </span>
        </div>
      </aside>

      <div className="shell__stage">
        {(degraded || !liveApiEnabled() || !live) && (
          <div className="degrade-banner" role="status">
            <span>
              {degraded
                ? "Live API / realtime degraded — showing mock or cached data."
                : !liveApiEnabled()
                  ? "Mock mode (VITE_PULSE_MOCK) — writes stay local."
                  : "Offline banner — reconnect pulse-api for live rows."}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => void refreshMe()}
            >
              Refresh / reconcile
            </button>
          </div>
        )}

        <header className="opsbar opsbar--rich">
          <p className="opsbar__crumb">
            {t("app.name")} <span>/</span>{" "}
            {pathname.replace(/^\//, "") || "home"}
          </p>
          <form className="opsbar__search" onSubmit={onSearch} role="search">
            <input
              type="search"
              placeholder="Search inspections, assets, findings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Global search"
            />
          </form>
          <div className="opsbar__actions">
            <div className="opsbar__bell-wrap">
              <button
                type="button"
                className="opsbar__bell"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                aria-expanded={bellOpen}
                onClick={() => setBellOpen((o) => !o)}
              >
                <span aria-hidden="true">◉</span>
                {unread > 0 ? (
                  <i className="opsbar__badge">{unread}</i>
                ) : null}
              </button>
              {bellOpen ? (
                <div className="notif-drawer" role="dialog" aria-label="Notifications">
                  <header>
                    <strong>Open alerts</strong>
                    <Link to="/alerts" onClick={() => setBellOpen(false)}>
                      All alerts
                    </Link>
                  </header>
                  <ul>
                    {notifs.length === 0 ? (
                      <li className="catalog__empty">No open alerts</li>
                    ) : (
                      notifs.map((a) => (
                        <li key={a.id}>
                          <Link
                            to="/alerts"
                            onClick={() => setBellOpen(false)}
                          >
                            <span>{a.title}</span>
                            <span className={`badge badge--${a.severity}`}>
                              {a.severity}
                            </span>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="opsbar__profile">
              <span className="opsbar__role">{principal?.role ?? "—"}</span>
              {!canWrite ? (
                <span className="opsbar__ro">read-only</span>
              ) : null}
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className={`shell__main${pathname === "/" ? " shell__main--home" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
