import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AlertsPage } from "./pages/AlertsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { HomePage } from "./pages/HomePage";
import { InspectionsPage } from "./pages/InspectionsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
