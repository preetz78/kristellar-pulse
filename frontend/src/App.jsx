// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";

// Import all pages
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminProjects from "./pages/Admin/Projects";
import TaskInsights from "./pages/Admin/TaskInsights";
import AdminTeam from "./pages/Admin/Team";

import ManagerDashboard from "./pages/Manager/Dashboard";
import ManagerProjects from "./pages/Manager/Projects";
import ProjectDetail from "./pages/Manager/ProjectDetail";
import ManagerTaskInsights from "./pages/Manager/TaskInsights";
import ManagerTeamManagement from "./pages/Manager/TeamManagement";

import ReviewerDashboard from "./pages/Reviewer/Dashboard";
import ReviewerProjects from "./pages/Reviewer/Projects";
import ReviewerTaskInsights from "./pages/Reviewer/TaskInsights";

import EmployeeDashboard from "./pages/Employee/Dashboard";
import EmployeeProjects from "./pages/Employee/Projects";
import EmployeeTaskInsights from "./pages/Employee/TaskInsights";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reusable function to check authentication
  const checkAuth = useCallback(() => {
    const token = sessionStorage.getItem("token");
    const userStr = sessionStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        let role = (user.role || sessionStorage.getItem("role") || "").toLowerCase();

        // Fallback for employee role
        if (!role && user.employee_id) role = "employee";

        setIsAuthenticated(true);
        setUserRole(role);
        return true;
      } catch (e) {
        console.error("Failed to parse user data:", e);
        sessionStorage.clear();
      }
    }

    setIsAuthenticated(false);
    setUserRole(null);
    return false;
  }, []);

  // Initial auth check on app load
  useEffect(() => {
    checkAuth();
    setLoading(false);
  }, [checkAuth]);

  // Listen for auth changes from Login page
  useEffect(() => {
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [checkAuth]);

  // Logout function
  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
    window.dispatchEvent(new Event("auth-change")); // Notify listeners
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!isAuthenticated || !userRole) return "/login";

    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "manager") return "/manager/dashboard";
    if (userRole === "reviewer") return "/reviewer/dashboard";
    return "/employee/dashboard"; // default for employee or unknown role
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Login />
            )
          }
        />

        {/* Root Route */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* ==================== ADMIN ROUTES ==================== */}
        <Route
          path="/admin/*"
          element={
            isAuthenticated && userRole === "admin" ? (
              <DashboardLayout logout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          <Route path="task-insights" element={<TaskInsights />} />
          <Route path="team" element={<AdminTeam />} />
        </Route>

        {/* ==================== MANAGER ROUTES ==================== */}
        <Route
          path="/manager/*"
          element={
            isAuthenticated && userRole === "manager" ? (
              <DashboardLayout logout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="projects" element={<ManagerProjects />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          <Route path="task-insights" element={<ManagerTaskInsights />} />
          <Route path="team" element={<ManagerTeamManagement />} />
        </Route>

        {/* ==================== REVIEWER ROUTES ==================== */}
        <Route
          path="/reviewer/*"
          element={
            isAuthenticated && userRole === "reviewer" ? (
              <DashboardLayout logout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<ReviewerDashboard />} />
          <Route path="projects" element={<ReviewerProjects />} />
          <Route path="task-insights" element={<ReviewerTaskInsights />} />
        </Route>

        {/* ==================== EMPLOYEE ROUTES ==================== */}
        <Route
          path="/employee/*"
          element={
            isAuthenticated && userRole === "employee" ? (
              <DashboardLayout logout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="projects" element={<EmployeeProjects />} />
          <Route path="task-insights" element={<EmployeeTaskInsights />} />
        </Route>

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;