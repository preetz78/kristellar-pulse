// src/pages/Admin/TaskInsights.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Clock,
  User,
  MessageSquare,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  ListTodo
} from 'lucide-react';

import apiConfig from "../../config/apiConfig";

const StatusBadge = ({ status }) => {
  const styles = {
    'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Delayed': 'bg-red-100 text-red-700 border border-red-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || "Not Started"}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={28} />
      </div>
    </div>
  );
};

const normalizeComments = (comments) => {
  if (Array.isArray(comments)) {
    return comments.filter(Boolean);
  }

  if (typeof comments === 'string') {
    try {
      const parsed = JSON.parse(comments);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  return [];
};

export default function TaskInsights() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = sessionStorage.getItem("token");
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/tasks`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || `HTTP ${response.status}`);
        }

        const processedTasks = (result.data || []).map((task) => ({
          ...task,
          comments: normalizeComments(task.comments)
        }));

        setTasks(processedTasks);
      } catch (err) {
        console.error("Fetch admin tasks error:", err);
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      delayed: tasks.filter(t => t.status === 'Delayed').length
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter(task =>
      task.title?.toLowerCase().includes(query) ||
      task.project_name?.toLowerCase().includes(query) ||
      task.assignee_name?.toLowerCase().includes(query)
    );
  }, [searchQuery, tasks]);

  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const projectName = task.project_name || "Uncategorized";
      if (!acc[projectName]) acc[projectName] = [];
      acc[projectName].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleOpenTask = (id) => setSelectedTaskId(id);
  const handleCloseSidebar = () => setSelectedTaskId(null);

  const toggleProjectExpanded = (projectName) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectColor = (index) => {
    const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'indigo'];
    return colors[index % colors.length];
  };

  const getProgressBarColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
    };
    return colorMap[color];
  };

  if (loading) {
    return <div className="p-6 text-center">Loading task insights...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          Project performance and task reviews
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          icon={ListTodo}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          label="Delayed"
          value={stats.delayed}
          icon={AlertCircle}
          color="bg-red-100 text-red-600"
        />
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks, projects, or team members..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-slate-200">
            No tasks found
          </div>
        ) : (
          Object.entries(groupedTasks).map(([projectName, projectTasks], projectIndex) => {
            const projectColor = getProjectColor(projectIndex);
            const isExpanded = expandedProjects.has(projectName);
            const inProgressCount = projectTasks.filter(t => t.status === 'In Progress').length;
            const completedCount = projectTasks.filter(t => t.status === 'Completed').length;
            const progressWidth = projectTasks.length > 0
              ? (completedCount / projectTasks.length) * 100
              : 0;

            return (
              <div key={projectName} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleProjectExpanded(projectName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-1 h-12 rounded-full ${getProgressBarColor(projectColor)}`}></div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900">{projectName}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {projectTasks.length} tasks
                        {inProgressCount > 0 ? ` - ${inProgressCount} in progress` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressBarColor(projectColor)} transition-all`}
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <div className="px-6 py-4 space-y-3 bg-slate-50 max-h-96 overflow-y-auto">
                      {projectTasks.map((task) => {
                        const commentCount = Array.isArray(task.comments)
                          ? task.comments.filter(Boolean).length
                          : 0;

                        return (
                          <div
                            key={task.id}
                            onClick={() => handleOpenTask(task.id)}
                            className="bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                                  {task.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-6 mt-3 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {task.due_date
                                      ? new Date(task.due_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                                      : 'No due date'}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {task.assignee_name || 'Unassigned'}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {commentCount}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 ml-4">
                                <StatusBadge status={task.status} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedTaskId && selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
          onClick={handleCloseSidebar}
        >
          <div
            className="bg-gradient-to-b from-white to-slate-50 w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 sticky top-0 z-10 shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-blue-100">Task Details</p>
                  <h2 className="text-2xl font-bold mt-2 leading-tight">{selectedTask.title}</h2>
                  <p className="text-sm text-blue-100 mt-1">Created for project execution and tracking</p>
                </div>
                <button
                  onClick={handleCloseSidebar}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Project Name</p>
                    <p className="font-bold text-lg text-slate-800 mt-1">{selectedTask.project_name || "Uncategorized"}</p>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium">Assignee</p>
                    <p className="font-semibold text-slate-800 mt-1">{selectedTask.assignee_name || "Unassigned"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium">Due Date</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {selectedTask.due_date
                        ? new Date(selectedTask.due_date).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })
                        : "No due date"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Description</p>
                <p className="text-slate-600 leading-relaxed">{selectedTask.description || "No description provided."}</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Reviewer Comments ({selectedTask.comments?.length || 0})
                </p>
                <div className="space-y-4">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment, index) => (
                      <div key={comment.id || index} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between mb-2">
                          <p className="font-semibold text-slate-800 text-sm">{comment.reviewer_name}</p>
                          <p className="text-xs text-slate-400">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString("en-GB") : ""}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{comment.comment_text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                      No reviewer comments yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
