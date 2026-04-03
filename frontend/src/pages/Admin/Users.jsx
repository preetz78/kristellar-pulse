// src/pages/Admin/Users.jsx
import { useState } from "react";
import { 
  Plus, Search, Eye, Edit2, Trash2, Mail, Building, X, Phone, User, Briefcase 
} from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Prajyoti Panda",
      email: "prajyoti@gmail.com",
      phone: "+91 98765 43210",
      org: "TechFlow",
      role: "Org Admin",
      department: "Engineering",
      manager: "Sarah Chen",
    },
    {
      id: 2,
      name: "Aman Verma",
      email: "aman@gmail.com",
      phone: "+91 87654 32109",
      org: "GreenGrid",
      role: "Project Manager",
      department: "Operations",
      manager: "Rahul Sharma",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Add User Form State
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    role: "",
    department: "",
    manager: "",
  });

  // Edit User Form State
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    role: "",
    department: "",
    manager: "",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.org.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    const colors = {
      "Org Admin": "bg-blue-100 text-blue-700 border border-blue-300",
      "Project Manager": "bg-indigo-100 text-indigo-700 border border-indigo-300",
      "Team Lead": "bg-amber-100 text-amber-700 border border-amber-300",
      "Member": "bg-emerald-100 text-emerald-700 border border-emerald-300",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border border-gray-300";
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      organization: user.org,
      role: user.role,
      department: user.department || "",
      manager: user.manager || "",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.organization) {
      alert("Please fill required fields: Name, Email, and Organization");
      return;
    }

    const newId = Math.max(0, ...users.map(u => u.id)) + 1;
    
    setUsers([...users, {
      id: newId,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      org: newUser.organization,
      role: newUser.role || "Member",
      department: newUser.department,
      manager: newUser.manager,
    }]);

    setNewUser({
      name: "",
      email: "",
      phone: "",
      organization: "",
      role: "",
      department: "",
      manager: "",
    });
    setShowAddModal(false);
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    if (!editUser.name || !editUser.email || !editUser.organization) {
      alert("Please fill required fields: Name, Email, and Organization");
      return;
    }

    setUsers(users.map((user) =>
      user.id === editingUser.id
        ? {
            ...user,
            name: editUser.name,
            email: editUser.email,
            phone: editUser.phone,
            org: editUser.organization,
            role: editUser.role || "Member",
            department: editUser.department,
            manager: editUser.manager,
          }
        : user
    ));

    closeEditModal();
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      closeDeleteModal();
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Users</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Manage and oversee all system users
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden hover:border-blue-400 transition-all duration-300">
        <table className="w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-blue-700">Name</th>
              <th className="px-6 py-4 font-semibold text-blue-700">Email</th>
              <th className="px-6 py-4 font-semibold text-blue-700">Organization</th>
              <th className="px-6 py-4 font-semibold text-blue-700">Role</th>
              <th className="px-6 py-4 font-semibold text-blue-700 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-blue-100">
            {filteredUsers.map((user, idx) => (
              <tr
                key={user.id}
                onMouseEnter={() => setHoveredRow(idx)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`transition-all duration-300 ${
                  hoveredRow === idx 
                    ? "bg-blue-50 border-l-4 border-l-blue-600" 
                    : "hover:bg-gray-50 border-l-4 border-l-transparent"
                }`}
              >
                <td className="px-6 py-5 font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {user.name}
                  </div>
                </td>

                <td className="px-6 py-5 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {user.email}
                  </div>
                </td>

                <td className="px-6 py-5 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-gray-400" />
                    {user.org}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>

                <td className="px-6 py-5 flex justify-end gap-2">
                  <button
                    onClick={() => openViewModal(user)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      hoveredRow === idx
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                    title="View"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => openEditModal(user)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      hoveredRow === idx
                        ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                        : "text-amber-600 hover:bg-amber-50"
                    }`}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => openDeleteModal(user)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      hoveredRow === idx
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No users found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search terms</p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredUsers.length > 0 && (
        <div className="mt-6 text-right text-sm text-gray-600">
          Showing <span className="font-semibold text-blue-700">{filteredUsers.length}</span> of <span className="font-semibold text-blue-700">{users.length}</span> users
        </div>
      )}

      {/* ==================== ADD USER MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-white rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-gray-900">Add New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 overflow-y-auto max-h-[calc(92vh-80px)] space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="john.doe@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                <select
                  value={newUser.organization}
                  onChange={(e) => setNewUser({ ...newUser, organization: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  required
                >
                  <option value="">Select Organization</option>
                  <option value="TechFlow">TechFlow</option>
                  <option value="GreenGrid">GreenGrid</option>
                  <option value="NextGen AI">NextGen AI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                >
                  <option value="">Select Role</option>
                  <option value="Org Admin">Org Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Member">Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager</label>
                <input
                  type="text"
                  value={newUser.manager}
                  onChange={(e) => setNewUser({ ...newUser, manager: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="Sarah Chen"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-medium transition"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW USER MODAL ==================== */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold border border-white/30">
                  {selectedUser.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{selectedUser.name}</h2>
                  <p className="text-blue-100">{selectedUser.role}</p>
                </div>
              </div>
              <button
                onClick={closeViewModal}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Organization</p>
                    <p className="font-medium text-gray-900">{selectedUser.org}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{selectedUser.department || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Manager</p>
                    <p className="font-medium text-gray-900">{selectedUser.manager || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t bg-gray-50 flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT USER MODAL ==================== */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-white rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-gray-900">Edit User</h2>
              <button 
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-8 overflow-y-auto max-h-[calc(92vh-80px)] space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                <select
                  value={editUser.organization}
                  onChange={(e) => setEditUser({ ...editUser, organization: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  required
                >
                  <option value="">Select Organization</option>
                  <option value="TechFlow">TechFlow</option>
                  <option value="GreenGrid">GreenGrid</option>
                  <option value="NextGen AI">NextGen AI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                >
                  <option value="">Select Role</option>
                  <option value="Org Admin">Org Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Member">Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={editUser.department}
                  onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager</label>
                <input
                  type="text"
                  value={editUser.manager}
                  onChange={(e) => setEditUser({ ...editUser, manager: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  placeholder="Sarah Chen"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-medium transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-red-50 rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-red-600">Delete User</h2>
              <button 
                onClick={closeDeleteModal}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this user?</p>
              <p className="text-xl font-semibold text-gray-900 mb-8">{userToDelete.name}</p>
              <p className="text-sm text-red-600 mb-8">This action cannot be undone.</p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 py-3.5 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;