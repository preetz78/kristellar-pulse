// src/pages/Admin/Team.jsx
import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  UserCheck, 
  Shield,
  Upload,
  X 
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Reviewer",
    profilePic: null,
    previewUrl: null,
  });

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const [hoveredRow, setHoveredRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all users from backend (excluding Admin)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/users`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let users = await response.json();

      // Hide Admin from the team table
      users = users.filter(user => user.role.toLowerCase() !== 'admin');

      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        avatar: user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        profilePic: user.profile_picture || null,
      }));

      setTeamMembers(formattedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Add New User
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill all required fields (Name, Email, Password)");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', newUser.name);
    formData.append('email', newUser.email);
    formData.append('password', newUser.password);
    formData.append('role', newUser.role.toLowerCase());

    if (newUser.profilePic) {
      formData.append('profile_picture', newUser.profilePic);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("User created successfully!");
        resetNewUserForm();
        setShowAddModal(false);
        fetchUsers();
      } else {
        alert(result.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please check the backend terminal for detailed error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit User - FIXED & IMPROVED
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!editingUser.name || !editingUser.email) {
      alert("Name and Email are required");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', editingUser.name);
    formData.append('email', editingUser.email);
    formData.append('role', editingUser.role.toLowerCase());

    // Only append password if user entered a new one
    if (editingUser.password && editingUser.password.trim() !== '') {
      formData.append('password', editingUser.password);
    }

    // Only append profile picture if a NEW file was selected (not the preview URL)
    if (editingUser.profilePic instanceof File) {
      formData.append('profile_picture', editingUser.profilePic);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("User updated successfully!");
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();           // Refresh list to show updated data
      } else {
        alert(result.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please check the backend terminal.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${deletingUserId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("User deleted successfully!");
        setShowDeleteModal(false);
        setDeletingUserId(null);
        fetchUsers();
      } else {
        alert(result.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please check the backend terminal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfilePicChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      
      if (isEdit && editingUser) {
        setEditingUser({
          ...editingUser,
          profilePic: file,
          previewUrl: previewUrl
        });
      } else {
        setNewUser({
          ...newUser,
          profilePic: file,
          previewUrl: previewUrl
        });
      }
    }
  };

  const removeProfilePic = (isEdit = false) => {
    if (isEdit && editingUser) {
      setEditingUser({
        ...editingUser,
        profilePic: null,
        previewUrl: null
      });
    } else {
      setNewUser({
        ...newUser,
        profilePic: null,
        previewUrl: null
      });
    }
  };

  const openEditModal = (member) => {
    setEditingUser({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      password: "",           
      profilePic: null,                 // Important: start with null (no new file)
      previewUrl: member.profilePic ? `${API_BASE_URL}${member.profilePic}` : null,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (id) => {
    setDeletingUserId(id);
    setShowDeleteModal(true);
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "Reviewer",
      profilePic: null,
      previewUrl: null,
    });
  };

  const getRoleStyle = (role) => {
    if (role === "Manager") return "bg-blue-100 text-blue-700 border border-blue-300";
    if (role === "Reviewer") return "bg-purple-100 text-purple-700 border border-purple-300";
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  };

  if (loading) {
    return <div className="p-6 text-center">Loading team members...</div>;
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Team Management</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Manage users and their roles
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Plus size={18} />
          Add New User
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Managers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {teamMembers.filter(m => m.role === "Manager").length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {teamMembers.map((member, idx) => (
                <tr 
                  key={member.id}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-semibold text-sm overflow-hidden border border-white">
                        {member.profilePic ? (
                          <img 
                            src={`${API_BASE_URL}${member.profilePic}`} 
                            alt={member.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          member.avatar
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">{member.email}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-block px-4 py-1.5 text-xs font-semibold rounded-xl border ${getRoleStyle(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className={`flex gap-2 justify-end transition-opacity ${hoveredRow === idx ? 'opacity-100' : 'opacity-40'}`}>
                      <button 
                        onClick={() => openEditModal(member)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-xl transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(member.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-xl transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Add New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="Rahul Sharma"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="rahul@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Manager">Manager</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>

              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Picture</label>
                <label className="cursor-pointer block border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-all">
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-blue-500 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload profile picture</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleProfilePicChange(e, false)}
                    className="hidden"
                  />
                </label>

                {newUser.previewUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative">
                      <img 
                        src={newUser.previewUrl} 
                        alt="Preview" 
                        className="w-28 h-28 rounded-2xl object-cover border border-blue-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeProfilePic(false)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Edit User</h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="hover:bg-white/20 p-2 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password (optional)</label>
                <input
                  type="password"
                  value={editingUser.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Manager">Manager</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>

              {/* Profile Picture Upload for Edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Picture</label>
                
                <label className="cursor-pointer block border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-all">
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-blue-500 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to change profile picture</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleProfilePicChange(e, true)}
                    className="hidden"
                  />
                </label>

                {editingUser.previewUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative">
                      <img 
                        src={editingUser.previewUrl} 
                        alt="Preview" 
                        className="w-28 h-28 rounded-2xl object-cover border border-blue-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeProfilePic(true)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
                  {submitting ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-600 mb-8">
                This action cannot be undone. The user will be permanently removed.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingUserId(null); }}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
                  {submitting ? "Deleting..." : "Yes, Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;