// src/pages/Admin/Tasks.jsx
import { useState } from "react";
import { Plus, Clock } from "lucide-react";

const Tasks = () => {
  const [columns] = useState([
    {
      id: "todo",
      title: "TO DO",
      count: 2,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      tasks: [
        {
          id: 1,
          title: "Setup Backend API",
          project: "Cloud Migration",
          priority: "High",
          dueDate: "31 May 2025",
          assignees: ["👨‍💼", "👩🏻"],
        },
        {
          id: 2,
          title: "UI Dashboard Design",
          project: "Solar Install",
          priority: "Medium",
          dueDate: "5 Jun 2025",
          assignees: ["👩"],
        },
      ],
    },
    {
      id: "inprogress",
      title: "IN PROGRESS",
      count: 3,
      color: "bg-blue-100",
      borderColor: "border-blue-200",
      tasks: [
        {
          id: 3,
          title: "Daily Art",
          project: "Weszlo.com",
          priority: "Medium",
          dueDate: "16 Jul 2025",
          assignees: ["👨", "👩", "👨🏻"],
        },
        {
          id: 4,
          title: "Optimize color contrast for accessibility",
          project: "DailyArt App",
          priority: "High",
          dueDate: "12 Sep 2025",
          assignees: ["👩‍💼"],
        },
      ],
    },
    {
      id: "review",
      title: "IN REVIEW",
      count: 1,
      color: "bg-indigo-50",
      borderColor: "border-blue-200",
      tasks: [
        {
          id: 5,
          title: "Map Component",
          project: "Design System",
          priority: "Medium",
          dueDate: "18 May 2025",
          assignees: ["👨"],
        },
      ],
    },
    {
      id: "done",
      title: "DONE",
      count: 2,
      color: "bg-emerald-50",
      borderColor: "border-blue-200",
      tasks: [
        {
          id: 6,
          title: "Add micro-interactions to prototype",
          project: "Weszlo.com",
          priority: "Low",
          dueDate: "27 Apr 2025",
          assignees: ["👩", "👨"],
        },
        {
          id: 7,
          title: "Prepare handoff files",
          project: "EngageSoft",
          priority: "High",
          dueDate: "13 May 2025",
          assignees: ["👨🏻", "👩"],
        },
      ],
    },
  ]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700 border border-red-200 text-xs";
      case "Medium": return "bg-amber-100 text-amber-700 border border-amber-200 text-xs";
      case "Low": return "bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs";
      default: return "bg-gray-100 text-gray-700 border border-gray-200 text-xs";
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Tasks</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            View and manage all tasks across projects
          </p>
        </div>

        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map((column) => (
          <div 
            key={column.id} 
            className={`bg-white rounded-3xl border ${column.borderColor} overflow-hidden shadow-sm hover:shadow-md transition-all`}
          >
            {/* Column Header */}
            <div className={`px-5 py-4 flex items-center justify-between ${column.color}`}>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800 text-base">{column.title}</h3>
                <span className="bg-white text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {column.count}
                </span>
              </div>
              <button className="text-blue-500 hover:text-blue-600 transition p-1 rounded-lg hover:bg-blue-50">
                <Plus size={18} />
              </button>
            </div>

            {/* Tasks Container */}
            <div className="p-4 space-y-3 min-h-[480px]">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    {/* Priority Badge */}
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>

                    {/* Assignees Avatars */}
                    <div className="flex -space-x-1.5">
                      {task.assignees.map((avatar, i) => (
                        <div 
                          key={i} 
                          className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-sm"
                        >
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Task Title */}
                  <h4 className="font-medium text-gray-900 text-[15px] leading-tight mb-2 group-hover:text-blue-700 transition-colors">
                    {task.title}
                  </h4>

                  {/* Project Name */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-1">{task.project}</p>

                  {/* Due Date & View Details */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-blue-500" />
                      <span>{task.dueDate}</span>
                    </div>
                    <div className="text-blue-600 font-medium hover:text-blue-700 transition-colors cursor-pointer text-xs">
                      View Details →
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {column.tasks.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-sm">
                  No tasks yet
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;