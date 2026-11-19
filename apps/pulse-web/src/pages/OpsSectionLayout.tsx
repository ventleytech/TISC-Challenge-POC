import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/inspections", label: "Inspections", end: true },
  { to: "/inspections/tasks", label: "Tasks" },
  { to: "/inspections/incidents", label: "Incidents" },
];

export function OpsSectionLayout() {
  return (
    <div className="ops-section">
      <nav className="section-tabs" aria-label="Energy operations">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `section-tabs__link${isActive ? " is-active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
