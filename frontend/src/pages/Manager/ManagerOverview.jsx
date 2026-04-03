import React from 'react';
import { 
  Users, 
  FolderOpen, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp 
} from 'lucide-react';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';

const ManagerOverview = () => {
  const stats = [
    {
      label: "TOTAL PROJECTS",
      value: "12",
      trend: "+8% Growth",
      icon: FolderOpen,
      gradientFrom: "from-blue-600",
      gradientTo: "to-blue-500"
    },
    {
      label: "ACTIVE TASKS",
      value: "47",
      trend: "12 Pending",
      icon: CheckCircle,
      gradientFrom: "from-blue-700",
      gradientTo: "to-blue-600"
    },
    {
      label: "TEAM MEMBERS",
      value: "8",
      trend: "All Active",
      icon: Users,
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-400"
    },
    {
      label: "OVERDUE TASKS",
      value: "5",
      trend: "Attention Required",
      icon: AlertTriangle,
      gradientFrom: "from-blue-600",
      gradientTo: "to-blue-500"
    },
  ];

  const taskStatusData = [
    { name: 'To Do', value: 18, color: '#2563eb' },
    { name: 'In Progress', value: 12, color: '#3b82f6' },
    { name: 'Review', value: 7, color: '#60a5fa' },
    { name: 'Done', value: 35, color: '#1e40af' },
  ];

  // Weekly Task Progress Data (for the line chart)
  const weeklyData = [
    { day: 'Mon', completed: 12, assigned: 15 },
    { day: 'Tue', completed: 14, assigned: 16 },
    { day: 'Wed', completed: 17, assigned: 18 },
    { day: 'Thu', completed: 15, assigned: 17 },
    { day: 'Fri', completed: 19, assigned: 20 },
    { day: 'Sat', completed: 16, assigned: 18 },
    { day: 'Sun', completed: 17, assigned: 21 },
  ];

  const recentActivities = [
    { time: "2 min ago", action: "Anika completed 'UI Redesign' task" },
    { time: "15 min ago", action: "New project 'Mobile App v2' created" },
    { time: "1 hour ago", action: "Rahul submitted review for Task #342" },
    { time: "3 hours ago", action: "Deadline updated for 'Backend API'" },
  ];

  const upcomingDeadlines = [
    { task: "Payment Gateway Integration", due: "Today", priority: "High" },
    { task: "User Testing Round 2", due: "Tomorrow", priority: "Medium" },
    { task: "Marketing Website Launch", due: "Apr 5", priority: "High" },
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Overview</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            System Monitoring • Real-time updates
          </p>
        </div>

        <button className="px-5 py-2 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          Export PDF
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 tracking-wider group-hover:text-blue-600 transition-colors">
                  {card.label}
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
                  {card.value}
                </p>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-4 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
              <TrendingUp size={14} className="text-emerald-500" />
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Pie Chart */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
              TASK STATUS
            </h2>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-300 text-blue-700 text-xs font-medium rounded-full">
              This Month
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-52 h-52 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-3 text-sm">
              {taskStatusData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WEEKLY TASK PROGRESS - Designed to match your screenshot */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 hover:shadow-xl transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                WEEKLY TASK PROGRESS
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                17 of 21 tasks completed this week
              </p>
            </div>
            <div className="px-4 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-sm">
              Live
            </div>
          </div>

          {/* Line Chart Area */}
          <div className="h-64 mt-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                
                {/* Assigned Tasks Line */}
                <Line 
                  type="monotone" 
                  dataKey="assigned" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Assigned"
                />
                
                {/* Completed Tasks Line */}
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#22d3ee" 
                  strokeWidth={3}
                  dot={{ fill: '#22d3ee', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-center text-xs text-gray-500 mt-3">
            Weekly Completed vs Assigned Tasks
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
            Recent Activity
          </h2>
          <div className="space-y-4 text-sm">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex gap-4 text-gray-600 hover:pl-2 transition-all duration-300">
                <div className="text-xs text-gray-400 whitespace-nowrap w-20">{activity.time}</div>
                <p>{activity.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
              Upcoming Deadlines
            </h2>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            {upcomingDeadlines.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-sm"
              >
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{item.task}</p>
                  <p className="text-xs text-gray-500">Due: {item.due}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full 
                  ${item.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerOverview;