// src/pages/Employee/EmployeeProjects.jsx

import React, { useState } from 'react';
import { Calendar, Users, CheckSquare, Clock, ChevronRight, X, TrendingUp, AlertCircle } from 'lucide-react';

const PROJECTS = [
  {
    id: 1,
    name: "Mobile Banking App",
    description: "Complete redesign and development of mobile banking application with new security features.",
    progress: 75,
    deadline: "2026-04-15",
    status: "In Progress",
    members: 6,
    myTasks: 5,
    totalTasks: 56,
    tasks: [
      { title: "Finalize login screen designs", status: "In Progress", mine: true },
      { title: "Implement biometric auth", status: "Done", mine: true },
      { title: "Transaction history UI", status: "To Do", mine: true },
      { title: "Push notification setup", status: "Done", mine: true },
      { title: "Security audit review", status: "To Do", mine: true },
      { title: "Backend API integration", status: "In Progress", mine: false },
      { title: "QA testing cycle", status: "To Do", mine: false },
    ],
  },
  {
    id: 2,
    name: "E-commerce Platform",
    description: "Full-stack e-commerce solution with payment gateway and inventory management.",
    progress: 45,
    deadline: "2026-05-20",
    status: "In Progress",
    members: 8,
    myTasks: 3,
    totalTasks: 40,
    tasks: [
      { title: "Fix payment API integration bug", status: "In Progress", mine: true },
      { title: "Cart UI redesign", status: "Done", mine: true },
      { title: "Inventory sync module", status: "To Do", mine: true },
      { title: "Admin dashboard", status: "In Progress", mine: false },
      { title: "Performance optimization", status: "To Do", mine: false },
    ],
  },
  {
    id: 3,
    name: "AI Dashboard Analytics",
    description: "Internal analytics dashboard with machine learning insights and reporting.",
    progress: 90,
    deadline: "2026-04-05",
    status: "Review",
    members: 5,
    myTasks: 2,
    totalTasks: 30,
    tasks: [
      { title: "Review user testing feedback", status: "In Progress", mine: true },
      { title: "Chart component polish", status: "Done", mine: true },
      { title: "Export to CSV feature", status: "Done", mine: false },
      { title: "Stakeholder presentation", status: "To Do", mine: false },
    ],
  },
];

const MEMBER_COLORS = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#DCF5EA", color: "#065F46" },
  { bg: "#FDE8FF", color: "#7E22CE" },
  { bg: "#FFF3CD", color: "#92400E" },
  { bg: "#FFE4E6", color: "#9F1239" },
  { bg: "#E0F2FE", color: "#0C4A6E" },
];

const MEMBER_INITIALS = ["AR", "BS", "CK", "DW", "EP", "FL", "GT", "HZ"];

const STATUS_MAP = {
  "In Progress": { bg: "#EBF3FF", color: "#1A5FC8", dot: "#3B82F6" },
  "Review":      { bg: "#F3E8FF", color: "#6B21A8", dot: "#A855F7" },
  "Planning":    { bg: "#FFF7E6", color: "#B45309", dot: "#F59E0B" },
  "Completed":   { bg: "#EDFAF4", color: "#065F46", dot: "#10B981" },
};

const TASK_STATUS_MAP = {
  "Done":        { bg: "#EDFAF4", color: "#065F46" },
  "In Progress": { bg: "#EBF3FF", color: "#1A5FC8" },
  "To Do":       { bg: "#F1F5F9", color: "#475569" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      padding: "4px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function ProgressBar({ value }) {
  const color = value >= 80 ? "#10B981" : value >= 40 ? "#3B82F6" : "#F59E0B";
  return (
    <div style={{ background: "#EEF2FF", borderRadius: 99, height: 8, overflow: "hidden", width: "100%" }}>
      <div style={{
        width: `${value}%`, height: "100%",
        background: color, borderRadius: 99,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

function MemberAvatars({ count, size = 30 }) {
  return (
    <div style={{ display: "flex" }}>
      {[...Array(Math.min(count, 4))].map((_, i) => {
        const { bg, color } = MEMBER_COLORS[i % MEMBER_COLORS.length];
        return (
          <div key={i} style={{
            width: size, height: size, borderRadius: "50%",
            background: bg, color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.33, fontWeight: 700,
            border: "2px solid #fff",
            marginLeft: i === 0 ? 0 : -8,
            zIndex: 4 - i, flexShrink: 0,
          }}>
            {MEMBER_INITIALS[i].slice(0, 2)}
          </div>
        );
      })}
      {count > 4 && (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: "#EEF2FF", color: "#3B82F6",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.3, fontWeight: 700,
          border: "2px solid #fff", marginLeft: -8,
        }}>+{count - 4}</div>
      )}
    </div>
  );
}

function ProjectDrawer({ project, onClose }) {
  const doneTasks = project.tasks.filter(t => t.status === "Done").length;
  const myTasksDone = project.tasks.filter(t => t.mine && t.status === "Done").length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)" }} />
      <div style={{
        width: 440, background: "#fff", height: "100%",
        overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column",
        animation: "drawerIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 26px 20px",
          background: "linear-gradient(135deg, #EBF3FF 0%, #F0F6FF 100%)",
          borderBottom: "1px solid #E2E8F0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Project Details
              </p>
              <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
                {project.name}
              </h2>
              <StatusBadge status={project.status} />
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid #E2E8F0", background: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B", flexShrink: 0,
            }}>
              <X size={17} />
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 26px", flex: 1 }}>

          {/* Description */}
          <p style={{ margin: "0 0 24px", fontSize: 14.5, color: "#475569", lineHeight: 1.7 }}>
            {project.description}
          </p>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Progress",  value: `${project.progress}%`, icon: TrendingUp, iconColor: "#3B82F6" },
              { label: "Deadline",  value: new Date(project.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), icon: Calendar, iconColor: "#F59E0B" },
              { label: "Team",      value: `${project.members} members`, icon: Users, iconColor: "#10B981" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 13px", border: "1px solid #F1F5F9" }}>
                <s.icon size={15} style={{ color: s.iconColor, marginBottom: 6 }} />
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Overall Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{doneTasks}/{project.tasks.length} tasks done</span>
            </div>
            <ProgressBar value={project.progress} />
          </div>

          {/* Team */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Team Members
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[...Array(project.members)].map((_, i) => {
                const { bg, color } = MEMBER_COLORS[i % MEMBER_COLORS.length];
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: bg, borderRadius: 20,
                    padding: "5px 13px 5px 5px",
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: color + "22", color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800,
                    }}>
                      {MEMBER_INITIALS[i % MEMBER_INITIALS.length]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{MEMBER_INITIALS[i % MEMBER_INITIALS.length]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Tasks
              </p>
              <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>
                {myTasksDone}/{project.myTasks} yours done
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {project.tasks.map((t, idx) => {
                const ts = TASK_STATUS_MAP[t.status] || TASK_STATUS_MAP["To Do"];
                return (
                  <div key={idx} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px",
                    background: t.mine ? "#F0F6FF" : "#F8FAFC",
                    borderRadius: 10,
                    border: `1px solid ${t.mine ? "#BFDBFE" : "#F1F5F9"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {t.mine && (
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: "#3B82F6",
                          background: "#DBEAFE", borderRadius: 4, padding: "2px 6px",
                          textTransform: "uppercase", letterSpacing: 0.3,
                        }}>You</span>
                      )}
                      <span style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>{t.title}</span>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: "3px 9px",
                      borderRadius: 10, background: ts.bg, color: ts.color,
                      flexShrink: 0, marginLeft: 8,
                    }}>{t.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function EmployeeProjects() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState("All");

  const statuses = ["All", "In Progress", "Review", "Completed"];

  const filtered = filter === "All"
    ? PROJECTS
    : PROJECTS.filter(p => p.status === filter);

  const isOverdue = (deadline) => new Date(deadline) < new Date();

  return (
    <div className="p-6 bg-white min-h-screen">
      <style>{`
        @keyframes drawerIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-end mb-7">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">My Projects</h1>
          <p className="text-gray-500 text-sm mt-1">Projects you are currently working on</p>
        </div>
        <span className="text-sm font-semibold text-blue-500 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
          {PROJECTS.length} active
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-7">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
              ${filter === s
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-base font-medium">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project, idx) => {
            const overdue = isOverdue(project.deadline) && project.status !== "Completed";
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{ animation: `cardIn 0.3s ease ${idx * 0.07}s both` }}
                className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-2xl p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col gap-4"
              >
                {/* Top */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                    {project.name}
                  </h3>
                  <StatusBadge status={project.status} />
                </div>

                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 -mt-1">
                  {project.description}
                </p>

                {/* Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-bold text-blue-600">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-blue-400" />
                    <span className="font-semibold text-blue-600">{project.myTasks}</span> / {project.totalTasks} tasks
                  </span>
                  <span className={`flex items-center gap-1.5 ${overdue ? 'text-red-500' : ''}`}>
                    {overdue
                      ? <AlertCircle size={14} className="text-red-400" />
                      : <Calendar size={14} className="text-blue-400" />}
                    {overdue && <span className="font-semibold">Overdue · </span>}
                    {new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-blue-100 mt-auto">
                  <MemberAvatars count={project.members} size={28} />
                  <span className="flex items-center gap-1 text-sm text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {selectedProject && (
        <ProjectDrawer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}