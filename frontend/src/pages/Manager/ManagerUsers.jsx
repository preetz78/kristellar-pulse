import React, { useState } from 'react';
import { Search, Users, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

const ManagerUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Sample Team Members Data
  const users = [
    {
      id: 1,
      name: "Anika Sharma",
      email: "anika.sharma@company.com",
      role: "Frontend Developer",
      avatar: "AS",
      avatarColor: "from-pink-500 to-rose-500",
      tasksAssigned: 12,
      tasksCompleted: 10,
      completionRate: 83,
      projects: ["Mobile Banking App", "AI Dashboard"],
      joinDate: "Jan 2025",
      status: "Active"
    },
    {
      id: 2,
      name: "Rahul Verma",
      email: "rahul.verma@company.com",
      role: "Backend Developer",
      avatar: "RV",
      avatarColor: "from-blue-500 to-indigo-600",
      tasksAssigned: 15,
      tasksCompleted: 14,
      completionRate: 93,
      projects: ["E-commerce Platform", "HR Management"],
      joinDate: "Dec 2024",
      status: "Active"
    },
    {
      id: 3,
      name: "Priya Patel",
      email: "priya.patel@company.com",
      role: "UI/UX Designer",
      avatar: "PP",
      avatarColor: "from-purple-500 to-violet-600",
      tasksAssigned: 8,
      tasksCompleted: 7,
      completionRate: 88,
      projects: ["Mobile Banking App"],
      joinDate: "Feb 2025",
      status: "Active"
    },
    {
      id: 4,
      name: "Amit Kumar",
      email: "amit.kumar@company.com",
      role: "DevOps Engineer",
      avatar: "AK",
      avatarColor: "from-emerald-500 to-teal-600",
      tasksAssigned: 6,
      tasksCompleted: 6,
      completionRate: 100,
      projects: ["E-commerce Platform"],
      joinDate: "Nov 2024",
      status: "Active"
    },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openUserDetail = (user) => {
    setSelectedUser(user);
  };

  const closeDetail = () => {
    setSelectedUser(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Team Members</h1>
          <p className="text-gray-600 mt-1">View and monitor your team performance</p>
        </div>
        {/* <div className="text-sm text-gray-500">
          {filteredUsers.length} Members
        </div> */}
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name, email or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-blue-100 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-blue-100 bg-blue-50">
              <th className="px-6 py-5 text-left text-sm font-medium text-gray-500">Member</th>
              <th className="px-6 py-5 text-left text-sm font-medium text-gray-500">Role</th>
              <th className="px-6 py-5 text-left text-sm font-medium text-gray-500">Tasks</th>
              <th className="px-6 py-5 text-left text-sm font-medium text-gray-500">Completion</th>
              <th className="px-6 py-5 text-left text-sm font-medium text-gray-500">Projects</th>
              <th className="px-6 py-5 text-center text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {filteredUsers.map((user) => (
              <tr 
                key={user.id}
                onClick={() => openUserDetail(user)}
                className="hover:bg-blue-50/70 transition-all duration-200 cursor-pointer group"
              >
                {/* Avatar + Name */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-semibold text-lg shadow-sm`}>
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-5">
                  <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-2xl">
                    {user.role}
                  </span>
                </td>

                {/* Tasks */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="font-medium">{user.tasksAssigned}</span>
                    <span className="text-gray-400 text-sm">assigned</span>
                  </div>
                </td>

                {/* Completion Rate */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                        style={{ width: `${user.completionRate}%` }}
                      />
                    </div>
                    <span className="font-semibold text-blue-600">{user.completionRate}%</span>
                  </div>
                </td>

                {/* Projects */}
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {user.projects.slice(0, 2).map((proj, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-xl">
                        {proj}
                      </span>
                    ))}
                    {user.projects.length > 2 && (
                      <span className="text-xs text-gray-400">+{user.projects.length - 2}</span>
                    )}
                  </div>
                </td>

                {/* View Button */}
                <td className="px-6 py-5 text-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openUserDetail(user); }}
                    className="px-5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div 
            className="bg-white w-full max-w-lg h-full overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${selectedUser.avatarColor} flex items-center justify-center text-white text-3xl font-semibold`}>
                  {selectedUser.avatar}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-blue-600">{selectedUser.role}</p>
                </div>
              </div>
              <button 
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-2xl p-5">
                  <p className="text-sm text-gray-500">Tasks Assigned</p>
                  <p className="text-3xl font-semibold text-blue-700 mt-1">{selectedUser.tasksAssigned}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-5">
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-3xl font-semibold text-emerald-600 mt-1">{selectedUser.completionRate}%</p>
                </div>
              </div>

              {/* Projects */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Users size={18} /> Projects Involved
                </h3>
                <div className="space-y-2">
                  {selectedUser.projects.map((project, i) => (
                    <div key={i} className="bg-white border border-blue-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{project}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Summary */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Recent Activity</h3>
                <div className="text-sm text-gray-500 space-y-3 pl-2 border-l-2 border-blue-200">
                  <p>• Completed "Design Login Flow" • 2 days ago</p>
                  <p>• Started working on "{selectedUser.projects[0]}" tasks • 5 days ago</p>
                  <p>• Joined team meeting • 1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerUsers;