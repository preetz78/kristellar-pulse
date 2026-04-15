// src/pages/Manager/TaskInsights.jsx
import { useState, useEffect } from "react";
import { Search, Clock, User, MessageSquare, X, Send } from "lucide-react";
import apiConfig from "../../config/apiConfig";

const ManagerTaskInsights = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Fetch real tasks for manager's projects with reviewer comments
  useEffect(() => {
    const fetchTaskInsights = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/task-insights`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();

        if (result.success) {
          const normalizedTasks = (result.data || []).map((task) => {
            let comments = [];

            if (Array.isArray(task.comments)) {
              comments = task.comments.filter((c) => c !== null && c !== undefined);
            } else if (typeof task.comments === 'string') {
              try {
                const parsedComments = JSON.parse(task.comments);
                comments = Array.isArray(parsedComments)
                  ? parsedComments.filter((c) => c !== null && c !== undefined)
                  : [];
              } catch {
                comments = [];
              }
            }

            return {
              ...task,
              comments,
              // Ensure progress is 100% if task is Completed
              progress: task.status === "Completed" ? 100 : (task.progress || 0)
            };
          });
          setTasks(normalizedTasks);
        } else {
          setError(result.message || "Failed to load task insights");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskInsights();
  }, []);

  // Filter and group tasks by project
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.project_name && task.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const projectName = task.project_name || "Uncategorized";
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(task);
    return acc;
  }, {});

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleOpenTask = (id) => {
    setSelectedTaskId(id);
  };

  const handleCloseSidebar = () => {
    setSelectedTaskId(null);
    setNewComment('');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    
    alert("Comment added successfully! (Backend integration coming soon)");
    setNewComment('');
  };

  const getStatusColor = (status) => {
    if (status === "Completed") return "bg-emerald-100 text-emerald-700";
    if (status === "In Progress") return "bg-blue-100 text-blue-700";
    if (status === "Delayed") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getProgressColor = (status, progress) => {
    if (status === "Completed") return "bg-emerald-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Task Insights...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Projects Performance & Reviews
          </p>
        </div>

        {/* Search */}
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

      {/* Task List - Grouped by Project */}
      <div className="space-y-8">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No tasks found for your projects yet.
          </div>
        ) : (
          Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
            <section key={projectName} className="mb-8">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                <h2 className="uppercase text-sm font-bold tracking-widest text-slate-500">
                  PROJECT: {projectName}
                </h2>
              </div>

              <div className="space-y-3">
                {projectTasks.map((task) => {
                  const displayProgress = task.status === "Completed" ? 100 : (task.progress || 0);

                  return (
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
                              {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : 'No due date'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              {task.assignee_name || 'Unassigned'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4" />
                              {task.comment_count || 0} comments
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <span className={`px-4 py-1.5 text-xs font-semibold rounded-2xl ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getProgressColor(task.status, displayProgress)}`}
                              style={{ width: `${displayProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Right Sidebar - Reviewer Comments */}
      {selectedTaskId && selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div 
            className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-medium text-blue-600">TASK DETAIL</p>
                <h2 className="font-bold text-xl text-slate-900 mt-1">{selectedTask.title}</h2>
              </div>
              <button 
                onClick={handleCloseSidebar}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">Project</p>
                  <p className="font-semibold text-slate-800">{selectedTask.project_name}</p>
                </div>
                <span className={`px-4 py-1.5 text-xs font-semibold rounded-2xl ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold text-blue-600">
                    {selectedTask.status === "Completed" ? 100 : (selectedTask.progress || 0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${getProgressColor(selectedTask.status, selectedTask.status === "Completed" ? 100 : (selectedTask.progress || 0))}`}
                    style={{ width: `${selectedTask.status === "Completed" ? 100 : (selectedTask.progress || 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">DESCRIPTION</p>
                <p className="text-slate-600 leading-relaxed">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> REVIEWS & COMMENTS
                </p>
                <div className="space-y-4">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">
                            {comment.reviewer_name || "Reviewer"}
                          </span>
                          <span className="text-slate-400">
                            {comment.created_at 
                              ? new Date(comment.created_at).toLocaleString() 
                              : "Just now"}
                          </span>
                        </div>
                        <p className="mt-2 text-slate-600 text-sm">{comment.comment_text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No comments from reviewer yet.
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
};

export default ManagerTaskInsights;