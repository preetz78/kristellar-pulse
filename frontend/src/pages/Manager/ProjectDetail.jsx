// src/pages/Manager/ProjectDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  X,
  User ,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ListTodo
} from "lucide-react";

import apiConfig from "../../config/apiConfig";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectEmployees, setProjectEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: ""
  });

  // Fetch Project Details
  useEffect(() => {
    const fetchProjectDetail = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects/${projectId}`, {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        const result = await response.json();
        if (result.success) setProject(result.data);
        else setError(result.message || "Failed to load project");
      } catch (err) {
        console.error(err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetail();
  }, [projectId]);

  // Fetch Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) return;
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects/${projectId}/tasks`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) setTasks(result.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (project) fetchTasks();
  }, [project, projectId]);

  // Fetch Assigned Employees for Dropdown
  useEffect(() => {
    const fetchProjectEmployees = async () => {
      if (!projectId) return;
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects/${projectId}/employees`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) setProjectEmployees(result.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (project) fetchProjectEmployees();
  }, [project, projectId]);

  // Create / Update Task - FIXED DATE HANDLING
  const handleAddOrUpdateTask = async (e) => {
    e.preventDefault();

    if (!newTask.title || !newTask.assignee || !newTask.dueDate) {
      toast.error("Title, Assignee, and Due Date are required");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      
      const isEdit = !!editingTask;
      const url = isEdit 
        ? `${apiConfig.API_BASE_URL}/api/manager/tasks/${editingTask.id}` 
        : `${apiConfig.API_BASE_URL}/api/manager/projects/${projectId}/tasks`;

      const method = isEdit ? "PUT" : "POST";

      // Clean due_date - ensure only YYYY-MM-DD is sent
      let cleanDueDate = null;
      if (newTask.dueDate) {
        cleanDueDate = newTask.dueDate.includes('T') 
          ? newTask.dueDate.split('T')[0] 
          : newTask.dueDate;
      }

      const payload = {
        project_id: parseInt(projectId),
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        assigned_to: parseInt(newTask.assignee),
        due_date: cleanDueDate
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEdit ? "Task updated successfully!" : "Task created successfully!");

        // Refresh tasks list
        const refreshRes = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects/${projectId}/tasks`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) setTasks(refreshData.data);

        // Reset form
        setShowAddModal(false);
        setEditingTask(null);
        setNewTask({ 
          title: "", 
          description: "", 
          assignee: "", 
          dueDate: "" 
        });
      } else {
        toast.error(result.message || "Failed to save task");
      }
    } catch (err) {
      console.error("Save task error:", err);
      toast.error("Failed to connect to server. Please check if backend is running.");
    }
  };

  const openEditTask = (task) => {
    let dueDateValue = "";

    if (task.due_date) {
      // Handle both YYYY-MM-DD and full ISO format from backend
      dueDateValue = task.due_date.includes('T') 
        ? task.due_date.split('T')[0] 
        : task.due_date;
    }

    setEditingTask(task);
    setNewTask({ 
      title: task.title || "",
      description: task.description || "",
      assignee: task.assigned_to?.toString() || "",
      dueDate: dueDateValue
    });
    setShowAddModal(true);
  };

  const openDeleteModal = (task) => setTaskToDelete(task);

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/tasks/${taskToDelete.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        setTasks(tasks.filter(t => t.id !== taskToDelete.id));
        setTaskToDelete(null);
        toast.success("Task deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete task");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  const cancelDelete = () => setTaskToDelete(null);
  const selectedTask =
  tasks.find(
    task => task.id === selectedTaskId
  );

  const handleOpenTask = (taskId) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseSidebar = () => {
    setSelectedTaskId(null);
  };

  if (loading) return <div className="p-6 text-center">Loading project details...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!project) return <div className="p-6 text-center">Project not found</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="
              group
              mb-4
              flex
              items-center
              gap-2
              px-3
              py-2
              rounded-xl
              text-blue-600
              font-medium
              transition-all
              duration-200
              hover:text-blue-700
              hover:bg-blue-50
            "
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>

            <span>
              Back to Projects
            </span>
          </button>
          <h1 className="text-3xl font-semibold text-blue-700">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-medium"
        >
          <Plus size={18} /> Add New Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const dueDate = task.due_date ? new Date(task.due_date) : null;
          const isOverdue = dueDate && dueDate < new Date() && task.status !== "Completed";

          return (
            <div
              key={task.id}
              onClick={() => handleOpenTask(task.id)}
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                hover:border-blue-300
                hover:shadow-md
                transition-all
                group
                cursor-pointer
              "
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} />
                      {dueDate ? dueDate.toLocaleDateString('en-GB') : 'No due date'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={16} />
                      {task.assignee_name || 'Unassigned'}
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className={`px-4 py-1 text-xs font-medium rounded-full ${
                    task.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                    isOverdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {isOverdue ? "Delayed" : task.status}
                  </span>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        openEditTask(task); 
                      }} 
                      className="p-2 hover:bg-blue-100 rounded-xl text-blue-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        openDeleteModal(task); 
                      }} 
                      className="p-2 hover:bg-red-100 rounded-xl text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h2 className="text-xl font-semibold">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h2>
              <button 
                onClick={() => { 
                  setShowAddModal(false); 
                  setEditingTask(null); 
                }} 
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateTask} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input 
                  type="text" 
                  value={newTask.title} 
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                  className="w-full px-5 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                <select 
                  value={newTask.assignee} 
                  onChange={(e) => setNewTask({...newTask, assignee: e.target.value})} 
                  className="w-full px-5 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 bg-white" 
                  required
                >
                  <option value="">-- Select Assignee --</option>
                  {projectEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_id} - {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input 
                  type="date" 
                  value={newTask.dueDate} 
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} 
                  className="w-full px-5 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 required" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  value={newTask.description} 
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})} 
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl h-28 resize-y focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowAddModal(false); 
                    setEditingTask(null); 
                  }} 
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Delete Task?</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete <strong>"{taskToDelete.title}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={cancelDelete} 
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700"
                >
                  Yes, Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Sidebar */}
      {selectedTaskId && selectedTask && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            backdrop-blur-sm
            z-50
            flex
            justify-end
          "
          onClick={handleCloseSidebar}
        >

          <div
            className="
              bg-gradient-to-b
              from-white
              to-slate-50
              w-full
              max-w-xl
              h-full
              shadow-2xl
              flex
              flex-col
              overflow-hidden
              animate-slideInRight
            "
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}

            <div
              className="
                p-6
                bg-gradient-to-r
                from-blue-600
                via-indigo-600
                to-purple-600
                sticky
                top-0
                z-10
                shadow-lg
                text-white
              "
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="
                    text-xs
                    font-semibold
                    tracking-widest
                    uppercase
                    text-blue-100
                  ">
                    Task Details
                  </p>

                  <h2 className="
                    text-2xl
                    font-bold
                    mt-2
                    leading-tight
                  ">
                    {selectedTask.title}
                  </h2>

                  <p className="text-sm text-blue-100 mt-1">
                    Created for project execution and tracking
                  </p>

                </div>

                <button
                  onClick={handleCloseSidebar}
                  className="
                    p-2
                    rounded-xl
                    bg-white/20
                    hover:bg-white/30
                    transition-all
                  "
                >
                  <X size={24} />
                </button>

              </div>
            </div>

            {/* BODY */}

            <div className="
              flex-1
              overflow-y-auto
              p-6
              space-y-6
            ">

              {/* PROJECT INFO */}

              <div className="
                bg-white
                rounded-2xl
                p-5
                shadow-sm
                border
                border-slate-200
              ">

                <div className="
                  flex
                  justify-between
                  items-center
                  mb-4
                ">

                  <div>

                    <p className="
                      text-xs
                      text-slate-500
                      font-medium
                    ">
                      Project Name
                    </p>

                    <p className="
                      font-bold
                      text-lg
                      text-slate-800
                      mt-1
                    ">
                      {project.name}
                    </p>

                  </div>

                  <span
                    className={`
                      px-4
                      py-1
                      text-xs
                      font-medium
                      rounded-full

                      ${
                        selectedTask.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"

                          : selectedTask.status === "Delayed"
                          ? "bg-red-100 text-red-700"

                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                  >
                    {selectedTask.status}
                  </span>

                </div>

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-4
                  mt-4
                ">

                  <div className="
                    bg-slate-50
                    rounded-xl
                    p-4
                  ">

                    <p className="
                      text-xs
                      text-slate-500
                      font-medium
                    ">
                      Assignee
                    </p>

                    <p className="
                      font-semibold
                      text-slate-800
                      mt-1
                    ">
                      {selectedTask.assignee_name || "Unassigned"}
                    </p>

                  </div>

                  <div className="
                    bg-slate-50
                    rounded-xl
                    p-4
                  ">

                    <p className="
                      text-xs
                      text-slate-500
                      font-medium
                    ">
                      Due Date
                    </p>

                    <p className="
                      font-semibold
                      text-slate-800
                      mt-1
                    ">

                      {
                        selectedTask.due_date

                          ? new Date(
                              selectedTask.due_date
                            ).toLocaleDateString(
                              "en-GB",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              }
                            )

                          : "No due date"
                      }

                    </p>

                  </div>

                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="
                bg-white
                rounded-2xl
                p-5
                shadow-sm
                border
                border-slate-200
              ">

                <p className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-3
                  uppercase
                  tracking-wide
                ">
                  Description
                </p>

                <p className="
                  text-slate-600
                  leading-relaxed
                ">
                  {selectedTask.description || "No description provided."}
                </p>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetail;