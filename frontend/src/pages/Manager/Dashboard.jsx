// src/pages/Manager/Dashboard.jsx
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

const ManagerDashboard = () => {
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

  // 🔥 HOVER TOOLTIP STATE
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 🔥 ADVANCED PROGRESS CHART BUILDER (Same as Admin)
  const buildProgressChart = (projectProgress) => {
    if (!projectProgress) return null;

    const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

    if (
      Array.isArray(projectProgress.actualDots) ||
      Array.isArray(projectProgress.linePoints)
    ) {
      const totalDays = Math.max(1, Number(projectProgress.totalDays) || 1);
      const rawDeadlineDayOffset = Number(projectProgress.deadlineDayOffset) || 0;
      const deadlineDayOffset = Math.max(0, rawDeadlineDayOffset);
      const currentDayOffset = Math.max(
        0,
        Math.min(totalDays, Number(projectProgress.currentDayOffset) || 0)
      );
      const isCompleted = Boolean(projectProgress.isCompleted);
      const showDeadlineMarker = deadlineDayOffset <= totalDays;
      const showCurrentMarker = !isCompleted;
      const dots = (projectProgress.actualDots || [])
        .map((dot) => ({
          ...dot,
          dayOffset: Math.max(0, Math.min(totalDays, Number(dot.dayOffset) || 0)),
          percentage: clampPercent(dot.percentage),
          date: dot.date || "",
          completedTasks: Number(dot.completedTasks) || 0,
          tasksCompletedOnDate: Number(dot.tasksCompletedOnDate) || 0,
        }))
        .sort((a, b) => a.dayOffset - b.dayOffset);
      const linePoints = (projectProgress.linePoints?.length
        ? projectProgress.linePoints
        : [
            { dayOffset: 0, percentage: 0, type: "start" },
            ...dots.map((dot) => ({ ...dot, type: "completed" })),
            projectProgress.projectionPoint,
          ].filter(Boolean)
      )
        .map((point) => ({
          ...point,
          dayOffset: Math.max(0, Math.min(totalDays, Number(point.dayOffset) || 0)),
          percentage: clampPercent(point.percentage),
        }))
        .sort((a, b) => a.dayOffset - b.dayOffset);
      const weekMarkers = (projectProgress.weekMarkers?.length
        ? projectProgress.weekMarkers
        : (projectProgress.weeks || ["Week 1"]).map((week, index) => ({
            label: week,
            date: projectProgress.weeklyDates?.[index] || "",
            dayOffset: Math.min(index * 7, totalDays),
          }))
      ).map((marker) => ({
        ...marker,
        dayOffset: Math.max(0, Math.min(totalDays, Number(marker.dayOffset) || 0)),
      }));

      return {
        name: projectProgress.name,
        totalTasks: Number(projectProgress.totalTasks) || 0,
        completedTasks: Number(projectProgress.completedTasks) || 0,
        totalDays,
        deadlineDayOffset,
        currentDayOffset,
        showDeadlineMarker,
        showCurrentMarker,
        deadline: projectProgress.deadline,
        currentDate: projectProgress.currentDate,
        actualCompletionDate: projectProgress.actualCompletionDate,
        isCompleted,
        weekMarkers,
        dots,
        linePoints,
        projectionPoint: projectProgress.projectionPoint || null,
        isDelayed: Boolean(projectProgress.isDelayed),
      };
    }

    const normalProgress = Array.isArray(projectProgress.normalProgress)
      ? projectProgress.normalProgress
      : [];
    const delayedProgress = Array.isArray(projectProgress.delayedProgress)
      ? projectProgress.delayedProgress
      : [];

    const length = Math.max(
      projectProgress.weeks?.length || 0,
      normalProgress.length,
      delayedProgress.length,
      1
    );

    const weeks = Array.from({ length }, (_, index) => (
      projectProgress.weeks?.[index] || `Week ${index + 1}`
    ));

    const weeklyDates = Array.from({ length }, (_, index) => (
      projectProgress.weeklyDates?.[index] || ""
    ));

    const values = Array.from({ length }, (_, index) => {
      const normalValue = normalProgress[index];
      const delayedValue = delayedProgress[index];

      const value =
        normalValue !== null && normalValue !== undefined
          ? normalValue
          : delayedValue !== null && delayedValue !== undefined
          ? delayedValue
          : 0;

      if (value === null || value === undefined) {
        return null;
      }

      return Math.max(
        0,
        Math.min(100, Number(value) || 0)
      );
    });

    const delayedStartIndex = delayedProgress.findIndex(
      (value) => value !== null && value !== undefined
    );

    const deadlineWeekIndex = Number.isInteger(projectProgress.deadlineWeekIndex)
      ? Math.max(0, Math.min(projectProgress.deadlineWeekIndex, length - 1))
      : delayedStartIndex > 0
        ? delayedStartIndex
        : null;

    const hasDelayedPoints = delayedProgress.some((value) => value !== null && value !== undefined);
    const isDelayed = Boolean(projectProgress.isDelayed || hasDelayedPoints);

    return {
      weeks,
      weeklyDates,
      values,
      isDelayed,
      deadlineWeekIndex
    };
  };

  // 🔥 CHART HELPERS
  const chartX = (dayOffset, totalDays) => (
    80 + (Math.max(0, Math.min(totalDays, dayOffset)) * (630 / Math.max(1, totalDays)))
  );

  const chartY = (percentage) => 250 - (Math.max(0, Math.min(100, percentage)) * 2);

  const renderProgressSegment = (point, nextPoint, index, chart) => {
    const x1 = chartX(point.dayOffset, chart.totalDays);
    const y1 = chartY(point.percentage);
    const x2 = chartX(nextPoint.dayOffset, chart.totalDays);
    const y2 = chartY(nextPoint.percentage);
    const shouldSplitAtDeadline =
      chart.isDelayed &&
      point.dayOffset < chart.deadlineDayOffset &&
      nextPoint.dayOffset > chart.deadlineDayOffset;

    if (shouldSplitAtDeadline) {
      const ratio =
        (chart.deadlineDayOffset - point.dayOffset) /
        Math.max(1, nextPoint.dayOffset - point.dayOffset);
      const deadlineX = chartX(chart.deadlineDayOffset, chart.totalDays);
      const deadlineY = y1 + ((y2 - y1) * ratio);

      return (
        <g key={index}>
          <line
            x1={x1}
            y1={y1}
            x2={deadlineX}
            y2={deadlineY}
            stroke="#10b981"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <line
            x1={deadlineX}
            y1={deadlineY}
            x2={x2}
            y2={y2}
            stroke="#ef4444"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={nextPoint.type === "projection" ? "8 7" : undefined}
          />
        </g>
      );
    }

    const isRed = chart.isDelayed && point.dayOffset >= chart.deadlineDayOffset;

    return (
      <line
        key={index}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isRed ? "#ef4444" : "#10b981"}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={nextPoint.type === "projection" ? "8 7" : undefined}
      />
    );
  };

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
          const allProjects = result.projects || [];

          const sortedProjects = [...allProjects].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );

          setProjects(sortedProjects);

          if (sortedProjects.length > 0) {
            setSelectedProjectId(sortedProjects[0].id);
          }
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
      if (!selectedProjectId) {
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

  // Navigation Handlers for Stat Cards
  const goToProjects = (filter) => {
    navigate("/manager/projects", { 
      state: { activeFilter: filter } 
    });
  };

  const progressChart = buildProgressChart(selectedProjectProgress);

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
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Dashboard</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Real time Project Overview
          </p>
        </div>
      </div>

      {/* Clickable Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {/* Total Projects */}
        <div
          onClick={() => goToProjects("All Projects")}
          className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 tracking-wider group-hover:text-blue-600 transition-colors">
                TOTAL PROJECTS
              </p>
              <p className="text-4xl font-semibold text-gray-900 mt-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                {stats.totalProjects}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Briefcase size={28} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1 font-medium">
            <TrendingUp size={16} /> Projects managed by you
          </p>
        </div>

        {/* Active Projects */}
        <div
          onClick={() => goToProjects("In Progress")}
          className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 tracking-wider group-hover:text-blue-600 transition-colors">
                ACTIVE PROJECTS
              </p>
              <p className="text-4xl font-semibold text-gray-900 mt-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                {stats.activeProjects}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Clock size={28} className="text-white" />
            </div>
          </div>
          <p className="flex items-center gap-2 text-sm text-emerald-600 mt-6 font-medium"><TrendingUp size={16}/>Currently in progress</p>
        </div>

        {/* Projects Completed */}
        <div
          onClick={() => goToProjects("Completed")}
          className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 tracking-wider group-hover:text-blue-600 transition-colors">
                PROJECTS COMPLETED
              </p>
              <p className="text-4xl font-semibold text-gray-900 mt-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                {stats.completedProjects}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <CheckCircle size={28} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-emerald-600 mt-6 flex items-center gap-1 font-medium">
            <TrendingUp size={16} /> Successfully delivered projects
          </p>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Project Completion Circle */}
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

        {/* PROJECT PROGRESS */}
        <div className="lg:col-span-3 bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PROJECT PROGRESS</h3>
              <p className="text-xs text-gray-500">Task completions from start date to current status</p>
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

          <div className="h-72 bg-white rounded-2xl p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} style={{ outline: "none", border: "none" }}>

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
                        const validPayloads = payload.filter(
                          item => item?.payload
                        );

                        if (!validPayloads.length) {
                          return null;
                        }

                        const data =
                          validPayloads[
                            validPayloads.length - 1
                          ].payload;
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

          {selectedProjectProgress && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm">
                <div 
                  className="w-5 h-0.5 rounded" 
                  style={{ backgroundColor: selectedProjectProgress.color || '#10b981' }}
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