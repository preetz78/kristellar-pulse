// src/pages/Admin/Team.jsx
import { useState, useEffect } from "react";
import { Edit2, Users, ShieldCheck, UserCheck } from "lucide-react";
import apiConfig from "../../config/apiConfig";

const ROLE_STYLES = {
  Manager:  { pill: "bg-blue-100 text-blue-700 border border-blue-200" },
  Reviewer: { pill: "bg-violet-100 text-violet-700 border border-violet-200" },
  Admin:    { pill: "bg-rose-100 text-rose-700 border border-rose-200" },
  Employee: { pill: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
};

const getRoleStyle = (role) => ROLE_STYLES[role] || ROLE_STYLES.Employee;

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = apiConfig.API_BASE_URL || "http://localhost:5000";
  const token = sessionStorage.getItem("token");

  /* ── Fetch Data ───────────────────────────────────────────── */
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || data || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      console.log(data);
      // API returns data: users, not users directly
      let users = data.data || data.users || [];

      // Filter out Admins if needed
      users = users.filter((u) => (u.office_role?.toLowerCase() || "employee") !== "admin");

      setTeamMembers(
        users.map((u, i) => ({
          id: u.id,
          name: u.name || `${u.firstname || ''} ${u.lastname || ''}`.trim(),
          email: u.email_id || u.email || "",
          role: u.office_role ? u.office_role.charAt(0).toUpperCase() + u.office_role.slice(1).toLowerCase() : "Employee",
          department: u.department || "—",
          departmentId: u.department_id || "",
          phone: u.work_phone || u.phone || "",
          designation: u.designation || "",
          location: u.location || "",
          bio: u.bio || "",
          profilePic: u.profile_picture || null,
          avatar: (u.name || `${u.firstname || ''} ${u.lastname || ''}`.trim()).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "US",
        }))
      );
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const filtered = teamMembers.filter((m) =>
    [m.name, m.email, m.role, m.department].some((s) =>
      s.toLowerCase().includes(search.toLowerCase())
    )
  );

  /* ── Edit Role ───────────────────────────────────────────── */
  const openEdit = (member) => {
    setEditUser({ ...member });
    setShowEditModal(true);
  };

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${editUser.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: editUser.role.toLowerCase(),
          // Other fields remain unchanged
        }),
      });

      if (res.ok) {
        alert("Role updated successfully!");
        setShowEditModal(false);
        await fetchUsers(); // Refresh list
      } else {
        alert("Failed to update role");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Stats ───────────────────────────────────────────────── */
  const totalUsers = teamMembers.length;
  const managers = teamMembers.filter((m) => m.role === "Manager").length;
  const reviewers = teamMembers.filter((m) => m.role === "Reviewer").length;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: <Users size={22} />, color: "from-blue-500 to-blue-600" },
    { label: "Managers", value: managers, icon: <ShieldCheck size={22} />, color: "from-indigo-500 to-violet-600" },
    { label: "Reviewers", value: reviewers, icon: <UserCheck size={22} />, color: "from-violet-500 to-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Team Management</h1>
            <p className="text-slate-500 mt-1">Manage team members and their roles</p>
          </div>
        </div>

        {/* Stats Cards - Matching your other dashboards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-semibold mt-3">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role or department..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading team members...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-400">No team members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Department</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((member) => {
                    const rs = getRoleStyle(member.role);
                    return (
                      <tr key={member.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                              {member.profilePic ? (
                                <img
                                  src={`${API_BASE_URL}${member.profilePic}`}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                                  {member.avatar}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{member.name}</p>
                              {member.designation && (
                                <p className="text-xs text-slate-500">{member.designation}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{member.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${rs.pill}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{member.department}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEdit(member)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          >
                            <Edit2 size={16} />
                            Edit Role
                          </button>
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

      {/* EDIT ROLE MODAL */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[28px] shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50">
              <h2 className="text-xl font-semibold text-slate-800">Edit User Role</h2>
              <p className="text-sm text-slate-500 mt-1">Only role can be changed</p>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info (Read Only) */}
              <div className="flex gap-4 bg-slate-50 p-4 rounded-xl">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                  {editUser.profilePic ? (
                    <img
                      src={`${API_BASE_URL}${editUser.profilePic}`}
                      alt={editUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                      {editUser.avatar}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{editUser.name}</p>
                  <p className="text-slate-500">{editUser.email}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {editUser.designation} • {editUser.department}
                  </p>
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Change Role
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70"
              >
                {submitting ? "Updating..." : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;