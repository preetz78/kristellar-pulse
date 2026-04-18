// src/pages/Admin/Dashboard.jsx
import { useState, useEffect } from "react";
import { Briefcase, Clock, CheckCircle, TrendingUp } from "lucide-react";
import apiConfig from "../../config/apiConfig";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overallCompletion: 0,
  });

  const [projects, setProjects] = useState([]);                    
  const [selectedProjectId, setSelectedProjectId] = useState(null);   // Will be set to newest project
  const [selectedProjectProgress, setSelectedProjectProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard stats + projects list
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/dashboard`, {
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
          const allProjects = result.projects || [];

          // Sort projects by created_at DESC (newest first)
          const sortedProjects = [...allProjects].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );

          setProjects(sortedProjects);

          // Auto-select the newest project
          if (sortedProjects.length > 0) {
            setSelectedProjectId(sortedProjects[0].id);
          }
        } else {
          setError(result.message || "Failed to load dashboard statistics");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to connect to server. Please check if backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Fetch REAL project progress when a project is selected
  useEffect(() => {
    const fetchProjectProgress = async () => {
      if (!selectedProjectId) {
        setSelectedProjectProgress(null);
        return;
      }

      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(
          `${apiConfig.API_BASE_URL}/api/admin/project-progress?projectId=${selectedProjectId}`,
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
          <p className="text-gray-600">Loading dashboard...</p>
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
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Dashboard</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Real-time Project Overview
          </p>
        </div>
      </div>

      {/* Top Stats Cards - 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[
          {
            label: "TOTAL PROJECTS",
            value: stats.totalProjects,
            trend: "12% from last month",
            icon: Briefcase,
          },
          {
            label: "ACTIVE PROJECTS",
            value: stats.activeProjects,
            trend: "Currently in progress",
            icon: Clock,
          },
          {
            label: "PROJECTS COMPLETED",
            value: stats.completedProjects,
            trend: "68% completion rate",
            icon: CheckCircle,
          },
        ].map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl group cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 tracking-wider group-hover:text-blue-600 transition-colors">
                  {card.label}
                </p>
                <p className="text-4xl font-semibold text-gray-900 mt-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                  {card.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                <card.icon size={28} className="text-white" />
              </div>
            </div>
            <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1 font-medium">
              <TrendingUp size={16} />
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Main Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Project Completion (Circular) - UNCHANGED */}
        <div className="lg:col-span-2 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-2xl transition-all group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text">
              PROJECT COMPLETION
            </h3>
            <span className="px-4 py-1 bg-gradient-to-r from-blue-400 to-blue-300 text-blue-700 text-xs font-semibold rounded-full">
              Overall
            </span>
          </div>

          <div className="flex justify-center my-8 group-hover:scale-105 transition-transform">
            <div className="relative w-52 h-52">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="11" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#completionGradient)"
                  strokeWidth="11"
                  strokeDasharray="326.73"
                  strokeDashoffset={326.73 - (326.73 * stats.overallCompletion) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-gray-900">{stats.overallCompletion}%</span>
                <span className="text-sm text-gray-500 font-medium mt-1">COMPLETED</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">COMPLETED</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{stats.completedProjects}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">IN PROGRESS</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        {/* PROJECT PROGRESS - Dropdown with newest project selected by default */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-2xl transition-all group">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PROJECT PROGRESS</h3>
              <p className="text-xs text-gray-500">Weekly task completion progress</p>
            </div>

            {/* Dropdown - Newest project selected by default */}
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white border border-blue-200 text-sm px-5 py-2.5 rounded-2xl focus:outline-none focus:border-blue-500 font-medium"
            >
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

                {/* Dynamic X-axis */}
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

                {/* Y-axis labels */}
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

          {/* Legend */}
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

export default Dashboard;