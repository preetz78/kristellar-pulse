// src/pages/Manager/Dashboard.jsx
import { useState, useEffect } from "react";
import { TrendingUp, Briefcase, CheckCircle, Clock } from "lucide-react";
import apiConfig from "../../config/apiConfig";

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overallCompletion: 0,
  });

  const [projects, setProjects] = useState([]);                    
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedProjectProgress, setSelectedProjectProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Manager-specific Dashboard Data
  useEffect(() => {
    const fetchManagerDashboard = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/dashboard`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setStats(result.stats);
          setProjects(result.projects || []);
        } else {
          setError(result.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error("Manager dashboard fetch error:", err);
        setError("Failed to connect to server. Please check if backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchManagerDashboard();
  }, []);

  // Fetch REAL project progress when a project is selected
  useEffect(() => {
    const fetchProjectProgress = async () => {
      if (selectedProjectId === "all") {
        setSelectedProjectProgress(null);
        return;
      }

      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(
          `${apiConfig.API_BASE_URL}/api/manager/project-progress?projectId=${selectedProjectId}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) throw new Error("Failed to fetch progress");

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          setSelectedProjectProgress(result.data[0]);
        } else {
          setSelectedProjectProgress(null);
        }
      } catch (err) {
        console.error("Project progress fetch error:", err);
        setSelectedProjectProgress(null);
      }
    };

    fetchProjectProgress();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-medium mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-blue-700">Dashboard</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm md:text-base">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            My Projects Overview
          </p>
        </div>

        <button className="px-4 md:px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl">
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">TOTAL PROJECTS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.totalProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Briefcase size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6 flex items-center gap-1">
            <TrendingUp size={15} /> My Projects
          </p>
        </div>

        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">ACTIVE PROJECTS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.activeProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Clock size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6">Currently in progress</p>
        </div>

        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">PROJECTS COMPLETED</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.completedProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <CheckCircle size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6 flex items-center gap-1">
            <TrendingUp size={15} /> {stats.overallCompletion}% completion rate
          </p>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Project Completion Circle */}
        <div className="lg:col-span-2 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-8 hover:border-blue-400 hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Project Completion</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-2xl">Overall</span>
          </div>

          <div className="flex justify-center my-6 md:my-8">
            <div className="relative w-40 h-40 md:w-48 md:h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="11" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="11"
                  strokeDasharray="326.73"
                  strokeDashoffset={326.73 - (326.73 * stats.overallCompletion) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl font-bold text-gray-900">{stats.overallCompletion}%</span>
                <span className="text-xs md:text-sm text-gray-500 mt-1">COMPLETED</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white border border-blue-200 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">COMPLETED</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 mt-1">{stats.completedProjects}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">IN PROGRESS</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 mt-1">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        {/* PROJECT PROGRESS - Same as Admin */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-8 hover:border-blue-400 hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">PROJECT PROGRESS</h3>
              <p className="text-xs text-gray-500">Weekly task completion progress</p>
            </div>

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white border border-blue-200 text-sm px-5 py-2.5 rounded-2xl focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="all">All My Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative h-64 bg-white rounded-2xl p-6 border border-gray-100">
            {selectedProjectProgress ? (
              <svg viewBox="0 0 750 280" className="w-full h-full">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((val, i) => (
                  <line 
                    key={i}
                    x1="50" 
                    y1={250 - val * 2} 
                    x2="710" 
                    y2={250 - val * 2} 
                    stroke="#f1f5f9" 
                    strokeWidth="1.5" 
                  />
                ))}

                {/* X-axis */}
                {selectedProjectProgress.weeks?.map((week, i) => (
                  <text 
                    key={i} 
                    x={80 + i * (630 / Math.max(1, selectedProjectProgress.weeks.length - 1))} 
                    y="272" 
                    className="text-xs fill-gray-500" 
                    textAnchor="middle"
                  >
                    {week}
                  </text>
                ))}

                {/* Y-axis */}
                {[0, 25, 50, 75, 100].map((val, i) => (
                  <text 
                    key={i} 
                    x="38" 
                    y={255 - val * 2} 
                    className="text-xs fill-gray-500" 
                    textAnchor="end"
                  >
                    {val}%
                  </text>
                ))}

                {/* Single Progress Line */}
                <g>
                  <polyline
                    points={selectedProjectProgress.progress.map((val, i) => {
                      const xPos = 80 + i * (630 / Math.max(1, selectedProjectProgress.weeks.length - 1));
                      return `${xPos},${250 - (val * 2)}`;
                    }).join(" ")}
                    fill="none"
                    stroke={selectedProjectProgress.color}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {selectedProjectProgress.progress.map((val, i) => {
                    const xPos = 80 + i * (630 / Math.max(1, selectedProjectProgress.weeks.length - 1));
                    return (
                      <circle
                        key={i}
                        cx={xPos}
                        cy={250 - (val * 2)}
                        r="4.5"
                        fill={selectedProjectProgress.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    );
                  })}
                </g>
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a project to view its weekly progress
              </div>
            )}
          </div>

          {selectedProjectProgress && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm">
                <div 
                  className="w-5 h-0.5 rounded" 
                  style={{ backgroundColor: selectedProjectProgress.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedProjectProgress.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;