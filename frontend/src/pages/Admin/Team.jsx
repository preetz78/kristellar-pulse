// src/pages/Admin/Team.jsx
import { useState } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  UserCheck, 
  Shield 
} from "lucide-react";

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Sarah Connor",
      email: "sarah.connor@company.com",
      role: "Manager",
      status: "Active",
      avatar: "SC",
    },
    {
      id: 2,
      name: "Alex Kumar",
      email: "alex.kumar@company.com",
      role: "Employee",
      status: "Active",
      avatar: "AK",
    },
    {
      id: 3,
      name: "Priya Sharma",
      email: "priya.sharma@company.com",
      role: "Employee",
      status: "Active",
      avatar: "PS",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
  });

  const [hoveredRow, setHoveredRow] = useState(null);

  const handleAddUser = (e) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill all required fields");
      return;
    }

    const newMember = {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "Active",
      avatar: newUser.name.split(" ").map(n => n[0]).join("").toUpperCase(),
    };

    setTeamMembers([...teamMembers, newMember]);
    
    // Reset form
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "Employee",
    });
    
    setShowAddModal(false);
    alert("User created successfully!");
  };

  const getRoleStyle = (role) => {
    if (role === "Admin") return "bg-purple-100 text-purple-700 border border-purple-300";
    if (role === "Manager") return "bg-blue-100 text-blue-700 border border-blue-300";
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  };

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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-semibold text-sm">
                        {member.avatar}
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
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className={`flex gap-2 justify-end transition-opacity ${hoveredRow === idx ? 'opacity-100' : 'opacity-40'}`}>
                      <button className="p-2 hover:bg-blue-100 text-blue-600 rounded-xl transition">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-100 text-red-600 rounded-xl transition">
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

      {/* ==================== ADD USER MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Add New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
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
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="john.doe@company.com"
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
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;