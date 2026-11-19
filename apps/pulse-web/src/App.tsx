import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { AppShell } from "./components/AppShell";
import { initLocale } from "./i18n";
import { AdminConfigPage } from "./pages/admin/AdminConfigPage";
import { AdminHealthPage } from "./pages/admin/AdminHealthPage";
import { AdminOnboardingPage } from "./pages/admin/AdminOnboardingPage";
import { AdminRetrainPage } from "./pages/admin/AdminRetrainPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { AssetsPage } from "./pages/AssetsPage";
import { CompliancePage } from "./pages/CompliancePage";
import { EvidencePage } from "./pages/EvidencePage";
import { FindingDetailPage } from "./pages/FindingDetailPage";
import { HomePage } from "./pages/HomePage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { InspectionsPage } from "./pages/InspectionsPage";
import { LabelsPage } from "./pages/LabelsPage";
import { LiveSessionPage } from "./pages/LiveSessionPage";
import { LoginPage } from "./pages/LoginPage";
import { MapPage } from "./pages/MapPage";
import { OpsSectionLayout } from "./pages/OpsSectionLayout";
import { PlatformUtilitiesPage } from "./pages/PlatformUtilitiesPage";
import { PriorityBoardPage } from "./pages/PriorityBoardPage";
import { ScheduleIndexPage } from "./pages/ScheduleIndexPage";
import { ScheduleWizardPage } from "./pages/ScheduleWizardPage";
import { TasksPage } from "./pages/TasksPage";
import { UploadSessionPage } from "./pages/UploadSessionPage";

initLocale();

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="inspections" element={<OpsSectionLayout />}>
            <Route index element={<InspectionsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
          </Route>
          <Route path="tasks" element={<Navigate to="/inspections/tasks" replace />} />
          <Route path="incidents" element={<Navigate to="/inspections/incidents" replace />} />
          <Route path="inspections/schedule" element={<ScheduleIndexPage />} />
          <Route
            path="inspections/schedule/:kind"
            element={<ScheduleWizardPage />}
          />
          <Route
            path="inspections/:inspectionId/live"
            element={<LiveSessionPage />}
          />
          <Route
            path="inspections/:inspectionId/upload"
            element={<UploadSessionPage />}
          />
          <Route path="findings/:findingId" element={<FindingDetailPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="assets/:assetId" element={<AssetDetailPage />} />
          <Route path="priority" element={<PriorityBoardPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="labels" element={<LabelsPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route
            path="reports"
            element={<Navigate to="/compliance" replace />}
          />
          <Route path="admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/config" element={<AdminConfigPage />} />
          <Route path="admin/health" element={<AdminHealthPage />} />
          <Route path="admin/onboarding" element={<AdminOnboardingPage />} />
          <Route path="admin/retrain" element={<AdminRetrainPage />} />
          <Route path="platform/utilities" element={<PlatformUtilitiesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
