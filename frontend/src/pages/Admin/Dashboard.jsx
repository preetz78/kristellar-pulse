// src/pages/Admin/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp
} from "lucide-react";

import dayjs from "dayjs";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import apiConfig from "../../config/apiConfig";

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overallCompletion: 0,
  });

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectProgress, setSelectedProjectProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const buildChartData = (project) => {
    if (!project) return [];

    return (project.progressHistory || []).map((item) => ({
      label: item.xLabel,
      progress: item.percentage,
      greenProgress: item.greenProgress,
      redProgress: item.redProgress,
      completedTasks: item.completedTasks,
      totalTasks: item.totalTasks,
      date: item.date,
      isDeadlineCrossed: item.isDeadlineCrossed
    }));
  };

  const chartData = buildChartData(selectedProjectProgress);

  // FETCH DASHBOARD STATS

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem("token");

        const response = await fetch(
          `${apiConfig.API_BASE_URL}/api/admin/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard");
        }

        const result = await response.json();

        if (result.success) {
          setStats(result.stats);

          const sortedProjects = [...(result.projects || [])].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );

          setProjects(sortedProjects);

          if (sortedProjects.length > 0) {
            setSelectedProjectId(sortedProjects[0].id);
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // =========================
  // FETCH PROJECT PROGRESS
  // =========================

  useEffect(() => {
    const fetchProjectProgress = async () => {
      if (!selectedProjectId) return;

      try {
        const token = sessionStorage.getItem("token");

        const response = await fetch(
          `${apiConfig.API_BASE_URL}/api/admin/project-progress?projectId=${selectedProjectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const result = await response.json();

        if (result.success) {
          setSelectedProjectProgress(
            result.data?.[0] || null
          );
        } else {
          setSelectedProjectProgress(null);
        }
      } catch (err) {
        console.error(err);
        setSelectedProjectProgress(null);
      }
    };

    fetchProjectProgress();
  }, [selectedProjectId]);

  // =========================
  // NAVIGATION
  // =========================

  const goToProjects = (filter) => {
    navigate("/admin/projects", {
      state: { activeFilter: filter }
    });
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="p-6 bg-white min-h-screen">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-blue-700">
          Dashboard
        </h1>

        <p className="text-gray-600 mt-1">
          Real-time Project Overview
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

        {/* TOTAL */}

        <div
          onClick={() => goToProjects("All Projects")}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                TOTAL PROJECTS
              </p>

              <p className="text-4xl font-semibold mt-3">
                {stats.totalProjects}
              </p>
            </div>

            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Briefcase size={28} className="text-white" />
            </div>
          </div>

          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1">
            <TrendingUp size={16} />
            12% from last month
          </p>
        </div>

        {/* ACTIVE */}

        <div
          onClick={() => goToProjects("In Progress")}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                ACTIVE PROJECTS
              </p>

              <p className="text-4xl font-semibold mt-3">
                {stats.activeProjects}
              </p>
            </div>

            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Clock size={28} className="text-white" />
            </div>
          </div>

          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1">
            <TrendingUp size={16} />
            Currently in progress
          </p>
        </div>

        {/* COMPLETED */}

        <div
          onClick={() => goToProjects("Completed")}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                PROJECTS COMPLETED
              </p>

              <p className="text-4xl font-semibold mt-3">
                {stats.completedProjects}
              </p>
            </div>

            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <CheckCircle size={28} className="text-white" />
            </div>
          </div>

          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1">
            <TrendingUp size={16} />
            68% completion rate
          </p>
        </div>
      </div>

      {/* MAIN SECTION */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT CARD */}

        <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-2xl p-8">

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              PROJECT COMPLETION
            </h3>

            <span className="px-4 py-1 bg-blue-200 text-blue-700 text-xs font-semibold rounded-full">
              Overall
            </span>
          </div>

          <div className="flex justify-center my-8">

            <div className="relative w-52 h-52">

              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">

                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="11"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="11"
                  strokeDasharray="326.73"
                  strokeDashoffset={
                    326.73 -
                    (326.73 * stats.overallCompletion) / 100
                  }
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold">
                  {stats.overallCompletion}%
                </span>

                <span className="text-sm text-gray-500 mt-1">
                  COMPLETED
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">
                COMPLETED
              </p>

              <p className="text-3xl font-bold text-blue-700 mt-1">
                {stats.completedProjects}
              </p>
            </div>

            <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold">
                IN PROGRESS
              </p>

              <p className="text-3xl font-bold text-blue-700 mt-1">
                {stats.activeProjects}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT GRAPH */}

        <div className="lg:col-span-3 bg-blue-50 border border-blue-200 rounded-2xl p-8">

          <div className="flex justify-between items-center mb-6">

            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                PROJECT PROGRESS
              </h3>

              <p className="text-xs text-gray-500">
                Weekly task completion progress
              </p>
            </div>

            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white border border-blue-200 text-sm px-5 py-2.5 rounded-2xl"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* GRAPH */}

          <div className="h-72 bg-white rounded-2xl p-4">

            {chartData.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData}>

                  <CartesianGrid
                    stroke="#f1f5f9"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={({ active, payload }) => {

                      if (active && payload && payload.length) {

                        const data = payload[0].payload;

                        return (
                          <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4">

                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              {dayjs(data.date).format("MMM D, YYYY")}
                            </p>

                            <p className="text-sm text-blue-600">
                              Progress: {data.progress}%
                            </p>

                            <p className="text-sm text-green-600 mt-1">
                              Tasks: {data.completedTasks} / {data.totalTasks}
                            </p>

                          </div>
                        );
                      }

                      return null;
                    }}
                  />

                  <Line
                    type="linear"
                    dataKey="greenProgress"
                    stroke="#22c55e"
                    strokeWidth={4}
                    dot={{ r: 5 }}
                    connectNulls
                  />

                  <Line
                    type="linear"
                    dataKey="redProgress"
                    stroke="#ef4444"
                    strokeWidth={4}
                    dot={{ r: 5 }}
                    connectNulls
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <div className="h-full flex items-center justify-center text-gray-400">
                No progress data available
              </div>
            )}

          </div>

          {/* FOOTER */}

          {selectedProjectProgress && (
            <div className="mt-6 flex justify-center">

              <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-2xl border shadow-sm">

                <div
                  className={`w-5 h-1 rounded ${
                    selectedProjectProgress?.isDelayed
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
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