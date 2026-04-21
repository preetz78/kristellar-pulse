// src/pages/Employee/TaskInsights.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  X 
} from "lucide-react";
import apiConfig from "../../config/apiConfig";

const EmployeeTaskInsights = () => {
  const location = useLocation();   // ← To read filter from Dashboard

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  // Filter from Dashboard (In Progress or Completed)
  const [activeTaskFilter, setActiveTaskFilter] = useState("All");

  // Apply filter coming from Dashboard
  useEffect(() => {
    const filterFromDashboard = location.state?.filter;
    if (filterFromDashboard) {
      setActiveTaskFilter(filterFromDashboard);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("token");
        if (!token) {
          setError("Please login again to view your tasks.");
          setTasks([]);
          return;
        }

        const apiUrl = `${apiConfig.API_BASE_URL}/api/employee/tasks`;
        console.log("🔄 Fetching tasks from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          throw new Error("Server returned HTML instead of JSON.");
        }

        if (!response.ok) {
          throw new Error(result?.message || `HTTP Error ${response.status}`);
        }

        if (result.success) {
          let normalizedTasks = (result.data || []).map((task) => ({
            ...task,
            comments: Array.isArray(task.comments) ? task.comments : [],
          }));

          // Apply filter from Dashboard if present
          if (activeTaskFilter === "In Progress") {
            normalizedTasks = normalizedTasks.filter(task => task.status !== "Completed");
          } else if (activeTaskFilter === "Completed") {
            normalizedTasks = normalizedTasks.filter(task => task.status === "Completed");
          }

          setTasks(normalizedTasks);

          if (normalizedTasks.length > 0) {
            setSelectedTask(normalizedTasks[0]);
            setShowSidebar(true);
          } else {
            setSelectedTask(null);
            setShowSidebar(false);
          }
        } else {
          setError(result.message || "Failed to load your tasks");
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError(err.message || "Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [activeTaskFilter]);   // Re-fetch when filter changes

  // Dynamic progress
  const getProgress = (status) => {
    if (status === "Completed") return 100;
    if (status === "Delayed") return 0;
    return 50;
  };

  // Handle checkbox (mark as completed)
  const handleStatusChange = async (taskId, isChecked) => {
    if (!isChecked) return;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `${apiConfig.API_BASE_URL}/api/employee/tasks/${taskId}/complete`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status: "Completed" } : task
          )
        );

        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => ({ ...prev, status: "Completed" }));
        }
      } else {
        alert("Failed to update task status");
      }
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to mark task as completed.");
    }
  };

  // Click any task → open sidebar with comments
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  const getStatusColor = (status) => {
    if (status === "Completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Delayed") return "bg-red-100 text-red-700 border-red-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getStatusIcon = (status) => {
    if (status === "Completed") return <CheckCircle size={18} className="text-emerald-600" />;
    if (status === "Delayed") return <AlertTriangle size={18} className="text-red-600" />;
    return <Clock size={18} className="text-blue-600" />;
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading your tasks...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
          <p className="text-gray-600 mt-1">
            {activeTaskFilter === "In Progress" && "Active / In Progress Tasks"}
            {activeTaskFilter === "Completed" && "Completed Tasks"}
            {activeTaskFilter === "All" && "Your assigned tasks"}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {activeTaskFilter === "In Progress" && "No active tasks at the moment."}
                {activeTaskFilter === "Completed" && "No completed tasks yet."}
                {activeTaskFilter === "All" && "No tasks assigned to you yet."}
              </div>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === "Completed";
                const overdue = isOverdue(task.due_date) && !isCompleted;
                const progress = getProgress(task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
                      selectedTask?.id === task.id && showSidebar 
                        ? "border-blue-500 shadow-md" 
                        : "border-gray-200 hover:border-blue-200"
                    } ${isCompleted ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => handleStatusChange(task.id, e.target.checked)}
                          disabled={isCompleted}
                          className="mt-1 w-5 h-5 accent-emerald-600"
                        />

                        <div>
                          <h3 className={`font-semibold ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {task.project_name || "No Project"}
                          </p>
                        </div>
                      </div>

                      <div className={`px-4 py-1.5 text-xs font-medium rounded-xl border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {task.due_date 
                            ? new Date(task.due_date).toLocaleDateString('en-GB') 
                            : "No due date"}
                        </span>
                        {overdue && (
                          <span className="text-red-600 text-xs font-medium ml-2">• Overdue</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="font-medium">{progress}%</span>
                      </div>
                    </div>

                    <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCompleted ? "bg-emerald-600" : "bg-blue-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar - Shows Reviewer Comments */}
        {showSidebar && selectedTask && (
          <div className="w-96 bg-white border border-gray-200 rounded-3xl p-6 shadow-lg relative">
            <button 
              onClick={closeSidebar} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={22} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <MessageSquare size={22} className="text-blue-600" />
              <h2 className="text-xl font-semibold">Reviewer Comments</h2>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-lg">{selectedTask.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedTask.project_name}</p>
            </div>

            <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {selectedTask.comments && selectedTask.comments.length > 0 ? (
                selectedTask.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span className="font-medium">
                        {comment.reviewer_name || "Reviewer"}
                      </span>
                      <span>
                        {comment.created_at 
                          ? new Date(comment.created_at).toLocaleString() 
                          : "Just now"}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {comment.comment_text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No comments from reviewer yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTaskInsights;