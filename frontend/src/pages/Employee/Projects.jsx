// src/pages/Employee/Projects.jsx
import { useState, useEffect } from "react";
import { 
  Calendar, 
  Users, 
  TrendingUp 
} from "lucide-react";

import apiConfig from "../../config/apiConfig";   // ← Correct import (default export)

const EmployeeProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All Projects");

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login again to view your projects.");
          return;
        }

        const apiUrl = `${apiConfig.API_BASE_URL}/api/employee/projects`;
        console.log("🔄 Fetching projects from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("📡 Response status:", response.status);

        const text = await response.text();
        console.log("📄 Raw response (first 300 chars):", text.substring(0, 300));

        let result;
        try {
          result = JSON.parse(text);
        } catch (parseErr) {
          throw new Error("Server returned non-JSON response (HTML). Check apiConfig.API_BASE_URL");
        }

        if (!response.ok) {
          throw new Error(result?.message || `Failed to load projects (Status: ${response.status})`);
        }

        if (result.success) {
          setProjects(result.data || []);
        } else {
          setError(result.message || "Failed to load projects");
        }
      } catch (err) {
        console.error("❌ Projects fetch error:", err);
        setError(err.message || "Failed to connect to server. Please check if backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, []);

  const getPriorityStyle = (priority) => {
    if (priority === "High") return "bg-red-100 text-red-700 border border-red-300";
    if (priority === "Medium") return "bg-amber-100 text-amber-700 border border-amber-300";
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  };

  const getProgressGradient = (progress) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-600 to-cyan-500";
    return "from-amber-500 to-orange-600";
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "All Projects") return true;
    if (activeFilter === "In Progress") return project.status === "In Progress";
    if (activeFilter === "Completed") return project.status === "Completed";
    if (activeFilter === "High Priority") return project.priority === "High";
    return true;
  });

  if (loading) return <div className="p-6 text-center">Loading your projects...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">My Projects</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Projects assigned to me
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">My Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter((p) => p.status === "In Progress").length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter((p) => p.status === "Completed").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 bg-blue-50 rounded-2xl p-2 w-fit">
          <button
            onClick={() => setActiveFilter("All Projects")}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "All Projects" ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Projects
          </button>

          <button
            onClick={() => setActiveFilter("In Progress")}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "In Progress" ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            In Progress
          </button>

          <button
            onClick={() => setActiveFilter("Completed")}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "Completed" ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => setActiveFilter("High Priority")}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "High Priority" ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            High Priority
          </button>
        </div>
      </div>

      {/* PROJECT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, idx) => (
          <div
            key={project.id}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`relative group bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-2xl ${
              hoveredCard === idx ? "shadow-2xl -translate-y-1 border-blue-400" : ""
            }`}
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-500"></div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {project.idCode}</p>
                </div>

                <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ml-4 ${getPriorityStyle(project.priority)}`}>
                  {project.priority}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <p className="text-xs text-gray-500 font-medium">Project Manager</p>
                  <p className="font-semibold text-gray-900 mt-1 text-sm">{project.manager}</p>
                </div>

                <div className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users size={15} className="text-blue-600" />
                    <p className="text-xs text-gray-500 font-medium">Team Size</p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{project.teamSize}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 pb-6 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="font-semibold text-gray-900 text-sm">{project.deadline}</p>
                  </div>
                </div>

                <span className={`px-4 py-1.5 text-xs font-semibold rounded-xl border ${
                  project.status === "In Progress" 
                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
                </div>

                <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressGradient(project.progress)} rounded-full transition-all duration-500`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No projects found matching your filter.
        </div>
      )}
    </div>
  );
};

export default EmployeeProjects;