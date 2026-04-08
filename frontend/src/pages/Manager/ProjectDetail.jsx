// src/pages/Manager/ProjectDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  X,
  User 
} from "lucide-react";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);   // New state for delete modal

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    status: "In Progress"
  });

  // Mock data
  useEffect(() => {
    const mockProject = {
      id: projectId || "1",
      name: "Pulse CRM",
      description: "Customer Relationship Management System"
    };

    const mockTasks = [
      {
        id: 1,
        title: "Design Dashboard UI",
        description: "Create modern admin dashboard with dark/light mode",
        assignee: "Rahul Sharma",
        dueDate: "2026-04-15",
        status: "In Progress"
      },
      {
        id: 2,
        title: "API Integration",
        description: "Connect frontend with backend REST APIs",
        assignee: "Sarah Connor",
        dueDate: "2026-04-20",
        status: "In Progress"
      },
      {
        id: 3,
        title: "User Authentication",
        description: "Implement login, register and password reset",
        assignee: "Alex Kumar",
        dueDate: "2026-04-10",
        status: "Completed"
      }
    ];

    setProject(mockProject);
    setTasks(mockTasks);
  }, [projectId]);

  const handleAddOrUpdateTask = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignee) {
      alert("Title and Assignee are required");
      return;
    }

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...newTask, id: editingTask.id } : t));
    } else {
      const newId = Date.now();
      setTasks([...tasks, { ...newTask, id: newId }]);
    }

    setShowAddModal(false);
    setEditingTask(null);
    setNewTask({ title: "", description: "", assignee: "", dueDate: "", status: "In Progress" });
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setNewTask({ ...task });
    setShowAddModal(true);
  };

  const openDeleteModal = (task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(t => 
      t.id === id 
        ? { ...t, status: t.status === "Completed" ? "In Progress" : "Completed" }
        : t
    ));
  };

  if (!project) return <div className="p-6 text-center">Loading project...</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-8 flex items-center gap-1"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-semibold text-blue-700">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-medium"
        >
          <Plus size={18} />
          Add New Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={task.status === "Completed"}
                    onChange={() => toggleComplete(task.id)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                  <h3 className={`text-lg font-medium ${task.status === "Completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                  </h3>
                </div>

                <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    {task.dueDate}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={16} />
                    {task.assignee}
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
                  task.status === "Completed" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {task.status}
                </span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
                    className="p-2 hover:bg-blue-100 rounded-xl text-blue-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDeleteModal(task); }}
                    className="p-2 hover:bg-red-100 rounded-xl text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl h-24 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700"
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
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition"
                >
                  Yes, Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;