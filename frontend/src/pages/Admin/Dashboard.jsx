// src/pages/Admin/Dashboard.jsx
import { useState } from "react";
import { Briefcase, Clock, CheckCircle, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [stats] = useState({
    totalProjects: 24,
    activeProjects: 15,
    completedProjects: 9,
  });

  const [completionRate] = useState(68);

  // Weekly PROJECT PROGRESS Data (for chart)
  const weeklyProgressData = [
    { week: "W1", progress: 45 },
    { week: "W2", progress: 52 },
    { week: "W3", progress: 61 },
    { week: "W4", progress: 68 },
    { week: "W5", progress: 75 },
    { week: "W6", progress: 82 },
  ];

  const projectProgressData = [
  { quarter: "Mon", progress: 84 },
  { quarter: "Tue", progress: 83 },
  { quarter: "Wed", progress: 78 },
  { quarter: "Thu", progress: 63 },
  { quarter: "Fri", progress: 67 },
];

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

        <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl">
          Export Report
        </button>
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
        {/* Project Completion (Circular) */}
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
                  strokeDashoffset={326.73 - (326.73 * completionRate) / 100}
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
                <span className="text-5xl font-bold text-gray-900">{completionRate}%</span>
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
        {/* PROJECT PROGRESS - FINAL CLEAN WAVE */}
          <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-2xl transition-all group">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  PROJECT PROGRESS
                </h3>
                <p className="text-xs text-gray-500">
                  Share of progress across timeline
                </p>
              </div>

              <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full animate-pulse">
                Live
              </div>
            </div>

            {/* GRAPH */}
            <div className="relative h-64 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6">

              <svg viewBox="0 0 700 300" className="w-full h-full">

                <defs>
                  {/* Area Gradient */}
                  <linearGradient id="smoothArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* SMOOTH AREA */}
                <path
                  d="M 40 80 
                    C 150 90, 220 100, 300 140
                    C 380 190, 460 200, 540 170
                    C 600 150, 650 120, 680 110
                    L 680 300 L 40 300 Z"
                  fill="url(#smoothArea)"
                />

                {/* SMOOTH LINE */}
                <path
                  d="M 40 80 
                    C 150 90, 220 100, 300 140
                    C 380 190, 460 200, 540 170
                    C 600 150, 650 120, 680 110"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* DOTS */}
                {[40, 180, 300, 450, 680].map((x, i) => {
                  const yPoints = [80, 95, 140, 200, 110];
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={yPoints[i]}
                      r="4"
                      className="fill-blue-600 hover:r-6 transition-all cursor-pointer"
                    />
                  );
                })}

                {/* X LABELS */}
                {projectProgressData.map((item, i) => {
                  const x = 40 + (i * 640) / (projectProgressData.length - 1);
                  return (
                    <text
                      key={i}
                      x={x}
                      y="285"
                      textAnchor="middle"
                      className="text-xs fill-gray-500 font-medium"
                    >
                      {item.quarter}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;