// src/pages/Employee/EmployeeOverview.jsx

import React, { useState } from 'react';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  Calendar, Check, X, ChevronRight
} from 'lucide-react';

const EmployeeOverview = () => {
  const [todaysTasks, setTodaysTasks] = useState([
    { id: 1, title: "Finalize login screen designs", priority: "High", dueTime: "11:30 AM", project: "Mobile Banking App", done: false },
    { id: 2, title: "Fix payment API integration bug", priority: "High", dueTime: "05:00 PM", project: "E-commerce Platform", done: false },
    { id: 3, title: "Review user testing feedback", priority: "Medium", dueTime: "Tomorrow", project: "AI Dashboard", done: false },
  ]);

  const [upcomingDeadlines] = useState([
    { id: 1, title: "Complete payment gateway testing", project: "E-commerce Platform", due: "Tomorrow" },
    { id: 2, title: "Submit final UI assets", project: "Mobile Banking App", due: "Apr 5" },
    { id: 3, title: "Database optimization", project: "HR Management System", due: "Apr 7" },
  ]);

  const [activity, setActivity] = useState([
    "You updated status of 'Finalize login screen designs' to In Progress",
    "You commented on 'Payment API integration bug'",
    "You completed 'Create component library documentation'",
    "You were assigned a new task: 'Review user testing feedback'",
  ]);

  // ── Helper: derive tag style from activity text ──────────────────
  const getActivityMeta = (text) => {
    if (text.includes('completed') || text.includes('dismissed'))
      return { dot: '#22c55e', label: 'Done',     labelBg: '#f0fdf4', labelColor: '#166534', time: 'Yesterday' };
    if (text.includes('commented'))
      return { dot: '#10b981', label: 'Comment',  labelBg: '#ecfdf5', labelColor: '#065f46', time: '2h ago' };
    if (text.includes('assigned'))
      return { dot: '#f59e0b', label: 'Assigned', labelBg: '#fffbeb', labelColor: '#92400e', time: 'Yesterday' };
    return   { dot: '#3b82f6', label: 'Updated',  labelBg: '#eff6ff', labelColor: '#1e40af', time: 'Just now' };
  };

  const toggleTask = (id) => {
    setTodaysTasks(prev =>
      prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
    );
  };

  const dismissTask = (id) => {
    const task = todaysTasks.find(t => t.id === id);
    setTodaysTasks(prev => prev.filter(t => t.id !== id));
    setActivity(prev => [`You dismissed task: '${task.title}'`, ...prev]);
  };

  const doneCount = todaysTasks.filter(t => t.done).length;

  const stats = [
    { label: "MY TASKS",    value: "18", icon: CheckSquare,   color: "from-blue-600 to-blue-500", trend: "Total assigned"     },
    { label: "DUE TODAY",   value: "4",  icon: Clock,         color: "from-blue-600 to-blue-500", trend: "Requires attention" },
    { label: "IN PROGRESS", value: "7",  icon: TrendingUp,    color: "from-blue-600 to-blue-500", trend: "Currently working"  },
    { label: "OVERDUE",     value: "2",  icon: AlertTriangle, color: "from-blue-600 to-blue-500", trend: "Action needed"      },
  ];

  return (
    <div className="p-6 bg-white min-h-screen">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Good morning! Here's your task summary.</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 group cursor-default"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 tracking-wider">{stat.label}</p>
                <p className="text-4xl font-bold mt-1.5 text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-400" />
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Today's Tasks */}
        <div className="lg:col-span-3 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Today's Tasks</h2>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${todaysTasks.length ? (doneCount / todaysTasks.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-blue-600 font-medium">
                {doneCount}/{todaysTasks.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {todaysTasks.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">🎉 All tasks done!</p>
            )}
            {todaysTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-all group
                  ${task.done
                    ? 'bg-green-50 border-green-200 opacity-60'
                    : 'bg-white border-blue-100 hover:border-blue-300'}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  {task.done && <Check size={11} strokeWidth={3} className="text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors
                    ${task.done ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-700'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{task.project}</p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full
                    ${task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">{task.dueTime}</span>
                  <button
                    onClick={() => dismissTask(task.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            <Calendar className="text-blue-400" size={19} />
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.map((item) => (
              <div
                key={item.id}
                className={`flex justify-between items-center px-4 py-3.5 rounded-xl border transition-all group cursor-pointer
                  ${item.due === "Tomorrow"
                    ? 'border-red-200 bg-red-50 hover:bg-red-100'
                    : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50'}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${item.due === "Tomorrow" ? 'text-red-700' : 'text-gray-800'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{item.project}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <span className={`text-xs font-semibold ${item.due === "Tomorrow" ? 'text-red-500' : 'text-gray-500'}`}>
                    {item.due}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`${item.due === "Tomorrow" ? 'text-red-400' : 'text-gray-300'} group-hover:translate-x-0.5 transition-transform`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="mt-5 bg-white border border-blue-200 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={() => setActivity([])}
            className="text-xs text-blue-500 hover:underline"
          >
            Clear all
          </button>
        </div>

        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {activity.map((a, i) => {
              const meta = getActivityMeta(a);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all group"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: meta.dot }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2"
                      style={{ background: meta.labelBg, color: meta.labelColor }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-sm text-gray-500">{a}</span>
                    <p className="text-[10px] text-gray-300 mt-0.5">{meta.time}</p>
                  </div>
                  <button
                    onClick={() => setActivity(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default EmployeeOverview;