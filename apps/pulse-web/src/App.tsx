import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AdminPage } from "./pages/AdminPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { AssetsPage } from "./pages/AssetsPage";
import { EvidencePage } from "./pages/EvidencePage";
import { HomePage } from "./pages/HomePage";
import { InspectionsPage } from "./pages/InspectionsPage";
import { PriorityBoardPage } from "./pages/PriorityBoardPage";
import { ScheduleIndexPage } from "./pages/ScheduleIndexPage";
import { ScheduleWizardPage } from "./pages/ScheduleWizardPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="inspections/schedule" element={<ScheduleIndexPage />} />
        <Route
          path="inspections/schedule/:kind"
          element={<ScheduleWizardPage />}
        />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/:assetId" element={<AssetDetailPage />} />
        <Route path="priority" element={<PriorityBoardPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
