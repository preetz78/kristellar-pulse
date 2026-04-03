import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";

// Admin Pages
import AdminOverview from "./pages/Admin/Overview";
import Organizations from "./pages/Admin/Organizations";
import AdminUsers from "./pages/Admin/Users";
import AdminProjects from "./pages/Admin/Projects";
import AdminTasks from "./pages/Admin/Tasks";
import AccessControl from "./pages/Admin/AccessControl";
import AuditLogs from "./pages/Admin/AuditLogs";
import Profile from "./pages/Admin/Profile";
import Settings from "./pages/Admin/Settings";
import ProjectDetails from "./pages/Admin/ProjectDetails";

// Manager Pages (NEW)
import ManagerOverview from "./pages/Manager/ManagerOverview";   
import ManagerProjects from "./pages/Manager/ManagerProjects";
import ManagerTasks from "./pages/Manager/ManagerTasks";      
import ManagerUsers from "./pages/Manager/ManagerUsers";    

// Employee Pages
import EmployeeOverview from "./pages/Employee/EmployeeOverview";
import EmployeeTasks from "./pages/Employee/EmployeeTasks";  
import EmployeeProjects from "./pages/Employee/EmployeeProjects";   


const getDefaultRoute = (role) => {
  if (role === "admin") return "/admin/overview";
  if (role === "manager") return "/manager/overview";
  if (role === "employee") return "/employee/overview";
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

        {/* ==================== ADMIN ROUTES ==================== */}
        {role === "admin" && (
          <Route path="/admin" element={<DashboardLayout />}>
            <Route path="overview" element={<AdminOverview />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="access-control" element={<AccessControl />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
          </Route>
        )}

        {/* ==================== MANAGER ROUTES ==================== */}
        {role === "manager" && (
          <Route path="/manager" element={<DashboardLayout />}>
            <Route path="overview" element={<ManagerOverview />} />      
            <Route path="projects" element={<ManagerProjects />} />       
            <Route path="tasks" element={<ManagerTasks />} />
            <Route path="users" element={<ManagerUsers />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        )}

        {/* Employee routes (you can keep as is) */}
        {role === "employee" && (
          <Route path="/employee" element={<DashboardLayout />}>
            <Route path="overview" element={<EmployeeOverview />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="projects" element={<EmployeeProjects />} />
            {/* <Route path="profile" element={<Profile />} /> */}
            {/* <Route path="settings" element={<Settings />} /> */}
          </Route>
        )}

        <Route path="*" element={<Navigate to={getDefaultRoute(role)} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;