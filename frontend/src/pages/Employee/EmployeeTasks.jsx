// src/pages/Employee/EmployeeTasks.jsx

import React, { useState } from 'react';
import { Plus, Search, Clock, X, Send } from 'lucide-react';

const EmployeeTasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Employee's own tasks only (no other people's names)
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Finalize login screen designs",
      description: "Create high-fidelity designs for new authentication flow",
      status: "To Do",
      priority: "High",
      // assignee: "You",
      // assigneeInitial: "AS",
      dueDate: "2026-04-05",
      project: "Mobile Banking App",
      progress: 0,
      comments: [
        { id: 101, text: "Waiting for final approval from design team", time: "3h ago" }
      ]
    },
    {
      id: 2,
      title: "Fix payment API integration bug",
      description: "Resolve 500 error when processing UPI payments",
      status: "In Progress",
      priority: "High",
      // assignee: "You",
      // assigneeInitial: "RV",
      dueDate: "2026-04-08",
      project: "E-commerce Platform",
      progress: 45,
      comments: [
        { id: 201, text: "Backend team confirmed the issue is on our side", time: "5h ago" }
      ]
    },
    {
      id: 3,
      title: "Review user testing feedback",
      description: "Analyze feedback from last week's usability testing",
      status: "Review",
      priority: "Medium",
      // assignee: "You",
      // assigneeInitial: "PP",
      dueDate: "2026-04-10",
      project: "AI Dashboard",
      progress: 60,
      comments: []
    },
    {
      id: 4,
      title: "Update documentation for new API endpoints",
      description: "Add examples and error handling documentation",
      status: "Done",
      priority: "Low",
      // assignee: "You",
      // assigneeInitial: "AK",
      dueDate: "2026-04-02",
      project: "HR Management System",
      progress: 100,
      comments: [
        { id: 401, text: "Documentation reviewed and approved by team", time: "2d ago" }
      ]
    },
  ]);

  const projects = ['All Projects', ...new Set(tasks.map(t => t.project))];

  const columns = [
    { id: 'To Do', title: 'TO DO', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-400', headerGradient: 'from-blue-50 to-blue-100' },
    { id: 'In Progress', title: 'IN PROGRESS', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-400', headerGradient: 'from-amber-50 to-amber-100' },
    { id: 'Review', title: 'IN REVIEW', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-400', headerGradient: 'from-purple-50 to-purple-100' },
    { id: 'Done', title: 'DONE', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-400', headerGradient: 'from-emerald-50 to-emerald-100' },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'All Projects' || task.project === selectedProject;
    return matchesSearch && matchesProject;
  });

  const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-700';
    if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const openTask = (task) => setSelectedTask(task);
  const closeTask = () => {
    setSelectedTask(null);
    setNewComment('');
  };

  const addComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    alert(`Comment added: "${newComment}"`);
    setNewComment('');
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-blue-700">Tasks</h1>
            <p className="text-gray-600 mt-1">Track and manage your assigned work</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-3 bg-white flex flex-wrap gap-4 items-center">
        <div className="relative w-64">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full py-3.5 px-5 bg-white border border-gray-200 rounded-3xl focus:outline-none focus:border-blue-500 text-base appearance-none cursor-pointer"
          >
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">▼</div>
        </div>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search Tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 py-3.5 bg-white border border-gray-200 rounded-3xl focus:outline-none focus:border-blue-500 text-base"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {columns.map((column) => {
                  const columnTasks = getTasksByStatus(column.id);
                  return (
                    <div 
                      key={column.id}
                      className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      {/* Column Header */}
                      <div className={`bg-gradient-to-r ${column.headerGradient} px-6 py-5 border-gray-200 flex items-center justify-between group-hover:shadow-md transition-all`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3.5 h-3.5 rounded-full ${column.dotColor} shadow-sm`} />
                          <h3 className="font-bold text-gray-900 tracking-wide text-sm">{column.title}</h3>
                        </div>
                        <div className="bg-white text-gray-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-gray-200 shadow-sm hover:shadow-md transition-all">
                          {columnTasks.length}
                        </div>
                      </div>
      
                      {/* Tasks */}
                      <div className="p-4 space-y-3 min-h-[500px] flex-1 overflow-y-auto">
                        {columnTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('taskId', task.id);
                            }}
                            onClick={() => openTask(task)}
                            className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 cursor-move transition-all hover:shadow-lg hover:-translate-y-1 group active:cursor-grabbing"
                          >
                            <div className="flex justify-between items-start mb-3 gap-2">
                              <h4 className="font-semibold text-gray-900 pr-2 leading-snug text-sm group-hover:text-blue-600 transition-colors">{task.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-lg font-bold whitespace-nowrap flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
      
                            <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                              {task.description}
                            </p>
      
                            {task.progress !== undefined && (
                              <div className="mb-4">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">{task.progress}% Complete</p>
                              </div>
                            )}
      
                            <div className="flex items-center justify-between text-xs mb-3">
              
      
                              <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 rounded-lg text-xs font-medium text-blue-700">
                                <Clock size={14} className="text-blue-700" />
                                <span>
                                  {new Date(task.dueDate).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
      
                            <div className="pt-3 border-t border-gray-100">
                              <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                {task.project}
                              </span>
                            </div>
                          </div>
                        ))}
      
                        {columnTasks.length === 0 && (
                          <div className="h-full flex items-center justify-center text-center py-12">
                            <div>
                              <p className="text-gray-400 text-sm font-medium">No tasks yet</p>
                              <p className="text-gray-300 text-xs mt-1">Drag tasks here or create a new one</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

      {/* Task Detail Sidebar */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={closeTask}>
          
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl animate-slide-in overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 flex justify-between items-start">
              <div>
                <p className="text-[11px] text-blue-600 font-mono font-semibold">
                  TSK-{String(selectedTask.id).padStart(3, "0")}
                </p>
                <h2 className="text-lg font-semibold text-gray-900 mt-1 leading-snug">
                  {selectedTask.title}
                </h2>
              </div>

              <button 
                onClick={closeTask} 
                className="p-2 rounded-lg hover:bg-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">

              {/* Status + Priority + Date */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                  {selectedTask.priority} Priority
                </span>
                <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {selectedTask.status}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {new Date(selectedTask.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>

              {/* Assignee + Progress */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-4">

                {/* Assignee */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    {selectedTask.assigneeInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTask.assignee}
                    </p>
                    <p className="text-xs text-gray-500">Team Member</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-blue-600 font-semibold">
                      {selectedTask.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Description */}
              <div>
                <p className="text-xs uppercase text-gray-400 mb-1 tracking-wider">
                  Description
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              {/* Project + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Project</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {selectedTask.project}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">Due Date</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {new Date(selectedTask.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs uppercase text-gray-400 mb-3 tracking-wider">
                  Comments
                </p>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">

                  {selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-bold">
                          {comment.user[0]}
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl flex-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="font-medium text-gray-800">
                              {comment.user}
                            </span>
                            <span>{comment.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4 text-sm">
                      No comments yet
                    </p>
                  )}

                </div>

                {/* Input */}
                <div className="flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                  />

                  <button
                    onClick={addComment}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg hover:scale-105 transition"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks;