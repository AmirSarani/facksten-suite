import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./components/AdminShell";
import { AuthProvider, GuestRoute, ProtectedRoute } from "./lib/auth";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LegalPage } from "./pages/LegalPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectFormPage, ProjectsListPage } from "./pages/ProjectsPages";
import { ServiceFormPage, ServicesListPage } from "./pages/ServicesPages";
import { SettingsPage } from "./pages/SettingsPage";
import { TeamFormPage, TeamListPage } from "./pages/TeamPages";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/portfolio-admin">
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="services" element={<ServicesListPage />} />
              <Route path="services/new" element={<ServiceFormPage />} />
              <Route path="services/:id" element={<ServiceFormPage />} />
              <Route path="projects" element={<ProjectsListPage />} />
              <Route path="projects/new" element={<ProjectFormPage />} />
              <Route path="projects/:id" element={<ProjectFormPage />} />
              <Route path="team" element={<TeamListPage />} />
              <Route path="team/new" element={<TeamFormPage />} />
              <Route path="team/:id" element={<TeamFormPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="legal" element={<LegalPage />} />
              <Route path="leads" element={<LeadsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
