import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listAlerts, liveApiEnabled } from "../mock/client";
import type { Alert } from "../types/domain";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  badge?: boolean;
};

const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: "⌂", end: true },
  { to: "/inspections", label: "Inspections", icon: "♧" },
  { to: "/priority", label: "Findings", icon: "▤" },
  { to: "/alerts", label: "Alerts", icon: "♧", badge: true },
  { to: "/map", label: "Corridors", icon: "⌁" },
  { to: "/assets", label: "Assets", icon: "▱" },
  { to: "/compliance", label: "Reports", icon: "▥" },
  { to: "/admin/users", label: "Admin", icon: "⚙" },
  { to: "/labels", label: "Settings", icon: "☷" },
];

function crumbLabel(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/priority") || pathname.startsWith("/findings")) {
    return "findings";
  }
  if (pathname.startsWith("/map")) return "corridors";
  if (pathname.startsWith("/compliance") || pathname.startsWith("/reports")) {
    return "reports";
  }
  if (pathname.startsWith("/labels")) return "settings";
  if (pathname.startsWith("/admin")) return "admin";
  const seg = pathname.replace(/^\//, "").split("/")[0];
  return seg || "home";
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { principal, live, degraded, logout, canWrite, isPlatform, refreshMe } =
    useAuth();
  const [search, setSearch] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notifs, setNotifs] = useState<Alert[]>([]);

  useEffect(() => {
    setNavOpen(false);
    setBellOpen(false);
  }, [pathname]);

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

  const nav = useMemo(() => {
    const items = [...PRIMARY_NAV];
    if (isPlatform) {
      items.push({
        to: "/platform/utilities",
        label: "Platform",
        icon: "◈",
      });
    }
    return items;
  }, [isPlatform]);

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

  const liveLabel = liveApiEnabled() && live ? "Live · pulse-api" : "Demo environment";

  return (
    <div className={`app${navOpen ? " nav-open" : ""}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close navigation"
        onClick={() => setNavOpen(false)}
      />
      <aside className="sidebar" aria-label="TPulse navigation">
        <NavLink to="/" className="brand" end>
          <span className="brand-symbol" aria-hidden="true">
            ϟ
          </span>
          <span>
            <span className="brand-name">TPulse</span>
            <span className="brand-sub">TRANSMISSION PULSE</span>
          </span>
        </NavLink>

        <p className="nav-label">OPERATE</p>
        <nav className="nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && unread > 0 ? (
                <span className="badge-count">{unread}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="nav-separator" aria-hidden="true" />
        <div className="sidebar-bottom">
          GRID OPERATIONS PLATFORM · DEMO ENVIRONMENT
          <strong>{principal?.utility_id ?? "platform"}</strong>
        </div>
        <div className="sidebar-art" aria-hidden="true" />
      </aside>

      <div className="main">
        {(degraded || !liveApiEnabled() || !live) && (
          <div
            className="filter-row"
            role="status"
            style={{
              margin: 0,
              padding: "10px 28px",
              background: "#fff7dc",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="muted" style={{ flex: 1, fontSize: 12 }}>
              {degraded
                ? "Live API / realtime degraded — showing mock or cached data."
                : !liveApiEnabled()
                  ? "Mock mode (VITE_PULSE_MOCK) — writes stay local."
                  : "Offline banner — reconnect pulse-api for live rows."}
            </span>
            <button
              type="button"
              className="btn-outline"
              onClick={() => void refreshMe()}
            >
              Refresh
            </button>
          </div>
        )}

        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="nav-toggle"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              ☰
            </button>
            <p className="breadcrumb">
              TPulse / <b>{crumbLabel(pathname)}</b>
            </p>
          </div>
          <div className="top-actions">
            <form onSubmit={onSearch} role="search">
              <input
                className="field"
                type="search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Global search"
                style={{ minWidth: 160, minHeight: 37, padding: "0 12px" }}
              />
            </form>
            <span className="live-status">{liveLabel}</span>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="top-icon"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                aria-expanded={bellOpen}
                onClick={() => setBellOpen((o) => !o)}
              >
                ◉
                {unread > 0 ? <sup>{unread}</sup> : null}
              </button>
              {bellOpen ? (
                <div
                  className="panel"
                  role="dialog"
                  aria-label="Notifications"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "110%",
                    width: 280,
                    zIndex: 20,
                    padding: 12,
                  }}
                >
                  <div className="panel-head">
                    <strong className="panel-title">Open alerts</strong>
                    <Link
                      className="text-link"
                      to="/alerts"
                      onClick={() => setBellOpen(false)}
                    >
                      All alerts
                    </Link>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {notifs.length === 0 ? (
                      <li className="muted" style={{ fontSize: 12 }}>
                        No open alerts
                      </li>
                    ) : (
                      notifs.map((a) => (
                        <li key={a.id} style={{ marginBottom: 8 }}>
                          <Link
                            to="/alerts"
                            onClick={() => setBellOpen(false)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              fontSize: 12,
                            }}
                          >
                            <span>{a.title}</span>
                            <span className={`severity-tag ${a.severity}`}>
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
            <span className="operator">
              {principal?.role ?? "—"}
              {!canWrite ? " · RO" : ""}
            </span>
            <button type="button" className="btn-outline" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
