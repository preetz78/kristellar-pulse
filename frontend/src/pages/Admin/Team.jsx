// src/pages/Admin/Team.jsx
import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Upload, X, Users, ShieldCheck, Mail,
  Search, UserCircle2
} from "lucide-react";
import apiConfig from "../../config/apiConfig";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const ROLE_STYLES = {
  Manager:  { pill: "bg-blue-100 text-blue-700 border border-blue-200" },
  Reviewer: { pill: "bg-violet-100 text-violet-700 border border-violet-200" },
  Admin:    { pill: "bg-rose-100 text-rose-700 border border-rose-200" },
  Employee: { pill: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
};
const getRoleStyle = (role) => ROLE_STYLES[role] || ROLE_STYLES.Employee;

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-cyan-500 to-blue-500",
];
const grad = (idx) => GRADIENTS[idx % GRADIENTS.length];

const inp = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white transition";

const EMPTY_NEW = {
  userId: "", name: "", email: "", password: "", role: "Employee",
  phone: "", designation: "", location: "", bio: "", departmentId: "",
  profilePic: null, previewUrl: null,
};
const EMPTY_EDIT = {
  name: "", email: "", role: "Employee",
  phone: "", designation: "", location: "", bio: "",
  departmentId: "", profilePic: null, previewUrl: null,
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const Team = () => {
  const [teamMembers, setTeamMembers]     = useState([]);
  const [departments, setDepartments]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");

  const [showAddModal, setShowAddModal]         = useState(false);
  const [showEditModal, setShowEditModal]        = useState(false);
  const [showDeleteModal, setShowDeleteModal]    = useState(false);

  const [newUser, setNewUser]         = useState(EMPTY_NEW);
  const [editUser, setEditUser]       = useState(EMPTY_EDIT);
  const [editingId, setEditingId]     = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const [submitting, setSubmitting]     = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  const API_BASE_URL = apiConfig.API_BASE_URL || "http://localhost:5000";
  const token = sessionStorage.getItem("token");

  /* ── Toast ─────────────────────────────────────────────── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || data || []);
      }
    } catch (err) { console.error("Fetch depts:", err); }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      let users = await res.json();
      users = users.filter((u) => u.role?.toLowerCase() !== "admin");
      setTeamMembers(
        users.map((u, i) => ({
          id: u.id,
          memberKey: `user-${u.id}`,
          name: u.name,
          email: u.email,
          role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Employee",
          department: u.department_name || u.department || "—",
          departmentId: u.department_id || "",
          phone: u.phone || "",
          designation: u.designation || "",
          location: u.location || "",
          bio: u.bio || "",
          profilePic: u.profile_picture || null,
          avatar: u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "US",
          gradIdx: i,
        }))
      );
    } catch (err) { console.error("Fetch users:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchDepartments(); }, []);

  const filtered = teamMembers.filter((m) =>
    [m.name, m.email, m.role, m.department].some((s) =>
      s.toLowerCase().includes(search.toLowerCase())
    )
  );

  /* ── Pic helpers ────────────────────────────────────────── */
  const handlePicChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) setter((p) => ({ ...p, profilePic: file, previewUrl: URL.createObjectURL(file) }));
  };
  const removePic = (setter) => setter((p) => ({ ...p, profilePic: null, previewUrl: null }));

  /* ── ADD ────────────────────────────────────────────────── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast("Name, Email and Password are required", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(newUser).forEach(([k, v]) => {
      if (k === "previewUrl") return;
      if (k === "profilePic") { if (v) fd.append("profile_picture", v); }
      else fd.append(k, v ?? "");
    });
    fd.set("role", newUser.role.toLowerCase());
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST", body: fd, headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("User created successfully!");
        setNewUser(EMPTY_NEW); setShowAddModal(false); await fetchUsers();
      } else { showToast(result.message || "Failed to create user", "error"); }
    } catch { showToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  /* ── EDIT ───────────────────────────────────────────────── */
  const openEdit = (member) => {
    setEditingId(member.id);
    setEditUser({
      name: member.name, email: member.email, role: member.role,
      phone: member.phone, designation: member.designation,
      location: member.location, bio: member.bio,
      departmentId: member.departmentId,
      profilePic: null, previewUrl: null,
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editUser.name || !editUser.email) {
      showToast("Name and Email are required", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(editUser).forEach(([k, v]) => {
      if (k === "previewUrl") return;
      if (k === "profilePic") { if (v) fd.append("profile_picture", v); }
      else fd.append(k, v ?? "");
    });
    fd.set("role", editUser.role.toLowerCase());
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingId}`, {
        method: "PUT", body: fd, headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        showToast("User updated successfully!");
        setShowEditModal(false); await fetchUsers();
      } else { showToast(result.message || "Failed to update user", "error"); }
    } catch { showToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  /* ── DELETE ─────────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${deletingMember.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("User deleted!");
        setShowDeleteModal(false);
        setTeamMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      } else { showToast("Failed to delete user", "error"); }
    } catch { showToast("Network error", "error"); }
    finally { setDeleteLoading(false); }
  };

  const stats = [
    { label: "Total Users",  value: teamMembers.length,                                    icon: <Users size={22} />,       g: "from-blue-500 to-blue-600"    },
    { label: "Managers",     value: teamMembers.filter((m) => m.role === "Manager").length, icon: <ShieldCheck size={22} />, g: "from-indigo-500 to-violet-600" },
    { label: "Active Users", value: teamMembers.length,                                    icon: <Mail size={22} />,        g: "from-cyan-500 to-blue-500"    },
  ];
 
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .tj { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }
        .fu { animation: fadeUp 0.3s ease forwards; }
        .mi { animation: scaleIn 0.22s ease forwards; }
        .ti { animation: toastIn 0.28s ease forwards; }
        .trow { transition: background 0.14s ease; }
        .trow:hover { background: #eef3ff; }
        .trow:hover .act { opacity:1 !important; }
        .scard { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .scard:hover { transform:translateY(-3px); box-shadow:0 14px 36px -8px rgba(59,130,246,0.28); }
        .pbtn { transition: box-shadow 0.15s ease, transform 0.1s ease; }
        .pbtn:hover { box-shadow:0 6px 20px -4px rgba(37,99,235,0.4); }
        .pbtn:active { transform:scale(0.97); }
        input:focus, select:focus, textarea:focus {
          outline:none; border-color:#3b82f6;
          box-shadow:0 0 0 3px rgba(59,130,246,0.15);
        }
      `}</style>

      <div className="tj max-w-7xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className={`ti fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold ${toast.type === "error" ? "bg-rose-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <X size={15} /> : <ShieldCheck size={15} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="fu flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Team Management</h1>
            <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              Manage users and their roles
            </p>
          </div>
          <button onClick={() => { setNewUser(EMPTY_NEW); setShowAddModal(true); }}
            className="pbtn flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-md">
            <Plus size={18} /> Add New User
          </button>
        </div>

        {/* Stats */}
        <div className="fu grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8" style={{ animationDelay: "60ms" }}>
          {stats.map((s, i) => (
            <div key={i} className={`scard bg-gradient-to-br ${s.g} rounded-3xl p-5 flex items-center gap-4 text-white shadow-md`}>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">{s.icon}</div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{s.label}</p>
                <p className="text-4xl font-extrabold leading-none mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="fu mb-4" style={{ animationDelay: "90ms" }}>
          <div className="relative max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm text-slate-700" />
          </div>
        </div>

        {/* Table */}
        <div className="fu bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" style={{ animationDelay: "110ms" }}>
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading team members…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-sm">
              <UserCircle2 size={40} className="mx-auto mb-3 text-slate-200" />
              {search ? "No users match your search." : "No team members yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["User", "Email", "Role", "Department", "Actions"].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((m) => {
                    const rs = getRoleStyle(m.role);
                    return (
                      <tr key={m.memberKey} className="trow">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                              {m.profilePic
                                ? <img src={`${API_BASE_URL}${m.profilePic}`} alt={m.name} className="w-full h-full object-cover" />
                                : <div className={`w-full h-full bg-gradient-to-br ${grad(m.gradIdx)} flex items-center justify-center text-white font-bold text-xs`}>{m.avatar}</div>
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                              {m.designation && <p className="text-xs text-slate-400">{m.designation}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{m.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${rs.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />
                            {m.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{m.department}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="act flex justify-end gap-2 opacity-40 transition-opacity">
                            <button onClick={() => openEdit(m)} title="Edit"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => { setDeletingMember(m); setShowDeleteModal(true); }} title="Delete"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <ModalShell title="Add New User" subtitle="Create a new team member account"
          onClose={() => { setShowAddModal(false); setNewUser(EMPTY_NEW); }}>
          <form onSubmit={handleAdd} className="p-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employee ID" required>
                <input type="text" value={newUser.userId} onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })} className={inp} placeholder="EMP001" required />
              </Field>
              <Field label="Full Name" required>
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className={inp} placeholder="Rahul Sharma" required />
              </Field>
              <Field label="Email" required>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className={inp} placeholder="rahul@company.com" required />
              </Field>
              <Field label="Password" required>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={inp} placeholder="••••••••" required />
              </Field>
              <Field label="Role" required>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={inp}>
                  <option>Employee</option><option>Manager</option><option>Reviewer</option>
                </select>
              </Field>
              <Field label="Phone">
                <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className={inp} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Designation">
                <input type="text" value={newUser.designation} onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })} className={inp} placeholder="Software Engineer" />
              </Field>
              <Field label="Department">
                <select value={newUser.departmentId} onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })} className={inp}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Location" cls="sm:col-span-2">
                <input type="text" value={newUser.location} onChange={(e) => setNewUser({ ...newUser, location: e.target.value })} className={inp} placeholder="Mumbai, India" />
              </Field>
            </div>
            <PicUpload previewUrl={newUser.previewUrl} onChange={(e) => handlePicChange(e, setNewUser)} onRemove={() => removePic(setNewUser)} />
            <ModalFooter onCancel={() => { setShowAddModal(false); setNewUser(EMPTY_NEW); }} submitLabel={submitting ? "Creating…" : "Create User"} loading={submitting} />
          </form>
        </ModalShell>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <ModalShell title="Edit User" subtitle="Update team member information"
          onClose={() => setShowEditModal(false)}
          icon={<Edit2 size={17} className="text-blue-500" />}>
          <form onSubmit={handleEdit} className="p-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input type="text" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className={inp} placeholder="Full Name" required />
              </Field>
              <Field label="Email" required>
                <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className={inp} placeholder="email@company.com" required />
              </Field>
              <Field label="Role" required>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className={inp}>
                  <option>Employee</option><option>Manager</option><option>Reviewer</option>
                </select>
              </Field>
              <Field label="Phone">
                <input type="tel" value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} className={inp} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Designation">
                <input type="text" value={editUser.designation} onChange={(e) => setEditUser({ ...editUser, designation: e.target.value })} className={inp} placeholder="Software Engineer" />
              </Field>
              <Field label="Department">
                <select value={editUser.departmentId} onChange={(e) => setEditUser({ ...editUser, departmentId: e.target.value })} className={inp}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Location" cls="sm:col-span-2">
                <input type="text" value={editUser.location} onChange={(e) => setEditUser({ ...editUser, location: e.target.value })} className={inp} placeholder="Mumbai, India" />
              </Field>
            </div>
            <PicUpload previewUrl={editUser.previewUrl} onChange={(e) => handlePicChange(e, setEditUser)} onRemove={() => removePic(setEditUser)} label="Update Profile Picture" />
            <ModalFooter onCancel={() => setShowEditModal(false)} submitLabel={submitting ? "Saving…" : "Save Changes"} loading={submitting} />
          </form>
        </ModalShell>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && deletingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mi bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-rose-600" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Delete User?</h3>
              <p className="text-slate-500 text-sm mb-1">
                You're about to delete <span className="font-semibold text-slate-700">"{deletingMember.name}"</span>.
              </p>
              <p className="text-rose-500 text-xs font-semibold mb-6">This action cannot be undone.</p>

              {/* User preview */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-6 text-left">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad(deletingMember.gradIdx)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {deletingMember.avatar}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{deletingMember.name}</p>
                  <p className="text-xs text-slate-400">{deletingMember.email}</p>
                </div>
                <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleStyle(deletingMember.role).pill}`}>
                  {deletingMember.role}
                </span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleteLoading}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-sm font-semibold transition">
                  {deleteLoading ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* SUB-COMPONENTS */
const ModalShell = ({ title, subtitle, onClose, icon, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="mi bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {icon && <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">{icon}</div>}
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>
);

const Field = ({ label, required, cls = "", children }) => (
  <div className={cls}>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

const PicUpload = ({ previewUrl, onChange, onRemove, label = "Profile Picture" }) => (
  <div>
    <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
    {previewUrl ? (
      <div className="flex items-center gap-4">
        <div className="relative">
          <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
          <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow">
            <X size={12} />
          </button>
        </div>
        <div>
          <label className="cursor-pointer text-sm text-blue-600 hover:underline font-medium">
            Change photo
            <input type="file" accept="image/*" onChange={onChange} className="hidden" />
          </label>
          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG (Max 2MB)</p>
        </div>
      </div>
    ) : (
      <label className="cursor-pointer flex items-center gap-3 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl px-5 py-4 transition group">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition">
          <Upload size={18} className="text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">Click to upload</p>
          <p className="text-xs text-slate-400">PNG, JPG (Max 2MB)</p>
        </div>
        <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
    )}
  </div>
);

const ModalFooter = ({ onCancel, submitLabel, loading }) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel} disabled={loading}
      className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
      Cancel
    </button>
    <button type="submit" disabled={loading}
      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl transition">
      {submitLabel}
    </button>
  </div>
);

export default Team;