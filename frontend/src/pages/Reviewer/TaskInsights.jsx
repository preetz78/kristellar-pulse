// src/pages/Reviewer/TaskInsights.jsx
import { useState, useEffect, useMemo } from 'react';
import apiConfig from '../../config/apiConfig';
import { 
  Search, 
  Clock, 
  User, 
  MessageSquare, 
  X, 
  Send,
  CheckCircle,
  AlertCircle,
  ListTodo,
  ChevronDown
} from 'lucide-react';

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
    <div className="bg-white border border-blue-200 rounded-2xl p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300">
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={28} />
      </div>
    </div>
  );
};

// Format timestamp (e.g., "2h ago")
const formatTimeAgo = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function ReviewerTaskInsights() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Fetch all tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/reviewer/tasks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setTasks(result.data);
        } else {
          throw new Error(result.message || 'Invalid response');
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Fetch comments when task is opened
  useEffect(() => {
    if (!selectedTaskId) {
      setComments([]);
      return;
    }

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(
          `${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTaskId}/comments`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch comments');

        const result = await response.json();
        if (result.success) {
          setComments(result.data);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [selectedTaskId]);

  const updateTaskCommentCount = (taskId, newCount) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, comments: newCount } : task
      )
    );
  };

  // Stats Calculation
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      delayed: tasks.filter(t => t.status === 'Delayed').length
    };
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter(task =>
      task.title?.toLowerCase().includes(query) ||
      task.project?.toLowerCase().includes(query) ||
      task.assignee?.toLowerCase().includes(query)
    );
  }, [searchQuery, tasks]);

  // Grouped Tasks by Project
  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const projectName = task.project || "Uncategorized";
      if (!acc[projectName]) acc[projectName] = [];
      acc[projectName].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleOpenTask = (id) => {
    setSelectedTaskId(id);
    setNewComment('');
  };

  const handleCloseSidebar = () => {
    setSelectedTaskId(null);
    setNewComment('');
    setComments([]);
  };

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

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTaskId) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTaskId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ comment_text: newComment.trim() })
        }
      );

      const result = await response.json();

      if (result.success) {
        setNewComment('');

        // Refresh comments
        const refreshRes = await fetch(
          `${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTaskId}/comments`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setComments(refreshData.data);
        }

        // Update comment count
        updateTaskCommentCount(selectedTaskId, comments.length + 1);
      } else {
        alert(result.message || "Failed to add comment");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add comment. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading task insights...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Task Insights</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          Review all projects and tasks
        </p>
      </div>

      {/* Statistics Cards */}
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

      {/* Search Bar */}
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

      {/* Project Grouped Tasks */}
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
                        const commentCount = task.comments || 0;

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
                                    {task.dueDate || 'No due date'}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {task.assignee || 'Unassigned'}
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

      {/* Sidebar - Task Detail */}
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
                  <p className="text-xs font-semibold tracking-widest uppercase text-blue-100">Task Review</p>
                  <h2 className="text-2xl font-bold mt-2 leading-tight">{selectedTask.title}</h2>
                  <p className="text-sm text-blue-100 mt-1">Review and provide feedback</p>
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
                    <p className="font-bold text-lg text-slate-800 mt-1">{selectedTask.project || "Uncategorized"}</p>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium">Assignee</p>
                    <p className="font-semibold text-slate-800 mt-1">{selectedTask.assignee || "Unassigned"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium">Due Date</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {selectedTask.dueDate || "No due date"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Description</p>
                <p className="text-slate-600 leading-relaxed">{selectedTask.description || "No description provided."}</p>
              </div>

              {/* Progress */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-medium text-slate-700">Progress</span>
                  <span className="font-bold text-blue-600">{selectedTask.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${selectedTask.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Reviewer Comments ({comments.length})
                </p>
                <div className="space-y-4">
                  {loadingComments ? (
                    <p className="text-center py-8 text-slate-400">Loading comments...</p>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between mb-2">
                          <p className="font-semibold text-slate-800 text-sm">{comment.reviewer_name}</p>
                          <p className="text-xs text-slate-400">
                            {comment.created_at ? formatTimeAgo(comment.created_at) : ''}
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

            {/* Add Comment Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your review or comment..."
                  className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 rounded-2xl transition-all flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}