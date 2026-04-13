// src/pages/Reviewer/TaskInsights.jsx
import { useState, useEffect } from 'react';
import apiConfig from '../../config/apiConfig';
import { 
  Search, 
  Clock, 
  User, 
  MessageSquare, 
  X, 
  Send 
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Delayed': 'bg-red-100 text-red-700 border border-red-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
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

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Fetch all tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
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
        const token = localStorage.getItem('token');
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

  // Update comment count in the main tasks list after adding a comment
  const updateTaskCommentCount = (taskId, newCount) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, comments: newCount } : task
      )
    );
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.project]) acc[task.project] = [];
    acc[task.project].push(task);
    return acc;
  }, {});

  const handleOpenTask = (id) => {
    setSelectedTaskId(id);
    setNewComment('');
  };

  const handleCloseSidebar = () => {
    setSelectedTaskId(null);
    setNewComment('');
    setComments([]);
  };

  // Add comment and update count
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTaskId) return;

    try {
      const token = localStorage.getItem('token');
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

        // Refresh comments in sidebar
        const refreshRes = await fetch(
          `${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTaskId}/comments`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setComments(refreshData.data);
        }

        // Update comment count on the main task card
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
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          Review all projects and tasks
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end mb-8">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search tasks or projects..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Task List - Now shows real comment count */}
      <div className="space-y-4">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12 text-gray-400">No tasks found</div>
        ) : (
          Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
            <section key={projectName} className="mb-10">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                <h2 className="uppercase text-sm font-bold tracking-widest text-slate-500">
                  PROJECT: {projectName}
                </h2>
              </div>

              <div className="space-y-3">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTask(task.id)}
                    className="group bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 transition-all cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-5 mt-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {task.dueDate}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {task.assignee}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            {task.comments || 0}   {/* Real comment count */}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={task.status} />
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${task.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Right Sidebar with Real Comments */}
      {selectedTaskId && selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div 
            className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-medium text-blue-600">TASK REVIEW</p>
                <h2 className="font-bold text-xl text-slate-900 mt-1">{selectedTask.title}</h2>
              </div>
              <button onClick={handleCloseSidebar} className="p-2 hover:bg-slate-200 rounded-xl">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Project Info */}
              <div>
                <p className="text-xs text-slate-500">Project</p>
                <p className="font-semibold text-slate-800">{selectedTask.project}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Project Manager</p>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedTask.projectManager || 'No Manager Assigned'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Assigned To</p>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedTask.assignee || 'Unassigned'}
                </p>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold text-blue-600">{selectedTask.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${selectedTask.progress}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">DESCRIPTION</p>
                <p className="text-slate-600 leading-relaxed">{selectedTask.description}</p>
              </div>

              {/* Comments Section */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> REVIEWS & COMMENTS
                </p>

                <div className="space-y-4 mb-6">
                  {loadingComments ? (
                    <p className="text-center text-gray-500 py-4">Loading comments...</p>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{comment.reviewer_name}</span>
                          <span className="text-slate-400">{formatTimeAgo(comment.created_at)}</span>
                        </div>
                        <p className="mt-2 text-slate-600 text-sm">{comment.comment_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-white">
              <form onSubmit={handleAddComment} className="flex gap-2">
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
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 rounded-2xl transition-all"
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