// src/pages/Admin/Projects.jsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  TrendingUp,
  Search,
  Plus,
  X,
  Edit2,
  Trash2
} from "lucide-react";

import apiConfig from "../../config/apiConfig";

const Projects = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hoveredCard, setHoveredCard] = useState(null);

  // Filter states
  const [activeFilter, setActiveFilter] = useState("All Projects");
  const [selectedProjectTitle, setSelectedProjectTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentManagers, setDepartmentManagers] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const [formData, setFormData] = useState({
    project_id: "",
    name: "",
    description: "",
    department_id: "",
    manager_id: "",
    project_manager_name: "",
    start_date: "",
    deadline: "",
    priority: "Medium"
  });

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [editSelectedEmployees, setEditSelectedEmployees] = useState([]);

  // Apply filter when coming from Dashboard
  useEffect(() => {
    const incomingFilter = location.state?.activeFilter;
    if (incomingFilter) {
      setActiveFilter(incomingFilter);
      if (incomingFilter !== "All Projects") {
        setSelectedProjectTitle("");
        setSearchTerm("");
      }
    }
  }, [location.state]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setProjects(result.data || []);
      } else {
        setError(result.message || "Failed to load projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to connect to server. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects from backend
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch departments for modal
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/departments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();
        if (result.success) {
          setDepartments(result.departments || []);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchDepartments();
  }, []);

  const fetchDepartmentPeople = async (departmentId) => {
    if (!departmentId) {
      setDepartmentManagers([]);
      setDepartmentEmployees([]);
      return;
    }

    try {
      setDepartmentLoading(true);
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `${apiConfig.API_BASE_URL}/api/admin/departments/${departmentId}/people`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setDepartmentManagers(result.data?.managers || []);
        setDepartmentEmployees(result.data?.employees || []);
      } else {
        setDepartmentManagers([]);
        setDepartmentEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching department people:", err);
      setDepartmentManagers([]);
      setDepartmentEmployees([]);
    } finally {
      setDepartmentLoading(false);
    }
  };

  // Enhanced status logic
  const getProjectStatus = (project) => {
    const progress = project?.progress || 0;

    const today = new Date();
    const deadlineDate = new Date(project?.deadline);

    if (progress === 100) {
      return {
        status: "Completed",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200"
      };
    }

    if (
      project?.deadline &&
      today > deadlineDate &&
      progress < 100
    ) {
      return {
        status: "Delayed",
        color: "bg-red-100 text-red-700 border-red-200"
      };
    }

    return {
      status: "In Progress",
      color: "bg-blue-100 text-blue-700 border-blue-200"
    };
  };

  const getPriorityStyle = (priority) => {
    if (priority === "High") return "bg-red-100 text-red-700 border border-red-300";
    if (priority === "Medium") return "bg-amber-100 text-amber-700 border border-amber-300";
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  };

  const getProgressGradient = (progress) => {
    if (progress >= 80) return "from-emerald-500 to-teal-600";
    if (progress >= 50) return "from-blue-600 to-cyan-500";
    return "from-amber-500 to-orange-600";
  };

  // Filtered projects with search and filter logic
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchTerm === "" ||
        (project.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.idCode || "").toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;

      if (activeFilter === "In Progress") {
        matchesFilter =
          (project?.progress || 0) < 100 &&
          new Date(project.deadline) >= new Date();
      } else if (activeFilter === "Completed") {
        matchesFilter = (project?.progress || 0) === 100;
      } else if (activeFilter === "High Priority") {
        matchesFilter = project.priority === "High";
      }

      const matchesSpecificProject =
        selectedProjectTitle === "" ||
        project.title === selectedProjectTitle;

      return matchesSearch && matchesFilter && matchesSpecificProject;
    });
  }, [projects, activeFilter, selectedProjectTitle, searchTerm]);

  // Stats calculation
  const totalProjects = projects.length;
  const inProgressCount = projects.filter(
    (p) => (p?.progress || 0) < 100
  ).length;
  const highPriorityCount = projects.filter((p) => p.priority === "High").length;

  // Project titles for dropdown
  const projectTitles = [...new Set(projects.map((p) => p.title))];

  const handleOpenAddModal = () => {
    setShowAddProjectModal(true);
  };

  const handleOpenProject = (projectId) => {
    navigate(`/admin/projects/${projectId}`);
  };

  const handleCloseAddModal = () => {
    setShowAddProjectModal(false);
    setFormData({
      project_id: "",
      name: "",
      description: "",
      department_id: "",
      manager_id: "",
      project_manager_name: "",
      start_date: "",
      deadline: "",
      priority: "Medium"
    });
    setSelectedEmployees([]);
    setDepartmentManagers([]);
    setDepartmentEmployees([]);
  };

  const handleDepartmentChange = async (departmentId, isEdit = false) => {
    if (isEdit) {
      setFormData((prev) => ({
        ...prev,
        department_id: departmentId,
        manager_id: "",
        project_manager_name: ""
      }));
      setEditSelectedEmployees([]);
    } else {
      setFormData((prev) => ({
        ...prev,
        department_id: departmentId,
        manager_id: "",
        project_manager_name: ""
      }));
      setSelectedEmployees([]);
    }

    await fetchDepartmentPeople(departmentId);
  };

  const handleManagerChange = (managerId) => {
    const selectedManager = departmentManagers.find((m) => String(m.id) === String(managerId));
    setFormData((prev) => ({
      ...prev,
      manager_id: managerId,
      project_manager_name: selectedManager?.name || ""
    }));
  };

  const handleEmployeeToggle = (employeeId, isEdit = false) => {
    const numericEmployeeId = Number(employeeId);
    const setter = isEdit ? setEditSelectedEmployees : setSelectedEmployees;

    setter((prev) =>
      prev.includes(numericEmployeeId)
        ? prev.filter((id) => Number(id) !== numericEmployeeId)
        : [...prev, numericEmployeeId]
    );
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();

    try {
      const token = sessionStorage.getItem("token");

      const payload = {
        ...formData,
        assigned_employee_ids: selectedEmployees
      };

      console.log("Sending Payload:", payload);

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/projects/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create project");
      }

      await fetchProjects();
      handleCloseAddModal();
    } catch (err) {
      alert(err.message || "Error creating project");
    }
  };

  const handleOpenEditModal = async (project) => {
    setEditingProject(project);
    setFormData({
      project_id: project.project_id || project.idCode || "",
      name: project.name || project.title || "",
      description: project.description || "",
      department_id: project.department_id || "",
      manager_id: project.manager_id || "",
      project_manager_name: project.project_manager_name || project.manager || "",
      start_date: project.start_date ? project.start_date.split("T")[0] : "",
      deadline: project.deadline && project.deadline !== "No Deadline" ? project.deadline.split("T")[0] : "",
      priority: project.priority || "Medium"
    });
    setEditSelectedEmployees(
      Array.isArray(project.assigned_employee_ids)
        ? project.assigned_employee_ids.map(Number).filter(Boolean)
        : []
    );
    setShowEditProjectModal(true);
    await fetchDepartmentPeople(project.department_id);
  };

  const handleCloseEditModal = () => {
    setShowEditProjectModal(false);
    setEditingProject(null);
    setEditSelectedEmployees([]);
    setDepartmentManagers([]);
    setDepartmentEmployees([]);
    setFormData({
      project_id: "",
      name: "",
      description: "",
      department_id: "",
      manager_id: "",
      project_manager_name: "",
      start_date: "",
      deadline: "",
      priority: "Medium"
    });
  };

  const handleSubmitEditProject = async (e) => {
    e.preventDefault();

    if (!editingProject) return;

    try {
      const token = sessionStorage.getItem("token");
      const payload = {
        ...formData,
        assigned_employee_ids: editSelectedEmployees
      };

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/projects/${editingProject.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update project");
      }

      await fetchProjects();
      handleCloseEditModal();
    } catch (err) {
      alert(err.message || "Error updating project");
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/projects/${projectToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete project");
      }

      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      alert(err.message || "Error deleting project");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-medium mb-2">⚠️ Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Projects</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Track and manage all active projects
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Project
        </button>
      </div>

      {/* Small Stat Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Projects</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <TrendingUp size={28} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">In Progress</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{inProgressCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users size={28} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">High Priority</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{highPriorityCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <TrendingUp size={28} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar with Searchable Project Dropdown */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative w-80">
          <div className="relative">
            <input
              type="text"
              list="project-list"
              value={selectedProjectTitle}
              placeholder="Search or select project..."
              onChange={(e) => {
                setSelectedProjectTitle(e.target.value);
                setSearchTerm("");
              }}
              className="w-full bg-white border border-gray-300 text-gray-700 font-medium px-5 py-3 pl-11 rounded-2xl focus:outline-none focus:border-blue-500 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <datalist id="project-list">
            <option value="">All Projects</option>
            {projectTitles.map((title, index) => (
              <option key={index} value={title} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-2xl">
          <button
            onClick={() => {
              setActiveFilter("All Projects");
              setSelectedProjectTitle("");
            }}
            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all ${
              activeFilter === "All Projects" && selectedProjectTitle === ""
                ? "bg-white shadow-sm text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-white/70"
            }`}
          >
            All Projects
          </button>

          <button
            onClick={() => {
              setActiveFilter("In Progress");
              setSelectedProjectTitle("");
            }}
            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all ${
              activeFilter === "In Progress"
                ? "bg-white shadow-sm text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-white/70"
            }`}
          >
            In Progress
          </button>

          <button
            onClick={() => {
              setActiveFilter("Completed");
              setSelectedProjectTitle("");
            }}
            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all ${
              activeFilter === "Completed"
                ? "bg-white shadow-sm text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-white/70"
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => {
              setActiveFilter("High Priority");
              setSelectedProjectTitle("");
            }}
            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all ${
              activeFilter === "High Priority"
                ? "bg-white shadow-sm text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-white/70"
            }`}
          >
            High Priority
          </button>
        </div>
      </div>

      {/* PROJECT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-500">
            <p className="text-xl">No projects found</p>
            <p className="text-sm mt-2">Try changing your filters or search term</p>
          </div>
        ) : (
          filteredProjects.map((project, idx) => {
            const { status, color } = getProjectStatus(project);

            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenProject(project.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenProject(project.id);
                  }
                }}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative group bg-white border border-blue-200 rounded-3xl overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-2xl cursor-pointer focus:outline-none focus:outline-none ${
                  hoveredCard === idx ? "shadow-2xl -translate-y-1 border-blue-400" : ""
                }`}
              >
                <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500"></div>

                <div className="p-6 pb-16">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {project.idCode}</p>
                    </div>

                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ml-4 ${getPriorityStyle(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition-colors">
                      <p className="text-xs text-gray-500 font-medium">Project Manager</p>
                      <p className="font-semibold text-gray-900 mt-1">{project.manager}</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users size={15} className="text-blue-600" />
                        <p className="text-xs text-gray-500 font-medium">Team Size</p>
                      </div>
                      <p className="font-semibold text-gray-900">{project.teamSize}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Deadline</p>
                        <p className="font-semibold text-gray-900">{project.deadline}</p>
                      </div>
                    </div>

                    <span className={`px-4 py-1.5 text-xs font-semibold rounded-2xl border ${color}`}>
                      {status}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" />
                        <span className="text-xs font-medium text-gray-600">Progress</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {project?.progress || 0}%
                      </span>
                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressGradient(project?.progress || 0)} rounded-full transition-all duration-500`}
                        style={{ width: `${project?.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(project);
                    }}
                    className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300"
                    title="Edit Project"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete(project);
                    }}
                    className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300"
                    title="Delete Project"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Project</h2>
              <button
                onClick={handleCloseAddModal}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProject} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
                  <input
                    type="text"
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="PRJ-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="Banking Risk Analysis System"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 min-h-[110px]"
                    placeholder="Credit risk forecasting platform for banking clients"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => handleManagerChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                    disabled={!formData.department_id || departmentLoading}
                  >
                    <option value="">Select Manager</option>
                    {departmentManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Assign Employees</label>
                <div className="border border-gray-300 rounded-2xl p-4 max-h-56 overflow-y-auto">
                  {!formData.department_id ? (
                    <p className="text-sm text-gray-500">Select a department first to load employees.</p>
                  ) : departmentLoading ? (
                    <p className="text-sm text-gray-500">Loading employees...</p>
                  ) : departmentEmployees.length === 0 ? (
                    <p className="text-sm text-gray-500">No employees found for this department.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {departmentEmployees.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => handleEmployeeToggle(employee.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{employee.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditProject} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
                  <input
                    type="text"
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 min-h-[110px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => handleDepartmentChange(e.target.value, true)}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => handleManagerChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                    disabled={!formData.department_id || departmentLoading}
                  >
                    <option value="">Select Manager</option>
                    {departmentManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Assign Employees</label>
                <div className="border border-gray-300 rounded-2xl p-4 max-h-56 overflow-y-auto">
                  {!formData.department_id ? (
                    <p className="text-sm text-gray-500">Select a department first to load employees.</p>
                  ) : departmentLoading ? (
                    <p className="text-sm text-gray-500">Loading employees...</p>
                  ) : departmentEmployees.length === 0 ? (
                    <p className="text-sm text-gray-500">No employees found for this department.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {departmentEmployees.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editSelectedEmployees.includes(Number(employee.id))}
                            onChange={() => handleEmployeeToggle(employee.id, true)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{employee.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Delete Project?</h2>
            <p className="text-gray-600 text-center mb-8">
              Are you sure you want to delete <strong>{projectToDelete.title}</strong>? This will also remove its tasks and assignments.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
