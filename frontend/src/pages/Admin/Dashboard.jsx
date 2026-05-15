// src/pages/Admin/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronDown
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
      dotProgress: item.isCompletion ? item.percentage : null,
      completedTasks: item.completedTasks,
      totalTasks: item.totalTasks,
      tasksCompletedOnDate: item.tasksCompletedOnDate,
      date: item.date,
      dayOffset: Number(item.dayOffset) || 0,
      markerType: item.markerType,
      isDeadline: item.isDeadline,
      isCompletion: item.isCompletion,
      isDeadlineCrossed: item.isDeadlineCrossed
    }));
  };

  const chartData = buildChartData(selectedProjectProgress);

  const maxDayOffset = chartData.length > 0
    ? Math.max(...chartData.map((item) => item.dayOffset || 0))
    : 0;

  const xAxisTicks = [
    ...new Set(
      chartData
        .filter((item, index) =>
          item.markerType === "start" ||
          item.markerType === "deadline" ||
          item.markerType === "today" ||
          index === chartData.length - 1
        )
        .map((item) => item.dayOffset || 0)
    )
  ];

  const formatXAxisTick = (value) => {
    const exactMatch = chartData.find(
      (item, index) =>
        (item.dayOffset || 0) === value &&
        (
          item.markerType === "start" ||
          item.markerType === "deadline" ||
          item.markerType === "today" ||
          index === chartData.length - 1
        )
    );

    return exactMatch?.label || "";
  };

  const renderProgressDot = ({ cx, cy, payload }) => {
    if (!payload || cx === undefined || cy === undefined) {
      return null;
    }

    if (!payload.isCompletion) {
      return null;
    }

    const isDelayedPoint = payload.isDeadlineCrossed;
    const fill = isDelayedPoint ? "#ef4444" : "#22c55e";
    const radius = 5;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  };

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

  
  // LOADING

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

  // ERROR


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

  // MAIN UI
 

  return (
    <div className="p-6 bg-white min-h-screen">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-blue-700">
          Dashboard
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          <p className="text-gray-600">
            Real time Project Overview
          </p>
        </div>
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
              <p className="text-xs text-gray-500 font-medium">
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

          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1 font-medium">
            <TrendingUp size={16} />
            Projects across all departments
          </p>
        </div>

        {/* ACTIVE */}

        <div
          onClick={() => goToProjects("In Progress")}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium">
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

          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1 font-medium">
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
              <p className="text-xs text-gray-500 font-medium">
                PROJECTS COMPLETED
              </p>

              <p className="text-4xl font-semibold mt-3 ">
                {stats.completedProjects}
              </p>
            </div>

            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <CheckCircle size={28} className="text-white" />
            </div>
          </div>

          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1 font-medium">
            <TrendingUp size={16} />
            Successfully completed projects
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
                Task completions from start date to current status
              </p>
            </div>

            <div className="relative inline-flex">
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none bg-white border border-blue-200 text-sm px-5 py-2.5 rounded-2xl pr-10 focus:outline-none focus:ring-0 focus:border-blue-300"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {/* GRAPH */}

          <div className="h-72 bg-white rounded-2xl p-4 border-0 outline-none focus:outline-none ring-0 focus:ring-0 shadow-none">

            {chartData.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData} style={{outline: "none" , border: "none"}}>

                  <CartesianGrid
                    stroke="#f1f5f9"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="dayOffset"
                    type="number"
                    domain={[0, Math.max(1, maxDayOffset)]}
                    ticks={xAxisTicks}
                    tickFormatter={formatXAxisTick}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
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

                        const validPayloads = payload
                          .filter(item => item?.payload);

                        if (!validPayloads.length) {
                          return null;
                        }

                        const data =
                          validPayloads.reduce((highest, current) => {

                            const currentProgress =
                              current.payload?.progress || 0;

                            const highestProgress =
                              highest.payload?.progress || 0;

                            return currentProgress > highestProgress
                              ? current
                              : highest;

                          }).payload;

                        if (!data) return null;

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

                            {data.tasksCompletedOnDate > 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                Completed on this date: {data.tasksCompletedOnDate}
                              </p>
                            )}

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
                    dot={false}
                    activeDot={false}
                  />

                  <Line
                    type="linear"
                    dataKey="redProgress"
                    stroke="#ef4444"
                    strokeWidth={4}
                    dot={false}
                    activeDot={false}
                  />

                  <Line
                    type="linear"
                    dataKey="dotProgress"
                    stroke="transparent"
                    strokeWidth={0}
                    dot={renderProgressDot}
                    activeDot={renderProgressDot}
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

              <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-2xl shadow-sm">

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
