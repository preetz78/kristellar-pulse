// src/pages/Employee/Dashboard.jsx
import { useState, useEffect } from "react";
import { TrendingUp, Briefcase, CheckCircle, Clock } from "lucide-react";
import apiConfig from "../../config/apiConfig";

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    overallCompletion: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project Progress Section - Same as Manager / Admin
  const [myProjects, setMyProjects] = useState([]);                    // Real projects assigned to this employee
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedProjectProgress, setSelectedProjectProgress] = useState(null);

  // Fetch real dashboard stats for the logged-in employee
  useEffect(() => {
    const fetchEmployeeDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/employee/dashboard`, {
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
        } else {
          setError(result.message || "Failed to load dashboard statistics");
        }
      } catch (err) {
        console.error("Employee dashboard error:", err);
        setError("Failed to connect to server. Please check if backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDashboard();
  }, []);

  // Fetch employee's assigned projects for dropdown
  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/employee/projects`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();

        if (result.success) {
          setMyProjects(result.data || []);
          if (result.data && result.data.length > 0) {
            setSelectedProjectId(result.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch my projects for dropdown:", err);
      }
    };

    fetchMyProjects();
  }, []);

  // Fetch weekly progress for selected project (based on employee's task completions only)
  useEffect(() => {
    if (selectedProjectId === "all" || !selectedProjectId) {
      setSelectedProjectProgress(null);
      return;
    }

    const fetchProjectProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${apiConfig.API_BASE_URL}/api/employee/project-progress?projectId=${selectedProjectId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          setSelectedProjectProgress(result.data[0]);
        } else {
          setSelectedProjectProgress(null);
        }
      } catch (err) {
        console.error("Failed to fetch project progress:", err);
        setSelectedProjectProgress(null);
      }
    };

    fetchProjectProgress();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="p-5 md:p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 md:p-6 bg-white min-h-screen flex items-center justify-center text-red-600">
        <p>{error}</p>
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
            Real-time Project Overview
          </p>
        </div>

        <button className="px-4 md:px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl">
          Export Report
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        {/* Total Projects */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">MY PROJECTS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.totalProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Briefcase size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6 flex items-center gap-1">
            <TrendingUp size={15} /> Assigned to me
          </p>
        </div>

        {/* Active Tasks */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">ACTIVE TASKS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.activeTasks}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Clock size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6">Currently in progress</p>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">COMPLETED</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.completedTasks}</p>
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
            <h3 className="text-base md:text-lg font-semibold text-gray-800">My Task Completion</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-2xl">This Month</span>
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
              <p className="text-xl md:text-2xl font-bold text-blue-700 mt-1">{stats.completedTasks}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">IN PROGRESS</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 mt-1">{stats.activeTasks}</p>
            </div>
          </div>
        </div>

        {/* My Progress Trend Graph - Same design as Manager/Admin but based on employee's task completion */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-8 hover:border-blue-400 hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">My Progress Trend</h3>
              <p className="text-xs text-gray-500">Weekly progress based on my task completions</p>
            </div>

            {/* Project Dropdown */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white border border-gray-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">Select a Project</option>
              {myProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title || project.name || `Project ${project.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="h-52 md:h-64 relative bg-white rounded-2xl p-4 md:p-6 border border-gray-100">
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

                {/* X-axis labels */}
                {selectedProjectProgress.weeks && selectedProjectProgress.weeks.map((week, i) => (
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

                {/* Progress Line - Based on employee's task completions only */}
                <g>
                  <polyline
                    points={selectedProjectProgress.progress.map((val, i) => 
                      `${80 + i * (630 / Math.max(1, selectedProjectProgress.weeks.length - 1))},${250 - (val * 2)}`
                    ).join(" ")}
                    fill="none"
                    stroke={selectedProjectProgress.color || "#3b82f6"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {selectedProjectProgress.progress.map((val, i) => (
                    <circle
                      key={i}
                      cx={80 + i * (630 / Math.max(1, selectedProjectProgress.weeks.length - 1))}
                      cy={250 - (val * 2)}
                      r="4"
                      fill={selectedProjectProgress.color || "#3b82f6"}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a project to view your weekly task completion progress
              </div>
            )}
          </div>

          {/* Legend */}
          {selectedProjectProgress && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 justify-center">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-0.5 rounded" 
                  style={{ backgroundColor: selectedProjectProgress.color || "#3b82f6" }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">
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

export default EmployeeDashboard;