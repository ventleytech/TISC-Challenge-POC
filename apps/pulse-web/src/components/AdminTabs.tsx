import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/config", label: "Config" },
  { to: "/admin/health", label: "Health" },
  { to: "/admin/onboarding", label: "Onboarding" },
  { to: "/admin/retrain", label: "Retrain" },
  { to: "/compliance", label: "Compliance" },
];

export function AdminTabs() {
  return (
    <nav className="subnav admin-tabs" aria-label="Admin">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `subtab${isActive ? " active" : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
