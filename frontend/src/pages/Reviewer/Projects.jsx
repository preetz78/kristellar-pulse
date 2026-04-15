// src/pages/Reviewer/Projects.jsx
import { useState, useEffect } from "react";
import { 
  Calendar, 
  Users, 
  TrendingUp 
} from "lucide-react";

import apiConfig from "../../config/apiConfig";

const ReviewerProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Filter states
  const [selectedOrg, setSelectedOrg] = useState("All Organizations");
  const [activeFilter, setActiveFilter] = useState("All Projects");
  const [selectedProjectTitle, setSelectedProjectTitle] = useState("All Projects");

  // Fetch all projects for reviewer
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/reviewer/projects`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();

        if (result.success) {
          setProjects(result.data);
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

    fetchProjects();
  }, []);

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

  const filteredProjects = projects.filter((project) => {
    let matchesFilter = true;
    if (activeFilter === "In Progress") matchesFilter = (project.display_status || project.status) !== "Completed";
    else if (activeFilter === "Completed") matchesFilter = (project.display_status || project.status) === "Completed";
    else if (activeFilter === "High Priority") matchesFilter = project.priority === "High";

    const matchesProject = selectedProjectTitle === "All Projects" || project.name === selectedProjectTitle;

    return matchesFilter && matchesProject;
  });

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Projects</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            All Active Projects in System
          </p>
        </div>
      </div>

      {/* Compact Summary Stats */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
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
                {projects.filter((p) => (p.display_status || p.status) !== "Completed").length}
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

      {/* PROJECT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, idx) => (
          <div
            key={project.id}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
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
                  (project.display_status || project.status) === "Completed" 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                    : "bg-blue-100 text-blue-700 border-blue-200"
                }`}>
                  {(project.display_status || project.status) || "In Progress"}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{project.progress || 0}%</span>
                </div>

                <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressGradient(project.progress || 0)} rounded-full transition-all duration-500`}
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerProjects;