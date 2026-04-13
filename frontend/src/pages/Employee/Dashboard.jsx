// src/pages/Employee/Dashboard.jsx
import { useState, useEffect } from "react";
import { TrendingUp, Briefcase, CheckCircle, Clock } from "lucide-react";

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
  });

  const [completionRate, setCompletionRate] = useState(0);
  const [employeeName, setEmployeeName] = useState("");

  // This will come from logged-in user (we'll improve this later)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setEmployeeName(user.name || "Employee");

    // TODO: Later fetch real data from backend using employee_id
    // For now, using realistic sample data
    const myProjects = [
      { id: 1, title: "Frontend UI Development", status: "In Progress", progress: 75 },
      { id: 2, title: "Bug Fixing Sprint", status: "In Progress", progress: 40 },
      { id: 3, title: "Payment Integration", status: "Completed", progress: 100 },
      { id: 4, title: "User Authentication Module", status: "Completed", progress: 100 },
      { id: 5, title: "API Documentation", status: "In Progress", progress: 60 },
    ];

    const total = myProjects.length;
    const active = myProjects.filter(p => p.status === "In Progress").length;
    const completed = myProjects.filter(p => p.status === "Completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({
      totalProjects: total,
      activeProjects: active,
      completedProjects: completed,
    });
    setCompletionRate(rate);
  }, []);

  // Sample progress trend data (Last 6 weeks)
  const projectProgressData = [
    { name: "My Assigned Tasks", color: "#3b82f6", progress: [35, 48, 62, 71, 68, 82] },
    { name: "Bug Fixes", color: "#10b981", progress: [20, 33, 45, 58, 65, 78] },
    { name: "Feature Development", color: "#8b5cf6", progress: [15, 28, 42, 55, 63, 71] },
  ];

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

        {/* Active Projects */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">ACTIVE TASKS</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.activeProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Clock size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6">Currently in progress</p>
        </div>

        {/* Projects Completed */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-6 hover:border-blue-400 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">COMPLETED</p>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3">{stats.completedProjects}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <CheckCircle size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-emerald-600 mt-4 md:mt-6 flex items-center gap-1">
            <TrendingUp size={15} /> {completionRate}% completion rate
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

        {/* Project Progress Trend */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 md:p-8 hover:border-blue-400 hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">My Progress Trend</h3>
              <p className="text-xs text-gray-500">Last 6 weeks • My assigned work</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-2xl text-xs font-medium">Live</div>
          </div>

          <div className="h-52 md:h-64 relative bg-white rounded-2xl p-4 md:p-6 border border-gray-100">
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

              {/* Progress Lines */}
              {projectProgressData.map((project, idx) => (
                <g key={idx}>
                  <polyline
                    points={project.progress.map((val, i) => 
                      `${80 + i * 115},${250 - (val * 2)}`
                    ).join(" ")}
                    fill="none"
                    stroke={project.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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

export default EmployeeDashboard;