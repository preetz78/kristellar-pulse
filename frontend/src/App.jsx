import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";

// Admin Pages
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminProjects from "./pages/Admin/Projects";
import TaskInsights from "./pages/Admin/TaskInsights";
import AdminTeam from "./pages/Admin/Team";

// Manager Pages
import ManagerDashboard from "./pages/Manager/Dashboard";
import ManagerProjects from "./pages/Manager/Projects";
import ProjectDetail from "./pages/Manager/ProjectDetail";
import ManagerTaskInsights from "./pages/Manager/TaskInsights";

// Reviewer Pages (New)
import ReviewerDashboard from "./pages/Reviewer/Dashboard";
import ReviewerProjects from "./pages/Reviewer/Projects";
import ReviewerTaskInsights from "./pages/Reviewer/TaskInsights";

const getDefaultRoute = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  if (role === "reviewer") return "/reviewer/dashboard";   
  return "/login";
};

function App() {
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  useEffect(() => {
    const syncRole = () => setRole(localStorage.getItem("role"));

    window.addEventListener("storage", syncRole);
    window.addEventListener("auth-change", syncRole);

    return () => {
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("auth-change", syncRole);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Navigate to={getDefaultRoute(role)} replace />} />

        {/* ADMIN ROUTES */}
        {role === "admin" && (
          <Route path="/admin" element={<DashboardLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="task-insights" element={<TaskInsights />} />
            <Route path="team" element={<AdminTeam />} />
          </Route>
        )}

        {/* MANAGER ROUTES */}
        {role === "manager" && (
          <Route path="/manager" element={<DashboardLayout />}>
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="projects" element={<ManagerProjects />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="task-insights" element={<ManagerTaskInsights />} />
          </Route>
        )}

        {/* REVIEWER ROUTES  */}
        {role === "reviewer" && (
          <Route path="/reviewer" element={<DashboardLayout />}>
            <Route path="dashboard" element={<ReviewerDashboard />} />
            <Route path="projects" element={<ReviewerProjects />} />
            {/* <Route path="projects/:projectId" element={<ProjectDetail />} /> */}
            <Route path="task-insights" element={<ReviewerTaskInsights />} />
          </Route>
        )}

        <Route path="*" element={<Navigate to={getDefaultRoute(role)} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;