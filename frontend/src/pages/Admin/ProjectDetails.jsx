// src/pages/Admin/ProjectDetails.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Users, CheckCircle2, Plus, Edit2, Trash2, MoreVertical, Eye, UserPlus, X
} from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMore, setShowMore] = useState(false);

  // Modal States
  const [selectedMember, setSelectedMember] = useState(null);        // View Member Modal
  const [memberToDelete, setMemberToDelete] = useState(null);        // Delete Member Modal
  const [showAssignModal, setShowAssignModal] = useState(false);     // Assign Task Modal
  const [assigningToMember, setAssigningToMember] = useState(null);

  // Edit Project Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const project = {
    org: "TECHFLOW SOLUTIONS",
    name: "Cloud Migration",
    idCode: "PRJ-001",
    manager: "John Doe",
    teamSize: "8 Experts",
    deadline: "2026-04-25",
    totalTasks: 12,
    progress: 65,
    priority: "High",
    status: "In Progress",
    description: "Migrate the entire on-premise infrastructure of Techflow Solutions to AWS Cloud. This includes database migration, API layer refactoring, CI/CD pipeline setup, and zero-downtime cutover strategy. The project involves coordination with 3 external vendor teams and requires compliance sign-off from the security team before final deployment.",
  };

  const taskGroups = {
    todo: [
      { id: "TSK-007", title: "Security audit and compliance review", assignee: "RP", color: "#6366f1", due: "Aug 10" },
      { id: "TSK-009", title: "Load balancer configuration", assignee: "LC", color: "#14b8a6", due: "Aug 14" },
      { id: "TSK-011", title: "Documentation — runbooks and SOPs", assignee: "TH", color: "#f59e0b", due: "Aug 15" },
    ],
    inProgress: [
      { id: "TSK-003", title: "Database schema migration to RDS", assignee: "JD", color: "#3b82f6", due: "Jul 28", progress: 60 },
      { id: "TSK-004", title: "CI/CD pipeline setup with GitHub Actions", assignee: "PS", color: "#22c55e", due: "Aug 05", progress: 45 },
      { id: "TSK-005", title: "API layer refactoring for microservices", assignee: "MW", color: "#ef4444", due: "Aug 08", progress: 35 },
      { id: "TSK-008", title: "VPC networking and subnet setup", assignee: "RP", color: "#6366f1", due: "Aug 11", progress: 55 },
    ],
    review: [
      { id: "TSK-005b", title: "Zero-downtime cutover strategy document", assignee: "JD", color: "#3b82f6", due: "Jul 30" },
      { id: "TSK-006", title: "Staging environment validation", assignee: "LC", color: "#14b8a6", due: "Aug 01" },
    ],
    done: [
      { id: "TSK-001", title: "AWS account setup and IAM roles", assignee: "JD", color: "#3b82f6", due: "Jul 10" },
      { id: "TSK-002", title: "Architecture diagram and tech spec", assignee: "PS", color: "#22c55e", due: "Jul 18" },
      { id: "TSK-010", title: "Vendor onboarding and contracts", assignee: "TH", color: "#f59e0b", due: "Jul 22" },
    ],
  };

  const teamMembers = [
    { id: 1, name: "John Doe", role: "Project Manager", tasks: 12, initials: "JD", color: "bg-indigo-500" },
    { id: 2, name: "Priya Sharma", role: "Backend Engineer", tasks: 8, initials: "PS", color: "bg-emerald-500" },
    { id: 3, name: "Raj Patel", role: "DevOps Engineer", tasks: 6, initials: "RP", color: "bg-violet-500" },
    { id: 4, name: "Lisa Chen", role: "Cloud Architect", tasks: 10, initials: "LC", color: "bg-teal-500" },
    { id: 5, name: "Mark Webb", role: "Frontend Engineer", tasks: 7, initials: "MW", color: "bg-rose-500" },
    { id: 6, name: "Tom Harris", role: "Technical Writer", tasks: 4, initials: "TH", color: "bg-amber-500" },
  ];

  const recentActivity = [
    { user: "Raj Patel", action: "moved VPC networking setup to In Progress", time: "2 hours ago" },
    { user: "John Doe", action: "submitted Cutover strategy doc for review", time: "5 hours ago" },
    { user: "Priya Sharma", action: "completed Architecture diagram", time: "Yesterday" },
  ];

  const openTask = (task) => setSelectedTask(task);
  const closeTask = () => setSelectedTask(null);

  const avatarStyles = {
    JD: "bg-indigo-50 text-indigo-800",
    PS: "bg-emerald-50 text-emerald-800",
    RP: "bg-violet-50 text-violet-900",
    LC: "bg-teal-50 text-teal-800",
    MW: "bg-orange-50 text-orange-800",
    TH: "bg-amber-50 text-amber-800",
  };

  const barStyles = {
    JD: "bg-indigo-500",
    PS: "bg-emerald-500",
    RP: "bg-violet-600",
    LC: "bg-teal-500",
    MW: "bg-orange-500",
    TH: "bg-amber-500",
  };

  const maxTasks = Math.max(...teamMembers.map((m) => m.tasks));

  // View Member Modal
  const openMemberDetail = (member) => {
    setSelectedMember(member);
  };

  const closeMemberDetail = () => {
    setSelectedMember(null);
  };

  // Assign Task Modal
  const openAssignModal = (member) => {
    setAssigningToMember(member);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssigningToMember(null);
  };

  // Delete Member Modal
  const openDeleteMemberModal = (member) => {
    setMemberToDelete(member);
  };

  const closeDeleteMemberModal = () => {
    setMemberToDelete(null);
  };

  const handleDeleteMember = () => {
    alert(`Member ${memberToDelete?.name} has been removed from the project.`);
    closeDeleteMemberModal();
  };

  // Group Activities
  const groupActivities = (activities) => {
    const groups = {};

    activities.forEach((act) => {
      const time = act.time.toLowerCase();

      if (time.includes("hour") || time.includes("minute") || time.includes("just")) {
        groups["Today"] = groups["Today"] || [];
        groups["Today"].push(act);
      } 
      else if (time.includes("yesterday")) {
        groups["Yesterday"] = groups["Yesterday"] || [];
        groups["Yesterday"].push(act);
      } 
      else {
        groups["Earlier"] = groups["Earlier"] || [];
        groups["Earlier"].push(act);
      }
    });

    return groups;
  };

  const groupedActivities = groupActivities(recentActivity);

  // Edit Project Modal Handlers
  const openEditProjectModal = () => {
    setEditingProject({ ...project });
    setShowEditModal(true);
  };

  const closeEditProjectModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
  };

  const handleEditProject = (e) => {
    e.preventDefault();
    if (!editingProject.name || !editingProject.manager) return;

    // For now we simulate update (you can later sync with global state)
    alert("Project updated successfully!");
    closeEditProjectModal();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/projects")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Projects</span>
          </button>
          <div className="flex items-center gap-3">
            {/* Edit Project Button - Now opens modal */}
            <button 
              onClick={openEditProjectModal}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-2xl hover:bg-gray-50 transition text-sm font-medium"
            >
              <Edit2 size={17} /> Edit Project
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Project Details Card */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-3xl shadow-xl p-4 sm:p-5 space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.22em] text-indigo-600 font-semibold">
                {project.org}
              </p>
              <h1 className="text-xl sm:text-[2rem] font-bold text-gray-900 mt-1 leading-tight">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-mono mt-1">{project.idCode}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3.5 py-1 text-[11px] font-semibold bg-red-100 text-red-700 rounded-2xl shadow-sm">
                High Priority
              </span>
              <span className="px-3.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-2xl shadow-sm">
                In Progress
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-white p-3 rounded-2xl border border-gray-100 hover:border-indigo-200 transition">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                JD
              </div>
              <div>
                <p className="text-xs text-gray-500">Project Manager</p>
                <p className="font-semibold text-sm sm:text-base text-gray-900">{project.manager}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-white p-3 rounded-2xl border border-gray-100 hover:border-indigo-200 transition">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Team Size</p>
                <p className="font-semibold text-sm sm:text-base text-gray-900">{project.teamSize}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-white p-3 rounded-2xl border border-gray-100 hover:border-red-200 transition">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="font-semibold text-sm sm:text-base text-red-600">25 Apr 2026</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-white p-3 rounded-2xl border border-gray-100 hover:border-emerald-200 transition">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Tasks</p>
                <p className="font-semibold text-sm sm:text-base text-gray-900">{project.totalTasks} Tasks</p>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {project.progress}%
              </p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-3.5 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">
              {showMore
                ? project.description
                : `${project.description.substring(0, 135)}...`}
            </p>
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1 transition"
            >
              {showMore ? "Show Less ▲" : "Read More ▼"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-gray-200 mb-8 overflow-x-auto pb-1">
          {["Tasks", "Team", "Activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-8 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.toLowerCase()
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {Object.entries(taskGroups).map(([status, tasks]) => (
              <div
                key={status}
                className="group bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl shadow-sm flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300"
              >
                <div className={`px-6 py-4 flex justify-between items-center rounded-t-3xl
                  ${status === 'todo' && 'bg-gray-50'}
                  ${status === 'inProgress' && 'bg-gradient-to-r from-blue-50 to-indigo-50'}
                  ${status === 'review' && 'bg-gradient-to-r from-violet-50 to-purple-50'}
                  ${status === 'done' && 'bg-gradient-to-r from-emerald-50 to-teal-50'}
                `}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'todo' ? 'bg-gray-400' :
                      status === 'inProgress' ? 'bg-blue-500' :
                      status === 'review' ? 'bg-violet-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-semibold text-gray-800 uppercase tracking-wider text-sm">
                      {status === 'inProgress' ? 'IN PROGRESS' : status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm font-medium">{tasks.length}</span>
                </div>

                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[520px]">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openTask(task)}
                      className={`
                        group relative bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer
                        transition-all duration-300
                        hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]
                        before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:rounded-l-2xl
                        ${status === 'todo' && 'before:bg-gray-400'}
                        ${status === 'inProgress' && 'before:bg-blue-500'}
                        ${status === 'review' && 'before:bg-violet-500'}
                        ${status === 'done' && 'before:bg-emerald-500'}
                      `}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-sm font-medium text-gray-800 leading-snug pr-8">{task.title}</p>
                        <button className="opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 text-gray-400 hover:text-gray-600">
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      {task.progress && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-6">
                        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 text-xs font-bold rounded-xl text-white flex items-center justify-center shadow-md ring-2 ring-white"
                            style={{ backgroundColor: task.color }}
                          >
                            {task.assignee}
                          </div>
                          <span className={`text-xs font-medium ${status === 'done' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {task.due}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === "team" && (
          <div className="bg-white border border-gray-100  shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm uppercase text-indigo-700">
                    <th className="px-7 py-4 font-medium">Member</th>
                    <th className="px-7 py-4 font-medium">Role</th>
                    <th className="px-7 py-4 font-medium">Tasks</th>
                    <th className="px-7 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => {
                    const pct = Math.round((member.tasks / maxTasks) * 100);
                    return (
                      <tr
                        key={member.id}
                        className="bg-white shadow-sm hover:shadow-md hover:bg-blue-50 transition-all duration-200"
                      >
                        {/* Member */}
                        <td className="px-7 py-5 ">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-medium flex-shrink-0 ${avatarStyles[member.initials]}`}>
                              {member.initials}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{member.role}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-7 py-5">
                          <span className="inline-block text-sm px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            {member.role}
                          </span>
                        </td>

                        {/* Tasks */}
                        <td className="px-7 py-5">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="font-medium text-gray-700">{member.tasks} tasks</span>
                            <span className="text-xs text-gray-400">{pct}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barStyles[member.initials]}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>

                        {/* Actions - Clickable Icons */}
                        <td className="px-7 py-5 text-right rounded-r-2xl">
                          <div className="flex justify-end gap-2">
                            {/* View Button */}
                            <button 
                              onClick={() => openMemberDetail(member)}
                              className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-all"
                              title="View Member Details"
                            >
                              <Eye size={18} />
                            </button>

                            {/* Assign Button */}
                            <button 
                              onClick={() => openAssignModal(member)}
                              className="p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-all"
                              title="Assign Task"
                            >
                              <UserPlus size={18} />
                            </button>

                            {/* Delete Button */}
                            <button 
                              onClick={() => openDeleteMemberModal(member)}
                              className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-all"
                              title="Remove from Project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-7 py-5 border-t border-gray-100 text-sm text-gray-500">
              <button className="flex items-center gap-2 hover:text-gray-700 transition">
                <Plus size={16} />
                Add Team Member
              </button>
              <span>{teamMembers.reduce((sum, m) => sum + m.tasks, 0)} total tasks assigned</span>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB - Updated with Grouping */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-3xl shadow border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">Recent Activity</h2>

            <div className="relative">

              {/* Vertical Line */}
              <div className="absolute left-[140px] top-0 h-full w-[2px] bg-gray-200"></div>

              <div className="space-y-8">
                {recentActivity.map((act, i) => (
                  
                  <div
                    key={i}
                    className="grid grid-cols-[120px_1fr] items-start gap-6 relative"
                  >

                    {/* TIME */}
                    <div className="text-right text-xs text-gray-400 pt-1">
                      {act.time}
                    </div>

                    {/* DOT (ON LINE) */}
                    <div className="absolute left-[135px] top-1.5">
                      <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 rounded-xl hover:bg-blue-50 transition">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold text-gray-900">{act.user}</span>{" "}
                        {act.action}
                      </p>
                    </div>

                  </div>

                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* TASK DETAIL DRAWER */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white/95 backdrop-blur-xl border-l border-gray-200 shadow-2xl z-50 overflow-auto transition-all duration-300">
          <div className="p-5 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-gray-400 font-mono">{selectedTask.id}</p>
                <h2 className="text-lg font-semibold text-gray-900 leading-snug mt-1">
                  {selectedTask.title}
                </h2>
              </div>
              <button onClick={closeTask} className="text-gray-400 hover:text-gray-700 text-xl">
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                In Progress
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                High Priority
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {selectedTask.due}, 2026
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                  style={{ backgroundColor: selectedTask.color }}
                >
                  {selectedTask.assignee}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedTask.assignee}
                  </p>
                  <p className="text-xs text-gray-500">Assigned Member</p>
                </div>
              </div>

              {selectedTask.progress && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-indigo-600 font-semibold">
                      {selectedTask.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="uppercase text-xs tracking-widest text-gray-500 mb-4">Comments</div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold">
                    JD
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="font-medium text-gray-800">John Doe</span>
                      <span>Jul 25</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Completed schema dump and initial data validation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3 flex gap-2 items-end">
              <textarea
                className="flex-1 bg-transparent outline-none text-sm resize-none"
                placeholder="Write a comment..."
                rows="2"
              />
              <button className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm shadow-md hover:scale-105 transition">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MEMBER DETAIL MODAL ==================== */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-blue-50 rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-gray-900">Member Profile</h2>
              <button onClick={closeMemberDetail} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${avatarStyles[selectedMember.initials]}`}>
                  {selectedMember.initials}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-gray-500">{selectedMember.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500">Tasks Assigned</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{selectedMember.tasks}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500">Completion Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">87%</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={closeMemberDetail} className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ASSIGN TASK MODAL ==================== */}
      {showAssignModal && assigningToMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-blue-50 rounded-t-3xl">
              <h2 className="text-xl font-semibold">Assign Task to {assigningToMember.name}</h2>
              <button onClick={closeAssignModal} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X size={22} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Task</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500">
                  <option value="">Choose a task...</option>
                  {taskGroups.todo.concat(taskGroups.inProgress, taskGroups.review).map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button onClick={closeAssignModal} className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium">Cancel</button>
              <button onClick={() => { alert("Task assigned successfully!"); closeAssignModal(); }} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-medium">Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE MEMBER MODAL ==================== */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <p className="text-red-600 text-5xl mb-4">🗑</p>
              <h3 className="text-xl font-semibold mb-2">Remove Member?</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to remove <strong>{memberToDelete.name}</strong> from this project?
              </p>

              <div className="flex gap-3">
                <button onClick={closeDeleteMemberModal} className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium">Cancel</button>
                <button onClick={handleDeleteMember} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-medium">Yes, Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT PROJECT MODAL ==================== */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-white">Edit Project</h2>
              <button 
                onClick={closeEditProjectModal}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleEditProject} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                <input
                  type="text"
                  value={editingProject.org}
                  onChange={(e) => setEditingProject({...editingProject, org: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Manager</label>
                <input
                  type="text"
                  value={editingProject.manager}
                  onChange={(e) => setEditingProject({...editingProject, manager: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Size</label>
                  <input
                    type="text"
                    value={editingProject.teamSize}
                    onChange={(e) => setEditingProject({...editingProject, teamSize: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                  <input
                    type="date"
                    value={editingProject.deadline}
                    onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={editingProject.priority}
                  onChange={(e) => setEditingProject({...editingProject, priority: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={closeEditProjectModal}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;