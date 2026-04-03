import { useState } from "react";

const MEMBERS = [
  { id: 1, name: "Alice Chen", avatar: "AC", role: "Designer" },
  { id: 2, name: "Bob Singh", avatar: "BS", role: "Developer" },
  { id: 3, name: "Clara Kim", avatar: "CK", role: "PM" },
  { id: 4, name: "David Wu", avatar: "DW", role: "Developer" },
  { id: 5, name: "Eva Patel", avatar: "EP", role: "QA" },
  { id: 6, name: "Frank Lee", avatar: "FL", role: "Designer" },
  { id: 7, name: "Grace Tan", avatar: "GT", role: "Developer" },
  { id: 8, name: "Henry Zhao", avatar: "HZ", role: "DevOps" },
];

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Full overhaul of the public-facing site with new branding guidelines.",
    progress: 72,
    taskCount: 24,
    memberIds: [1, 2, 3, 6],
    deadline: "2025-08-15",
    status: "In Progress",
    tasks: [
      { id: 1, title: "Wireframes", status: "Done" },
      { id: 2, title: "Homepage layout", status: "Done" },
      { id: 3, title: "Mobile responsive", status: "In Progress" },
      { id: 4, title: "SEO audit", status: "To Do" },
    ],
  },
  {
    id: 2,
    name: "Mobile App v2.0",
    description: "Second major release introducing push notifications and offline mode.",
    progress: 45,
    taskCount: 38,
    memberIds: [2, 4, 5, 7],
    deadline: "2025-09-30",
    status: "In Progress",
    tasks: [
      { id: 1, title: "Auth module", status: "Done" },
      { id: 2, title: "Push notifications", status: "In Progress" },
      { id: 3, title: "Offline sync", status: "To Do" },
      { id: 4, title: "App Store submission", status: "To Do" },
    ],
  },
  {
    id: 3,
    name: "Data Analytics Dashboard",
    description: "Internal BI tool for real-time KPI tracking and reporting.",
    progress: 90,
    taskCount: 17,
    memberIds: [3, 4, 8],
    deadline: "2025-07-01",
    status: "Review",
    tasks: [
      { id: 1, title: "Chart components", status: "Done" },
      { id: 2, title: "Filters & export", status: "Done" },
      { id: 3, title: "Stakeholder review", status: "In Progress" },
    ],
  },
  {
    id: 4,
    name: "CRM Integration",
    description: "Connect Salesforce to internal ops tools via REST APIs.",
    progress: 15,
    taskCount: 29,
    memberIds: [2, 7, 8],
    deadline: "2025-11-20",
    status: "Planning",
    tasks: [
      { id: 1, title: "API mapping", status: "In Progress" },
      { id: 2, title: "Auth handshake", status: "To Do" },
      { id: 3, title: "Data migration", status: "To Do" },
    ],
  },
  {
    id: 5,
    name: "Security Audit 2025",
    description: "Annual penetration testing and compliance review across all services.",
    progress: 100,
    taskCount: 12,
    memberIds: [5, 8],
    deadline: "2025-06-15",
    status: "Completed",
    tasks: [
      { id: 1, title: "Pen test", status: "Done" },
      { id: 2, title: "Compliance report", status: "Done" },
      { id: 3, title: "Remediation", status: "Done" },
    ],
  },
  {
    id: 6,
    name: "Onboarding Flow Revamp",
    description: "Streamline new-user activation with a guided multi-step onboarding wizard.",
    progress: 58,
    taskCount: 20,
    memberIds: [1, 3, 6],
    deadline: "2025-08-31",
    status: "In Progress",
    tasks: [
      { id: 1, title: "UX research", status: "Done" },
      { id: 2, title: "Prototype", status: "Done" },
      { id: 3, title: "Dev handoff", status: "In Progress" },
      { id: 4, title: "A/B testing", status: "To Do" },
    ],
  },
];

const STATUS_STYLES = {
  "In Progress": { bg: "#EBF3FF", color: "#1A5FC8", dot: "#3B82F6" },
  Review:        { bg: "#FFF7E6", color: "#B45309", dot: "#F59E0B" },
  Planning:      { bg: "#F0F4FF", color: "#4338CA", dot: "#6366F1" },
  Completed:     { bg: "#EDFAF4", color: "#065F46", dot: "#10B981" },
  "On Hold":     { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
};

const AVATAR_COLORS = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#DCF5EA", color: "#065F46" },
  { bg: "#FDE8FF", color: "#7E22CE" },
  { bg: "#FFF3CD", color: "#92400E" },
  { bg: "#FFE4E6", color: "#9F1239" },
  { bg: "#E0F2FE", color: "#0C4A6E" },
  { bg: "#ECFDF5", color: "#047857" },
  { bg: "#FEF3C7", color: "#78350F" },
];

function Avatar({ member, size = 32 }) {
  const idx = member.id % AVATAR_COLORS.length;
  const { bg, color } = AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, fontFamily: "'Inter', sans-serif",
      border: "2px solid #fff", flexShrink: 0,
    }}>
      {member.avatar}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["On Hold"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function ProgressBar({ value, height = 8 }) {
  const color = value >= 80 ? "#10B981" : value >= 40 ? "#3B82F6" : "#F59E0B";
  return (
    <div style={{ background: "#EEF2FF", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        width: `${value}%`, height: "100%",
        background: color, borderRadius: 99,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function TaskBadge({ status }) {
  const map = {
    Done: { bg: "#EDFAF4", color: "#065F46" },
    "In Progress": { bg: "#EBF3FF", color: "#1A5FC8" },
    "To Do": { bg: "#F1F5F9", color: "#475569" },
  };
  const s = map[status] || map["To Do"];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 10, background: s.bg, color: s.color, fontFamily: "'Inter', sans-serif",
    }}>{status}</span>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose, onSave }) {
  const isEdit = !!project;
  const [form, setForm] = useState(
    project
      ? { ...project }
      : { name: "", description: "", deadline: "", memberIds: [], status: "Planning" }
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMember = (id) =>
    set("memberIds", form.memberIds.includes(id)
      ? form.memberIds.filter(m => m !== id)
      : [...form.memberIds, id]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16, fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
        animation: "modalIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A", fontFamily: "'Inter', sans-serif" }}>
            {isEdit ? "Edit Project" : "New Project"}
          </h3>
          <button onClick={onClose} style={{
            border: "none", background: "#F1F5F9", borderRadius: 8,
            width: 30, height: 30, cursor: "pointer",
            fontSize: 18, color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, fontFamily: "'Inter', sans-serif" }}>
          <label style={labelStyle}>Project Name
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Website Redesign" style={inputStyle} />
          </label>

          <label style={labelStyle}>Description
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Short project description..." rows={3}
              style={{ ...inputStyle, resize: "vertical", height: "auto", fontFamily: "'Inter', sans-serif" }} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>Deadline
              <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
                style={inputStyle} />
            </label>
            <label style={labelStyle}>Status
              <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
                {Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Inter', sans-serif" }}>
              Team Members
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MEMBERS.map(m => {
                const sel = form.memberIds.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMember(m.id)} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "5px 10px 5px 5px", borderRadius: 20,
                    border: `1.5px solid ${sel ? "#3B82F6" : "#E2E8F0"}`,
                    background: sel ? "#EBF3FF" : "#F8FAFC",
                    cursor: "pointer", fontSize: 13, color: sel ? "#1A5FC8" : "#475569",
                    fontWeight: sel ? 600 : 400, transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
                  }}>
                    <Avatar member={m} size={22} />
                    {m.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px 20px",
          display: "flex", justifyContent: "flex-end", gap: 10,
          borderTop: "1px solid #F1F5F9",
        }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 9, border: "1.5px solid #E2E8F0",
            background: "#fff", color: "#475569", fontWeight: 600,
            fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{
            padding: "9px 22px", borderRadius: 9, border: "none",
            background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}>
            {isEdit ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function ProjectDrawer({ project, onClose, onEdit }) {
  if (!project) return null;
  const members = MEMBERS.filter(m => project.memberIds.includes(m.id));
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", justifyContent: "flex-end", fontFamily: "'Inter', sans-serif",
    }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(15,23,42,0.35)" }} />
      <div style={{
        width: 400, background: "#fff", height: "100%",
        overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.1)",
        animation: "slideIn 0.25s ease",
      }}>
        {/* Drawer header */}
        <div style={{
          padding: "20px 20px 14px",
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(135deg,#EBF3FF 0%,#F0F6FF 100%)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#3B82F6", textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'Inter', sans-serif" }}>
                Project Details
              </p>
              <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: "#0F172A", fontFamily: "'Inter', sans-serif" }}>
                {project.name}
              </h2>
              <StatusBadge status={project.status} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onEdit(project)} style={iconBtnStyle} title="Edit">✏️</button>
              <button onClick={onClose} style={iconBtnStyle} title="Close">✕</button>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
            {project.description}
          </p>

          {/* Progress */}
          <Section title="Progress">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#64748B", fontFamily: "'Inter', sans-serif" }}>Overall completion</span>
              <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 15, fontFamily: "'Inter', sans-serif" }}>{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} height={10} />
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <Stat label="Tasks" value={project.taskCount} />
              <Stat label="Deadline" value={new Date(project.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
            </div>
          </Section>

          {/* Members */}
          <Section title="Team Members">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar member={m} size={34} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: "'Inter', sans-serif" }}>{m.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", fontFamily: "'Inter', sans-serif" }}>{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Tasks */}
          <Section title="Task List">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {project.tasks.map(t => (
                <div key={t.id} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "9px 12px",
                  background: "#F8FAFC", borderRadius: 9,
                  border: "1px solid #F1F5F9",
                }}>
                  <span style={{ fontSize: 13, color: "#334155", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>{t.title}</span>
                  <TaskBadge status={t.status} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ 
        margin: "0 0 12px", 
        fontSize: 14, 
        fontWeight: 700, 
        color: "#0F172A", 
        textTransform: "uppercase", 
        letterSpacing: 0.5, 
        fontFamily: "'Inter', sans-serif" 
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 14px", flex: 1, fontFamily: "'Inter', sans-serif" }}>
      <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: "'Inter', sans-serif" }}>{value}</p>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────────
function ProjectCard({ project, onView, onEdit }) {
  const members = MEMBERS.filter(m => project.memberIds.includes(m.id));
  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status !== "Completed";

  return (
    <div style={{
      background: "linear-gradient(to bottom, #EFF6FF, #ffffff)",
      border: "1px solid #BFDBFE",
      borderRadius: 14,
      boxShadow: "0 1px 6px rgba(59,130,246,0.06)",
      padding: "22px 22px 20px",
      minHeight: 300,
      display: "flex", flexDirection: "column", gap: 16,
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(59,130,246,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(59,130,246,0.06)"; e.currentTarget.style.transform = "none"; }}
      onClick={() => onView(project)}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, marginRight: 10 }}>
          <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#0F172A", fontFamily: "'Inter', sans-serif" }}>
            {project.name}
          </h4>
          <p style={{ margin: 0, fontSize: 15, color: "#64748B", lineHeight: 1.6,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {project.description}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: "#94A3B8", fontFamily: "'Inter', sans-serif" }}>Progress</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: "'Inter', sans-serif" }}>{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} height={9} />
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <MetaChip icon="📋" label={`${project.taskCount} tasks`} />
        <MetaChip icon="👥" label={`${members.length} members`} />
        <MetaChip
          icon="📅"
          label={deadlineDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          color={isOverdue ? "#EF4444" : undefined}
        />
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: "auto", paddingTop: 14, borderTop: "1px solid #F1F5F9",
      }}>
        {/* Avatars */}
        <div style={{ display: "flex" }}>
          {members.slice(0, 4).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}>
              <Avatar member={m} size={28} />
            </div>
          ))}
          {members.length > 4 && (
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#EEF2FF", color: "#3B82F6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, marginLeft: -8, border: "2px solid #fff", fontFamily: "'Inter', sans-serif",
            }}>+{members.length - 4}</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
          <ActionBtn label="Edit" onClick={() => onEdit(project)} color="#3B82F6" />
          <ActionBtn label="View" onClick={() => onView(project)} color="#10B981" />
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label, color }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: color || "#64748B", fontFamily: "'Inter', sans-serif" }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {label}
    </span>
  );
}

function ActionBtn({ label, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
      border: `1.5px solid ${color}20`, background: `${color}10`, color, fontFamily: "'Inter', sans-serif",
      cursor: "pointer", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; }}
    >
      {label}
    </button>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const labelStyle = {
  display: "flex", flexDirection: "column", gap: 6,
  fontSize: 13, fontWeight: 600, color: "#475569", fontFamily: "'Inter', sans-serif",
};
const inputStyle = {
  padding: "9px 12px", borderRadius: 9,
  border: "1.5px solid #E2E8F0", fontSize: 14,
  color: "#1E293B", outline: "none",
  background: "#F8FAFC", width: "100%",
  fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
};
const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 8,
  border: "1px solid #E2E8F0", background: "#fff",
  cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif",
  display: "flex", alignItems: "center", justifyContent: "center",
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ManagerProjects() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);     // ← Fixed: Added back modal state
  const [drawer, setDrawer] = useState(null);

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleSave = (form) => {
    if (form.id) {
      setProjects(ps => ps.map(p => p.id === form.id ? { ...p, ...form } : p));
    } else {
      setProjects(ps => [...ps, {
        ...form,
        id: Date.now(),
        progress: 0,
        taskCount: 0,
        tasks: [],
      }]);
    }
    setModal(null);   // ← Close modal after save
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <style>{`
        @keyframes modalIn { from { opacity:0; transform: scale(0.95) translateY(10px); } to { opacity:1; transform: none; } }
        @keyframes slideIn { from { transform: translateX(60px); opacity:0; } to { transform: none; opacity:1; } }
        *:focus { outline: none; }
      `}</style>

      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all your active and upcoming projects</p>
        </div>
        <button 
          onClick={() => setModal("create")} 
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all"
        >
          <span className="text-xl leading-none">+</span> New Project
        </button>
      </div>

      {/* Simple Clean Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          <input
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-14 py-4 bg-white border border-blue-200 rounded-3xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <ProjectCard 
              key={p.id} 
              project={p}
              onView={proj => setDrawer(proj)}
              onEdit={proj => setModal(proj)}
            />
          ))}
        </div>
      )}

      {/* Modals & Drawer */}
      {modal && (
        <ProjectModal
          project={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {drawer && (
        <ProjectDrawer
          project={drawer}
          onClose={() => setDrawer(null)}
          onEdit={proj => { setDrawer(null); setModal(proj); }}
        />
      )}
    </div>
  );
}
