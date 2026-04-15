// src/pages/Admin/TaskInsights.jsx
import { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  User, 
  MessageSquare, 
  X 
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
      {status}
    </span>
  );
};

export default function TaskInsights() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/tasks`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (result.success) {
          // Ensure comments is always an array and properly handle all data types
          const processedTasks = (result.data || []).map(task => {
            let comments = [];
            
            // Handle different comment data formats
            if (Array.isArray(task.comments)) {
              comments = task.comments.filter(c => c !== null && c !== undefined);
            } else if (typeof task.comments === 'string') {
              // If it's a JSON string, parse it
              try {
                const parsed = JSON.parse(task.comments);
                comments = Array.isArray(parsed) ? parsed.filter(c => c !== null) : [];
              } catch {
                comments = [];
              }
            } else if (task.comments === null || task.comments === undefined) {
              comments = [];
            }
            
            return {
              ...task,
              comments: comments
            };
          });
          setTasks(processedTasks);
        } else {
          setError(result.message || "Failed to load tasks");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const projectName = task.project_name || "Uncategorized";
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(task);
    return acc;
  }, {});

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleOpenTask = (id) => setSelectedTaskId(id);
  const handleCloseSidebar = () => setSelectedTaskId(null);

  if (loading) {
    return <div className="p-6 text-center">Loading task insights...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-2">   
        <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          Project performance and task reviews
        </p>
      </div>

      <div className="flex justify-end mb-8">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search tasks or projects..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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
                {projectTasks.map((task) => {
                  // Calculate comment count with robust null checking
                  let commentCount = 0;
                  if (Array.isArray(task.comments) && task.comments.length > 0) {
                    // Filter out any null/undefined comments
                    commentCount = task.comments.filter(c => c !== null && c !== undefined).length;
                  }

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
                              {task.due_date 
                                ? new Date(task.due_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) 
                                : 'No due date'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              {task.assignee_name || 'Unassigned'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4" />
                              {commentCount}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <StatusBadge status={task.status} />
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

      {/* Sidebar */}
      {selectedTaskId && selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden" 
               onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-medium text-blue-600">TASK DETAIL</p>
                <h2 className="font-bold text-xl text-slate-900 mt-1">{selectedTask.title}</h2>
              </div>
              <button onClick={handleCloseSidebar} className="p-2 hover:bg-slate-200 rounded-xl">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">Project</p>
                  <p className="font-semibold text-slate-800">{selectedTask.project_name}</p>
                </div>
                <StatusBadge status={selectedTask.status} />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">DESCRIPTION</p>
                <p className="text-slate-600 leading-relaxed">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> REVIEWER COMMENTS
                </p>
                <div className="space-y-4">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{comment.reviewer_name}</span>
                          <span className="text-slate-400">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString('en-GB') : ''}
                          </span>
                        </div>
                        <p className="mt-2 text-slate-600 text-sm">{comment.comment_text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No reviewer comments yet.
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