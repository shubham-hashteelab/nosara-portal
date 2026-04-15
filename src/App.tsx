import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectListPage from "@/pages/projects/ProjectListPage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import BuildingDetailPage from "@/pages/hierarchy/BuildingDetailPage";
import FloorDetailPage from "@/pages/hierarchy/FloorDetailPage";
import FlatDetailPage from "@/pages/hierarchy/FlatDetailPage";
import InspectionListPage from "@/pages/inspections/InspectionListPage";
import InspectionDetailPage from "@/pages/inspections/InspectionDetailPage";
import ChecklistTemplatePage from "@/pages/checklists/ChecklistTemplatePage";
import FlatTypeRoomsPage from "@/pages/checklists/FlatTypeRoomsPage";
import UserListPage from "@/pages/users/UserListPage";
import ContractorListPage from "@/pages/contractors/ContractorListPage";
import ReportPage from "@/pages/reports/ReportPage";
import FloorPlansPage from "@/pages/floorplans/FloorPlansPage";
import SettingsPage from "@/pages/SettingsPage";

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Requires authentication */}
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route
            path="projects/:id/buildings/:bid"
            element={<BuildingDetailPage />}
          />
          <Route
            path="buildings/:bid/floors/:fid"
            element={<FloorDetailPage />}
          />
          <Route
            path="floors/:fid/flats/:flatId"
            element={<FlatDetailPage />}
          />
          <Route path="inspections" element={<InspectionListPage />} />
          <Route
            path="inspections/:entryId"
            element={<InspectionDetailPage />}
          />
          <Route path="floor-plans" element={<FloorPlansPage />} />
          <Route path="checklists" element={<ChecklistTemplatePage />} />
          <Route
            path="checklists/room-definitions"
            element={<FlatTypeRoomsPage />}
          />
          <Route path="users" element={<UserListPage />} />
          <Route path="contractors" element={<ContractorListPage />} />
          <Route path="reports" element={<ReportPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
