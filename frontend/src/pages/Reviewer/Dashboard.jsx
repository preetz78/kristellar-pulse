// src/pages/Reviewer/Dashboard.jsx
import { useState } from "react";
import { Briefcase, Clock, CheckCircle, TrendingUp } from "lucide-react";

const ReviewerDashboard = () => {
  const [stats] = useState({
    totalProjects: 24,
    activeProjects: 15,
    completedProjects: 9,
  });

  const [completionRate] = useState(68);

  // Project Progress Data for thin multi-line chart
  const projectProgressData = [
    { name: "WorkSync Project Hub", color: "#3b82f6", progress: [22, 35, 48, 59, 68, 75] },
    { name: "AI Chatbot Development", color: "#10b981", progress: [12, 28, 39, 52, 61, 68] },
    { name: "Enterprise Resource Planning System", color: "#8b5cf6", progress: [5, 18, 29, 41, 52, 58] },
    { name: "Marketing Automation Platform", color: "#f59e0b", progress: [8, 19, 26, 34, 45, 53] },
    { name: "E-commerce Dashboard", color: "#ef4444", progress: [3, 11, 18, 25, 31, 43] }
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Dashboard</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Overall Project Performance & Reviews
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

        {/* PROJECT PROGRESS - Thin Multi-Line Chart */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-2xl transition-all group">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PROJECT PROGRESS</h3>
              <p className="text-xs text-gray-500">Last 6 weeks • All projects</p>
            </div>
            <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full animate-pulse">
              Live
            </div>
          </div>

          <div className="relative h-64 bg-white rounded-2xl p-6 border border-gray-100">
            <svg viewBox="0 0 750 280" className="w-full h-full">
              {/* Light grid lines */}
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
              {["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"].map((week, i) => (
                <text 
                  key={i} 
                  x={80 + i * 115} 
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

              {/* Thin Progress Lines for each project */}
              {projectProgressData.map((project, idx) => (
                <g key={idx}>
                  <polyline
                    points={project.progress.map((val, i) => 
                      `${80 + i * 115},${250 - (val * 2)}`
                    ).join(" ")}
                    fill="none"
                    stroke={project.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Small dots */}
                  {project.progress.map((val, i) => (
                    <circle
                      key={i}
                      cx={80 + i * 115}
                      cy={250 - (val * 2)}
                      r="4"
                      fill={project.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 justify-center">
            {projectProgressData.map((project, i) => (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-4 h-0.5 rounded" 
                  style={{ backgroundColor: project.color }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">{project.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;