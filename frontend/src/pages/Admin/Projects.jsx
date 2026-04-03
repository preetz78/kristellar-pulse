// src/pages/Admin/Projects.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  Calendar, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  X 
} from "lucide-react";

const Projects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([
    {
      id: 1,
      org: "TechFlow Solutions",
      title: "Cloud Migration",
      idCode: "PRJ-001",
      manager: "John Doe",
      teamSize: "8 Experts",
      deadline: "2026-04-25",
      progress: 65,
      priority: "High",
      status: "In Progress",
    },
    {
      id: 2,
      org: "GreenGrid Energy",
      title: "Solar Array Install",
      idCode: "PRJ-002",
      manager: "Sarah Connor",
      teamSize: "12 Engineers",
      deadline: "2026-05-15",
      progress: 42,
      priority: "Medium",
      status: "In Progress",
    },
    {
      id: 3,
      org: "NextGen AI",
      title: "ML Model Training",
      idCode: "PRJ-003",
      manager: "Alex Kumar",
      teamSize: "6 Data Scientists",
      deadline: "2026-06-30",
      progress: 85,
      priority: "High",
      status: "In Progress",
    },
  ]);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Add Project
  const [newProject, setNewProject] = useState({
    title: "",
    org: "",
    manager: "",
    teamSize: "",
    deadline: "",
    priority: "Medium",
  });

  const deleteProject = (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter((p) => p.id !== id));
    }
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

  const handleAddProject = (e) => {
    e.preventDefault();
    
    if (!newProject.title || !newProject.org || !newProject.manager) {
      alert("Please fill Title, Organization, and Manager");
      return;
    }

    const newId = Math.max(0, ...projects.map(p => p.id)) + 1;

    setProjects([...projects, {
      id: newId,
      org: newProject.org,
      title: newProject.title,
      idCode: `PRJ-${String(newId).padStart(3, '0')}`,
      manager: newProject.manager,
      teamSize: newProject.teamSize || "0",
      deadline: newProject.deadline || "TBD",
      progress: 0,
      priority: newProject.priority,
      status: "Planning",
    }]);

    // Reset form
    setNewProject({
      title: "",
      org: "",
      manager: "",
      teamSize: "",
      deadline: "",
      priority: "Medium",
    });

    setShowAddModal(false);
  };

  // Navigate to Project Details Page
  const goToProjectDetails = (projectId) => {
    navigate(`/admin/projects/${projectId}`);
  };

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

        <div className="flex gap-3">
          {/* <button className="px-5 py-2.5 border border-blue-200 text-blue-700 font-medium rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 flex items-center gap-2">
            <Filter size={18} />
            Filter
          </button> */}

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus size={18} />
            Add Project
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-10 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-3xl font-semibold text-gray-900">{projects.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-semibold text-gray-900">
                {projects.filter((p) => p.status === "In Progress").length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-3xl font-semibold text-gray-900">
                {projects.filter((p) => p.priority === "High").length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-3xl font-semibold text-gray-900">
                {projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, idx) => (
          <div
            key={project.id}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => goToProjectDetails(project.id)}
            className={`relative group bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:border-blue-400 hover:shadow-2xl ${
              hoveredCard === idx ? "shadow-2xl -translate-y-1 border-blue-400" : ""
            }`}
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-500"></div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 mb-1">
                    {project.org}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {project.idCode}</p>
                </div>

                <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ml-4 ${getPriorityStyle(project.priority)}`}>
                  {project.priority}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <p className="text-xs text-gray-500 font-medium">Project Manager</p>
                  <p className="font-semibold text-gray-900 mt-1 text-sm">{project.manager}</p>
                </div>

                <div className="bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users size={15} className="text-blue-600" />
                    <p className="text-xs text-gray-500 font-medium">Team Size</p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{project.teamSize}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 pb-6 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="font-semibold text-gray-900 text-sm">{project.deadline}</p>
                  </div>
                </div>

                <span className={`px-4 py-1.5 text-xs font-semibold rounded-xl border ${
                  project.status === "In Progress" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
                </div>

                <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressGradient(project.progress)} rounded-full transition-all duration-500`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-blue-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    goToProjectDetails(project.id);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-all hover:gap-3"
                >
                  View Details <ArrowRight size={16} />
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className={`p-2.5 rounded-xl transition-all ${hoveredCard === idx ? "bg-blue-100 text-blue-600" : "text-blue-600 hover:bg-blue-50"}`}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className={`p-2.5 rounded-xl transition-all ${hoveredCard === idx ? "bg-red-100 text-red-600" : "text-red-600 hover:bg-red-50"}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== ADD PROJECT MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-blue-50 rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-gray-900">Add New Project</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="Cloud Infrastructure Migration"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                <input
                  type="text"
                  value={newProject.org}
                  onChange={(e) => setNewProject({...newProject, org: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="TechFlow Solutions"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Manager</label>
                <input
                  type="text"
                  value={newProject.manager}
                  onChange={(e) => setNewProject({...newProject, manager: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Size</label>
                  <input
                    type="text"
                    value={newProject.teamSize}
                    onChange={(e) => setNewProject({...newProject, teamSize: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                    placeholder="8 Experts"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={newProject.priority}
                  onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;