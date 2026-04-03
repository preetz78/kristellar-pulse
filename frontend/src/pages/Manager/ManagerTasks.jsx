import React, { useState } from 'react';
import { 
  Plus, Search, Clock, X 
} from 'lucide-react';

const ManagerTasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects'); // New: Project filter

  // Sample Tasks Data
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Design Login Flow",
      description: "Create wireframes and high-fidelity designs for new login screen",
      status: "To Do",
      priority: "High",
      assignee: "Anika Sharma",
      assigneeInitial: "AS",
      dueDate: "2026-04-05",
      project: "Mobile Banking App",
      progress: 0,
    },
    {
      id: 2,
      title: "Implement Payment Gateway",
      description: "Integrate Razorpay and Stripe payment options",
      status: "In Progress",
      priority: "High",
      assignee: "Rahul Verma",
      assigneeInitial: "RV",
      dueDate: "2026-04-08",
      project: "E-commerce Platform",
      progress: 45,
    },
    {
      id: 3,
      title: "User Testing Round 1",
      description: "Conduct usability testing with 10 users",
      status: "Review",
      priority: "Medium",
      assignee: "Priya Patel",
      assigneeInitial: "PP",
      dueDate: "2026-04-10",
      project: "AI Dashboard Analytics",
      progress: 60,
    },
    {
      id: 4,
      title: "Setup Database Schema",
      description: "Design and implement PostgreSQL schema",
      status: "Done",
      priority: "Low",
      assignee: "Amit Kumar",
      assigneeInitial: "AK",
      dueDate: "2026-04-02",
      project: "HR Management System",
      progress: 100,
    },
  ]);

  // Get unique projects for dropdown
  const projects = ['All Projects', ...new Set(tasks.map(task => task.project))];

  const columns = [
    { id: 'To Do', title: 'TO DO', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-400', headerGradient: 'from-blue-50 to-blue-100' },
    { id: 'In Progress', title: 'IN PROGRESS', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-400', headerGradient: 'from-amber-50 to-amber-100' },
    { id: 'Review', title: 'IN REVIEW', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-400', headerGradient: 'from-purple-50 to-purple-100' },
    { id: 'Done', title: 'DONE', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-400', headerGradient: 'from-emerald-50 to-emerald-100' },
  ];

  // Filter tasks by search + selected project
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = 
      selectedProject === 'All Projects' || task.project === selectedProject;

    return matchesSearch && matchesProject;
  });

  const getTasksByStatus = (status) => 
    filteredTasks.filter(task => task.status === status);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'Low': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleDragOver = (e) => e.preventDefault();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-8 border-b border-gray-100">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-semibold text-blue-700">Tasks</h1>
            <p className="text-gray-600 mt-1">View and manage all tasks across projects</p>
          </div>

          <button 
            onClick={() => alert("Create New Task - Coming Soon")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all shadow-md"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>

        {/* Project Selector Dropdown + Search Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="relative max-w-xs">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full py-3 px-6 bg-white border border-gray-200 rounded-3xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base appearance-none cursor-pointer"
            >
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">▼</div>
          </div>

          <div className="relative flex-1 max-w-xl">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500">🔍</div>
            <input
              type="text"
              placeholder="Search Tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 py-3 bg-white border border-gray-200 rounded-3xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base placeholder-gray-400"
            />
          </div>
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
                <div className={`bg-gradient-to-r ${column.headerGradient} px-6 py-5 border-b border-gray-200 flex items-center justify-between group-hover:shadow-md transition-all`}>
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
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm">
                            {task.assigneeInitial}
                          </div>
                          <span className="text-gray-700 font-medium truncate">{task.assignee}</span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-500 whitespace-nowrap">
                          <Clock size={13} />
                          {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
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

                {/* Add Task Button */}
                <div className="p-4 border-t border-gray-100 bg-gradient-to-t from-gray-50 to-transparent">
                  <button 
                    onClick={() => alert(`Add task to ${column.title}`)}
                    className="w-full py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl flex items-center justify-center gap-2 transition-all hover:border-blue-400 font-semibold text-sm"
                  >
                    <Plus size={18} /> Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Sidebar - Unchanged */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={closeTask}>
          <div 
            className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between z-10 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-blue-600 font-bold">TSK-{String(selectedTask.id).padStart(3, '0')}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-2">{selectedTask.title}</h2>
              </div>
              <button 
                onClick={closeTask}
                className="p-2.5 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div className="flex gap-3 flex-wrap">
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${getPriorityColor(selectedTask.priority)} shadow-sm`}>
                  {selectedTask.priority} Priority
                </div>
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold shadow-sm">
                  {selectedTask.status}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-bold">Assigned To</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center text-lg shadow-md">
                    {selectedTask.assigneeInitial}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedTask.assignee}</p>
                    <p className="text-sm text-gray-500">Team Member</p>
                  </div>
                </div>
              </div>

              {selectedTask.progress !== undefined && (
                <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-700">Progress</span>
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{selectedTask.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-bold">Description</p>
                <p className="text-gray-700 leading-relaxed text-sm font-medium">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Project</p>
                  <p className="font-bold text-gray-900 text-sm">{selectedTask.project}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Due Date</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {new Date(selectedTask.dueDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', month: 'short'
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold">Comments</p>
                
                <div className="space-y-4 mb-6 max-h-48 overflow-y-auto">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-md">JD</div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">John Doe</p>
                        <p className="text-xs text-gray-500">Jul 25, 2026</p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm font-medium">Completed schema dump and initial data validation.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button 
                    onClick={addComment}
                    className="px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Send
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

export default ManagerTasks;