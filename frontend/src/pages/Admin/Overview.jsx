// src/pages/Admin/Overview.jsx
import { useState } from "react";
import {
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const Overview = () => {
  const [stats] = useState({
    totalOrganizations: 3,
    activeProjects: 3,
    tasksPending: 128,
    projectDelays: 7,
  });

  const [taskCompletion] = useState(72);
  const [doneTasks] = useState(412);
  const [pendingTasks] = useState(128);

  // Weekly Task Progress Data
  const weeklyTaskData = [
    { day: "MON", assigned: 6, completed: 6 },
    { day: "TUE", assigned: 4, completed: 2 },
    { day: "WED", assigned: 5, completed: 4 },
    { day: "THU", assigned: 3, completed: 3 },
    { day: "FRI", assigned: 2, completed: 1 },
    { day: "SAT", assigned: 1, completed: 1 },
    { day: "SUN", assigned: 0, completed: 0 },
  ];

  const totalAssignedThisWeek = weeklyTaskData.reduce((sum, day) => sum + day.assigned, 0);
  const totalCompletedThisWeek = weeklyTaskData.reduce((sum, day) => sum + day.completed, 0);

  const recentActivities = [
    { 
      icon: Shield, 
      title: "Admin Modified Permissions", 
      subtitle: "Target: TechFlow • 12m ago" 
    },
    { 
      icon: CheckCircle, 
      title: "S. Connor Updated Milestone", 
      subtitle: "Target: Solar Install • 1h ago" 
    },
    { 
      icon: Shield, 
      title: "System Security Patch applied", 
      subtitle: "Target: Global Node • 3h ago" 
    },
  ];

  const projectDelays = [
    { name: "TechFlow Solutions", delay: "14 days delayed", width: "95%" },
    { name: "GreenGrid Energy", delay: "2 days delayed", width: "25%" },
    { name: "Global Logistics", delay: "8 days delayed", width: "60%" },
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Overview</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            System Monitoring • Real-time updates
          </p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "TOTAL ORGANIZATIONS", value: stats.totalOrganizations, trend: "12% Growth", icon: Users, gradientFrom: "from-blue-600", gradientTo: "to-blue-500" },
          { label: "ACTIVE PROJECTS", value: stats.activeProjects, trend: "Real-time sync", icon: Briefcase, gradientFrom: "from-blue-700", gradientTo: "to-blue-600" },
          { label: "TASKS PENDING", value: stats.tasksPending, trend: "42 High Priority", icon: Clock, gradientFrom: "from-blue-500", gradientTo: "to-blue-400" },
          { label: "PROJECT DELAYS", value: stats.projectDelays, trend: "Attention Required", icon: AlertCircle, gradientFrom: "from-blue-600", gradientTo: "to-blue-500" },
        ].map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-4 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 tracking-wider group-hover:text-blue-600 transition-colors">{card.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">{card.value}</p>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
              <TrendingUp size={14} className="text-emerald-500" />
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Task Completion */}
        <div className="lg:col-span-2 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">TASK COMPLETION</h3>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-300 text-blue-700 text-xs font-semibold rounded-full">
              Active
            </span>
          </div>

          <div className="flex justify-center my-4 group-hover:scale-110 transition-transform duration-300">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#blueGradient)"
                  strokeWidth="10"
                  strokeDasharray="326.73"
                  strokeDashoffset={326.73 - (326.73 * taskCompletion) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">{taskCompletion}%</span>
                <span className="text-xs text-gray-500 mt-1 group-hover:text-blue-600 transition-colors duration-300 font-semibold">COMPLETED</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center hover:border-blue-400 hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <p className="text-xs text-blue-600 font-semibold">DONE</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{doneTasks}</p>
            </div>
            <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 text-center hover:border-blue-500 hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <p className="text-xs text-blue-700 font-semibold">PENDING</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{pendingTasks}</p>
            </div>
          </div>
        </div>

        {/* Weekly Task Progress - Updated Section */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
                WEEKLY TASK PROGRESS
              </h3>
              <p className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                This week • {totalCompletedThisWeek} of {totalAssignedThisWeek} tasks completed
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded"></div>
                <span className="group-hover:text-blue-600 transition-colors">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-0.5 border border-dashed border-gray-400 rounded"></div>
                <span>Assigned</span>
              </div>
              <div className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold rounded-full animate-pulse">Live</div>
            </div>
          </div>

          <div className="h-56 relative bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 rounded-xl p-4 group-hover:border-blue-400 transition-colors duration-300">
            {/* Smooth Area Chart */}
            <svg className="w-full h-full" viewBox="0 0 700 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="completedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
                </linearGradient>
                
                <linearGradient id="completedLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Completed Area */}
              <path
                d="M 50,250 Q 150,200 250,210 T 450,110 T 650,65 L 650,300 Q 450,300 250,300 Q 50,300 50,300 Z"
                fill="url(#completedGradient)"
                className="transition-all duration-500"
              />

              {/* Completed Line */}
              <path
                d="M 50,250 Q 150,200 250,210 T 450,110 T 650,65"
                fill="none"
                stroke="url(#completedLine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />

              {/* Data Points */}
              {[
                { x: 50, y: 250 },
                { x: 150, y: 200 },
                { x: 250, y: 210 },
                { x: 350, y: 150 },
                { x: 450, y: 110 },
                { x: 550, y: 180 },
                { x: 650, y: 65 },
              ].map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#2563eb"
                  opacity="0.9"
                  className="transition-all duration-300"
                />
              ))}

              {/* Labels */}
              <text x="50" y="280" textAnchor="middle" className="text-xs fill-gray-500">MON</text>
              <text x="150" y="280" textAnchor="middle" className="text-xs fill-gray-500">TUE</text>
              <text x="250" y="280" textAnchor="middle" className="text-xs fill-gray-500">WED</text>
              <text x="350" y="280" textAnchor="middle" className="text-xs fill-gray-500">THU</text>
              <text x="450" y="280" textAnchor="middle" className="text-xs fill-gray-500">FRI</text>
              <text x="550" y="280" textAnchor="middle" className="text-xs fill-gray-500">SAT</text>
              <text x="650" y="280" textAnchor="middle" className="text-xs fill-gray-500">SUN</text>
            </svg>
          </div>

          {/* Daily Breakdown */}
          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs">
            {weeklyTaskData.map((day, i) => (
              <div key={i} className="bg-white border border-blue-100 rounded-lg p-2 hover:border-blue-300 transition-colors">
                <div className="font-medium text-gray-700">{day.day}</div>
                <div className="text-blue-600 font-semibold mt-1">
                  {day.completed}/{day.assigned}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity + Project Delays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 group">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">Recent Activity Stream</h3>
            <button className="text-blue-600 text-xs font-semibold hover:text-blue-700 transition-all duration-300 hover:scale-110 transform">View All →</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex gap-3 hover:pl-2 transition-all duration-300 cursor-pointer group/item">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transform group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-300 shadow-lg flex-shrink-0">
                  <act.icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover/item:text-transparent group-hover/item:bg-gradient-to-r group-hover/item:from-blue-600 group-hover/item:to-blue-500 group-hover/item:bg-clip-text transition-all duration-300">{act.title}</p>
                  <p className="text-xs text-gray-500 group-hover/item:text-blue-500 transition-colors duration-300">{act.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Delays */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-gray-800 mb-5 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">Project Delays by Organization</h3>
          <div className="space-y-5">
            {projectDelays.map((project, i) => (
              <div key={i} className="hover:pl-2 transition-all duration-300 cursor-pointer group/item">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700 group-hover/item:text-blue-600 transition-colors duration-300">{project.name}</span>
                  <span className="text-blue-600 font-semibold group-hover/item:text-blue-700 transition-colors duration-300">{project.delay}</span>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden border border-blue-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg transition-all duration-500 group-hover/item:shadow-2xl"
                    style={{ width: project.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;