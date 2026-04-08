// src/pages/Manager/Dashboard.jsx
import { useState, useEffect } from "react";
import { TrendingUp, Briefcase, CheckCircle, Clock } from "lucide-react";

const ManagerDashboard = () => {
  const managerName = "Rahul Sharma"; // Replace with real user data later

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
  });

  const [completionRate] = useState(68);

  // Sample projects (filtered for this manager)
  const allProjects = [
    { id: 1, title: "Design Dashboard UI", manager: "Rahul Sharma", status: "In Progress", progress: 75 },
    { id: 2, title: "API Integration", manager: "Rahul Sharma", status: "In Progress", progress: 45 },
    { id: 3, title: "Payment Gateway", manager: "Sarah Connor", status: "In Progress", progress: 90 },
    { id: 4, title: "Login Module", manager: "Rahul Sharma", status: "Completed", progress: 100 },
    { id: 5, title: "User Profile Page", manager: "Rahul Sharma", status: "Completed", progress: 100 },
  ];

  useEffect(() => {
    const myProjects = allProjects.filter(p => p.manager === managerName);

    const total = myProjects.length;
    const active = myProjects.filter(p => p.status === "In Progress").length;
    const completed = myProjects.filter(p => p.status === "Completed").length;

    setStats({
      totalProjects: total,
      activeProjects: active,
      completedProjects: completed,
    });
  }, []);

  return (
    <div className="p-5 md:p-6 bg-white min-h-screen">
      {/* Header - Compact */}
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

      {/* Top Stats Cards - More Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        {/* Total Projects */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">TOTAL PROJECTS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.totalProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform flex-shrink-0">
              <Briefcase size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6 flex items-center gap-1">
            <TrendingUp size={15} /> My Assigned Projects
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">ACTIVE PROJECTS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.activeProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform flex-shrink-0">
              <Clock size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6">Currently in progress</p>
        </div>

        {/* Projects Completed */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">PROJECTS COMPLETED</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.completedProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform flex-shrink-0">
              <CheckCircle size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6 flex items-center gap-1">
            <TrendingUp size={15} /> {completionRate}% completion rate
          </p>
        </div>
      </div>

      {/* Graphs Section - More Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        
        {/* Project Completion (Smaller Circular) */}
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
                  strokeDashoffset={326.73 - (326.73 * completionRate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl font-bold text-gray-900">{completionRate}%</span>
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

        {/* PROJECT PROGRESS - Smaller */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-8 hover:border-blue-400 hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">PROJECT PROGRESS</h3>
              <p className="text-xs text-gray-500">Last 6 weeks • My projects only</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-2xl text-xs font-medium">Live</div>
          </div>

          <div className="h-52 md:h-64 relative bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 md:p-6">
            <svg viewBox="0 0 700 280" className="w-full h-full">
              <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 40 220 Q 150 190 260 170 Q 370 140 480 130 Q 590 110 660 90 L 660 280 L 40 280 Z"
                fill="url(#areaGrad)"
              />
              <path
                d="M 40 220 Q 150 190 260 170 Q 370 140 480 130 Q 590 110 660 90"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;