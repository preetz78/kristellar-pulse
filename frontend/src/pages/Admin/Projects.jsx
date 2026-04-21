// src/pages/Admin/Projects.jsx
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  TrendingUp,
  Search
} from "lucide-react";

import apiConfig from "../../config/apiConfig";

const Projects = () => {
  const location = useLocation();   // ← Added to read navigation state

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState("All Projects");
  const [selectedProjectTitle, setSelectedProjectTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Apply filter when coming from Dashboard
  useEffect(() => {
    const incomingFilter = location.state?.activeFilter;
    if (incomingFilter) {
      setActiveFilter(incomingFilter);
      // Clear specific project and search when dashboard filter is applied
      if (incomingFilter !== "All Projects") {
        setSelectedProjectTitle("");
        setSearchTerm("");
      }
    }
  }, [location.state]);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = sessionStorage.getItem("token");

        const response = await fetch(`${apiConfig.API_BASE_URL}/api/admin/projects`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
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

    fetchProjects();
  }, []);

  // Enhanced status logic
  const getProjectStatus = (project) => {
    const today = new Date();
    const deadlineDate = new Date(project.deadline);
    
    if (project.progress === 100) {
      return { status: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    }
    
    if (today > deadlineDate && project.progress < 100) {
      return { status: "Delayed", color: "bg-red-100 text-red-700 border-red-200" };
    }
    
    return { 
      status: project.status || "In Progress", 
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
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.idCode.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;

      if (activeFilter === "In Progress") {
        matchesFilter = project.progress < 100 && 
                       new Date(project.deadline) >= new Date();
      } else if (activeFilter === "Completed") {
        matchesFilter = project.progress === 100;
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
  const inProgressCount = projects.filter((p) => p.progress < 100).length;
  const highPriorityCount = projects.filter((p) => p.priority === "High").length;

  // Project titles for dropdown
  const projectTitles = [...new Set(projects.map(p => p.title))];

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
        {/* Searchable Project Selector */}
        <div className="relative w-80">
          <div className="relative">
            <input
              type="text"
              list="project-list"
              value={selectedProjectTitle}
              placeholder="Search or select project..."
              onChange={(e) => {
                setSelectedProjectTitle(e.target.value);
                setSearchTerm(""); // Clear general search when selecting specific project
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

        {/* Filter Buttons */}
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
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative group bg-white border border-blue-200 rounded-3xl overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-2xl ${
                  hoveredCard === idx ? "shadow-2xl -translate-y-1 border-blue-400" : ""
                }`}
              >
                <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500"></div>

                <div className="p-6">
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
                      <p className="font-semibold text-gray-900">{project.teamSize} Members</p>
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
                      <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressGradient(project.progress)} rounded-full transition-all duration-500`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Projects;