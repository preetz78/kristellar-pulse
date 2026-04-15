// src/pages/Manager/Projects.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  TrendingUp,
  Plus,
  X,
  Edit2,
  Trash2
} from "lucide-react";

import apiConfig from "../../config/apiConfig";

const ManagerProjects = () => {
  const navigate = useNavigate();
  
  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const managerName = user.name || "Manager";

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);   // For assignee dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Filter states
  const [selectedOrg, setSelectedOrg] = useState("All Organizations");
  const [activeFilter, setActiveFilter] = useState("All Projects");
  const [selectedProjectTitle, setSelectedProjectTitle] = useState("All Projects");

  // Add Project Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    projectId: "",
    title: "",
    description: "",
    projectManagerName: managerName,
    startDate: "",        // NEW: Start Date
    deadline: "",
    priority: "Medium",
    assignedEmployeeIds: []
  });

  // Edit Project Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectData, setEditProjectData] = useState({
    projectId: "",
    title: "",
    description: "",
    projectManagerName: "",
    startDate: "",        // NEW: Start Date
    deadline: "",
    priority: "Medium",
    assignedEmployeeIds: []
  });

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Fetch projects + employees
  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.success) {
        setProjects(result.data || []);
      } else {
        setError(result.message || "Failed to load projects");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/employees`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (result.success) {
        setEmployees(result.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityStyle = (priority) => {
    if (priority === "High") return "bg-red-100 text-red-700 border border-red-300";
    if (priority === "Medium") return "bg-amber-100 text-amber-700 border border-amber-300";
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  };

  // Get progress bar color based on percentage
  const getProgressColor = (progress) => {
    if (progress === 100) return "bg-gradient-to-r from-emerald-500 to-teal-500";
    if (progress >= 80) return "bg-gradient-to-r from-purple-500 to-violet-500";
    if (progress >= 40) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-gradient-to-r from-blue-600 to-cyan-500";
  };

  // Filtered projects (real-time filtering)
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by selected project title
    if (selectedProjectTitle !== "All Projects") {
      result = result.filter(p => p.name === selectedProjectTitle);
    }

    // Additional filters
    if (activeFilter === "In Progress") {
      result = result.filter(p => (p.progress || 0) < 100);
    } else if (activeFilter === "Completed") {
      result = result.filter(p => (p.progress || 0) === 100);
    } else if (activeFilter === "High Priority") {
      result = result.filter(p => p.priority === "High");
    }

    return result;
  }, [projects, selectedProjectTitle, activeFilter]);

  // Handle Add New Project
  const handleAddProject = async (e) => {
    e.preventDefault();
    
    if (!newProject.projectId || !newProject.title || !newProject.deadline) {
      alert("Please fill in Project ID, Project Name and Deadline");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: newProject.projectId,
          name: newProject.title,
          description: newProject.description,
          project_manager_name: newProject.projectManagerName,
          start_date: newProject.startDate || null,        // NEW
          deadline: newProject.deadline,
          priority: newProject.priority,
          assigned_employee_ids: newProject.assignedEmployeeIds
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("Project created successfully!");
        setShowAddModal(false);
        
        setNewProject({
          projectId: "",
          title: "",
          description: "",
          projectManagerName: managerName,
          startDate: "",           // NEW
          deadline: "",
          priority: "Medium",
          assignedEmployeeIds: []
        });

        fetchProjects();
      } else {
        alert(result.message || "Failed to create project");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    }
  };

  // Handle Edit Project
  const handleEditProject = async (e) => {
    e.preventDefault();
    
    if (!editProjectData.projectId || !editProjectData.title || !editProjectData.deadline) {
      alert("Please fill in Project ID, Project Name and Deadline");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects/${editingProject.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: editProjectData.projectId,
          name: editProjectData.title,
          description: editProjectData.description,
          project_manager_name: editProjectData.projectManagerName,
          start_date: editProjectData.startDate || null,        // NEW
          deadline: editProjectData.deadline,
          priority: editProjectData.priority,
          assigned_employee_ids: editProjectData.assignedEmployeeIds || []
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("Project updated successfully!");
        setShowEditModal(false);
        setEditingProject(null);
        fetchProjects();
      } else {
        alert(result.message || "Failed to update project");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    }
  };

  // Handle Delete Project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/projects/${projectToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.success) {
        alert("Project deleted successfully!");
        setShowDeleteModal(false);
        setProjectToDelete(null);
        fetchProjects();
      } else {
        alert(result.message || "Failed to delete project");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    }
  };

  // Open Edit Modal with pre-loaded assignees and start date
  const openEditModal = (project) => {
    setEditingProject(project);
    
    const existingAssignees = Array.isArray(project.assigned_employee_ids) 
      ? project.assigned_employee_ids 
      : [];

    setEditProjectData({
      projectId: project.project_id || "",
      title: project.name || "",
      description: project.description || "",
      projectManagerName: project.project_manager_name || managerName,
      startDate: project.start_date ? project.start_date.split('T')[0] : "",   // NEW
      deadline: project.deadline ? project.deadline.split('T')[0] : "",
      priority: project.priority || "Medium",
      assignedEmployeeIds: existingAssignees
    });
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  // Helper functions for multi-select assignee
  const addAssignee = (employeeId, isEdit = false) => {
    if (!employeeId) return;
    const id = Number(employeeId);

    if (isEdit) {
      if (editProjectData.assignedEmployeeIds.includes(id)) return;
      setEditProjectData({
        ...editProjectData,
        assignedEmployeeIds: [...editProjectData.assignedEmployeeIds, id]
      });
    } else {
      if (newProject.assignedEmployeeIds.includes(id)) return;
      setNewProject({
        ...newProject,
        assignedEmployeeIds: [...newProject.assignedEmployeeIds, id]
      });
    }
  };

  const removeAssignee = (employeeId, isEdit = false) => {
    const id = Number(employeeId);
    if (isEdit) {
      setEditProjectData({
        ...editProjectData,
        assignedEmployeeIds: editProjectData.assignedEmployeeIds.filter(idItem => idItem !== id)
      });
    } else {
      setNewProject({
        ...newProject,
        assignedEmployeeIds: newProject.assignedEmployeeIds.filter(idItem => idItem !== id)
      });
    }
  };

  const getEmployeeName = (id) => {
    if (!id) return "Unknown";
    const numericId = Number(id);
    const emp = employees.find(e => Number(e.id) === numericId);
    if (emp) return `${emp.employee_id || ''} - ${emp.name || 'No Name'}`.trim();
    return "Unknown Employee";
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Projects</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            My Assigned Projects
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-medium transition-all shadow-lg"
        >
          <Plus size={18} />
          Add Project
        </button>
      </div>

      {/* Compact Summary Stats */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">My Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter((p) => (p.progress || 0) < 100).length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter((p) => p.priority === "High").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 bg-blue-50 rounded-2xl p-2 w-fit">
          <div className="relative">
            <select
              value={selectedProjectTitle}
              onChange={(e) => {
                setSelectedProjectTitle(e.target.value);
                if (e.target.value !== "All Projects") {
                  setActiveFilter("All Projects");
                }
              }}
              className="bg-white border-0 text-blue-700 font-medium px-6 py-3 rounded-[14px] focus:outline-none cursor-pointer appearance-none pr-10 min-w-[180px]"
            >
              <option value="All Projects">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm">▼</div>
          </div>

          <button
            onClick={() => {
              setActiveFilter("In Progress");
              setSelectedProjectTitle("All Projects");
            }}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "In Progress" && selectedProjectTitle === "All Projects"
                ? "bg-white shadow-sm text-blue-700" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            In Progress
          </button>

          <button
            onClick={() => {
              setActiveFilter("Completed");
              setSelectedProjectTitle("All Projects");
            }}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "Completed" && selectedProjectTitle === "All Projects"
                ? "bg-white shadow-sm text-blue-700" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => {
              setActiveFilter("High Priority");
              setSelectedProjectTitle("All Projects");
            }}
            className={`px-6 py-3 text-sm font-medium transition-all rounded-[14px] ${
              activeFilter === "High Priority" && selectedProjectTitle === "All Projects"
                ? "bg-white shadow-sm text-blue-700" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            High Priority
          </button>
        </div>
      </div>

      {/* PROJECT CARDS GRID - With Dynamic Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, idx) => {
          const progress = project.progress || 0;
          const totalTasks = project.total_tasks || 0;
          const completedTasks = project.completed_tasks || 0;
          const isCompleted = progress === 100 || completedTasks === totalTasks;

          return (
            <div
              key={project.id}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(`/manager/projects/${project.id}`)}
              className={`relative group bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-2xl cursor-pointer ${
                hoveredCard === idx ? "shadow-2xl -translate-y-1 border-blue-400" : ""
              }`}
            >
              <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-500"></div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">ID: {project.project_id}</p>
                  </div>

                  <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ml-4 ${getPriorityStyle(project.priority || "Medium")}`}>
                    {project.priority || "Medium"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <p className="text-xs text-gray-500 font-medium">Project Manager</p>
                    <p className="font-semibold text-gray-900 mt-1 text-sm">{project.project_manager_name}</p>
                  </div>

                  <div className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users size={15} className="text-blue-600" />
                      <p className="text-xs text-gray-500 font-medium">Team Size</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{project.team_size} Members</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6 pb-6 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deadline</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <span className={`px-4 py-1.5 text-xs font-semibold rounded-xl border ${
                    isCompleted 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>
                    {isCompleted ? "Completed" : "In Progress"}
                  </span>
                </div>

                {/* Dynamic Progress Bar with Different Colors */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">Progress</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                  </div>

                  <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {completedTasks} of {totalTasks} tasks completed
                  </div>
                </div>
              </div>

              {/* Edit & Delete Icons */}
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    openEditModal(project); 
                  }}
                  className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300"
                  title="Edit Project"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    openDeleteModal(project); 
                  }}
                  className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300"
                  title="Delete Project"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====================== ADD PROJECT MODAL ====================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 text-white flex-shrink-0">
              <h2 className="text-xl font-semibold">Add New Project</h2>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project ID</label>
                <input
                  type="text"
                  value={newProject.projectId}
                  onChange={(e) => setNewProject({...newProject, projectId: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Aero-123 or PRJ-005"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="e.g. AI Chatbot Development"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 h-28 resize-y"
                  placeholder="Brief description of the project..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Manager Name</label>
                <input
                  type="text"
                  value={newProject.projectManagerName}
                  onChange={(e) => setNewProject({...newProject, projectManagerName: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* NEW: Start Date Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignees</label>
                
                {newProject.assignedEmployeeIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded-2xl">
                    {newProject.assignedEmployeeIds.map((id) => (
                      <div
                        key={id}
                        className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-4 py-1.5 rounded-2xl transition-colors group"
                      >
                        <span className="font-medium">{getEmployeeName(id)}</span>
                        <button
                          type="button"
                          onClick={() => removeAssignee(id)}
                          className="text-blue-500 hover:text-blue-700 ml-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addAssignee(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- Select Employee to Assign --</option>
                  {employees
                    .filter(emp => !newProject.assignedEmployeeIds.includes(Number(emp.id)))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_id} - {emp.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 flex gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProject}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== EDIT PROJECT MODAL ====================== */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
              <h2 className="text-xl font-semibold">Edit Project</h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditingProject(null); }}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project ID</label>
                <input
                  type="text"
                  value={editProjectData.projectId}
                  onChange={(e) => setEditProjectData({...editProjectData, projectId: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={editProjectData.title}
                  onChange={(e) => setEditProjectData({...editProjectData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={editProjectData.description}
                  onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 h-32 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Manager Name</label>
                <input
                  type="text"
                  value={editProjectData.projectManagerName}
                  onChange={(e) => setEditProjectData({...editProjectData, projectManagerName: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* NEW: Start Date Field in Edit Modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={editProjectData.startDate}
                  onChange={(e) => setEditProjectData({...editProjectData, startDate: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignees</label>
                
                {editProjectData.assignedEmployeeIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-2xl">
                    {editProjectData.assignedEmployeeIds.map((id) => (
                      <div
                        key={id}
                        className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-4 py-1.5 rounded-2xl transition-colors group"
                      >
                        <span className="font-medium">{getEmployeeName(id)}</span>
                        <button
                          type="button"
                          onClick={() => removeAssignee(id, true)}
                          className="text-blue-500 hover:text-blue-700 ml-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addAssignee(e.target.value, true);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- Select Employee to Assign --</option>
                  {employees
                    .filter(emp => !editProjectData.assignedEmployeeIds.includes(Number(emp.id)))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_id} - {emp.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                  <input
                    type="date"
                    value={editProjectData.deadline}
                    onChange={(e) => setEditProjectData({...editProjectData, deadline: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={editProjectData.priority}
                    onChange={(e) => setEditProjectData({...editProjectData, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 flex gap-4 flex-shrink-0 border-t">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingProject(null); }}
                className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditProject}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== DELETE CONFIRMATION MODAL ====================== */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 size={32} className="text-red-600" />
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Delete Project?</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>? 
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition"
                >
                  Yes, Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProjects;