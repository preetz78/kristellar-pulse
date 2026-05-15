// src/pages/Manager/TaskInsights.jsx
import { useState, useEffect } from 'react';
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
      {status}
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

export default function TaskInsights() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  // Fetch manager's task insights
  useEffect(() => {
    const fetchTaskInsights = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/task-insights`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

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
          setError(null);
        } else {
          setError(result.message || "Failed to load task insights");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to connect to server. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskInsights();
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const delayedTasks = tasks.filter(t => t.status === 'Delayed').length;

    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      delayed: delayedTasks
    };
  };

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
  const stats = calculateStats();

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
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading task insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">   
        <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          Project performance and task reviews
        </p>
      </div>

      {/* Stat Cards */}
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

      {/* Projects List */}
      <div className="space-y-4">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-slate-200">
            <ListTodo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm mt-1">Your assigned projects will appear here</p>
          </div>
        ) : (
          Object.entries(groupedTasks).map(([projectName, projectTasks], projectIndex) => {
            const projectColor = getProjectColor(projectIndex);
            const isExpanded = expandedProjects.has(projectName);
            const inProgressCount = projectTasks.filter(t => t.status === 'In Progress').length;
            const completedCount = projectTasks.filter(t => t.status === 'Completed').length;
            const delayedCount = projectTasks.filter(t => t.status === 'Delayed').length;

            return (
              <div key={projectName} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Project Header */}
                <button
                  onClick={() => toggleProjectExpanded(projectName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-1 h-12 rounded-full ${getProgressBarColor(projectColor)}`}></div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900">{projectName}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {projectTasks.length} TASKS 
                        {inProgressCount > 0 && ` • ${inProgressCount} IN PROGRESS`}
                        {delayedCount > 0 && ` • ${delayedCount} DELAYED`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressBarColor(projectColor)} transition-all`}
                        style={{ width: `${projectTasks.length > 0 ? (completedCount / projectTasks.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <ChevronDown 
                      size={20} 
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Tasks List */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <div className="px-6 py-4 space-y-3 bg-slate-50 max-h-96 overflow-y-auto">
                      {projectTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p>No tasks in this project</p>
                        </div>
                      ) : (
                        projectTasks.map((task) => {
                          // Calculate comment count with robust null checking
                          let commentCount = 0;
                          if (Array.isArray(task.comments) && task.comments.length > 0) {
                            commentCount = task.comments.filter(c => c !== null && c !== undefined).length;
                          }

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
                                  <div className="flex items-center gap-6 mt-3 text-xs text-slate-500 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                      {task.due_date 
                                        ? new Date(task.due_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) 
                                        : 'No due date'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                                      {task.assignee_name || 'Unassigned'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                      {commentCount}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                  <StatusBadge status={task.status} />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar - Task Details */}
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
                  <p className="text-sm text-blue-100 mt-1">Review and manage task progress</p>
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
                        <p className="text-sm text-slate-600 leading-relaxed">{comment.comment}</p>
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