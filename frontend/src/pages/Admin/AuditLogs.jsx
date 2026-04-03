// src/pages/Admin/AuditLogs.jsx
import { useState } from "react";
import { Shield, Search, Download, Clock, Filter } from "lucide-react";

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("All");

  const auditLogs = [
    {
      id: 1,
      userName: "Alice Johnson",
      userRole: "Admin",
      userEmail: "alice.johnson@ccmcare.com",
      action: "File Modification",
      timestamp: "2023-12-07 08:30:45",
      avatar: "👩‍💼",
    },
    {
      id: 2,
      userName: "Marcus Greene",
      userRole: "Manager",
      userEmail: "marcus.greene@ccmcare.com",
      action: "File Created",
      timestamp: "2023-12-07 09:15:22",
      avatar: "👨‍💼",
    },
    {
      id: 3,
      userName: "Emily Rodriguez",
      userRole: "Team Lead",
      userEmail: "emily.rodriguez@ccmcare.com",
      action: "Settings Change",
      timestamp: "2023-12-07 10:05:10",
      avatar: "👩🏻",
    },
    {
      id: 4,
      userName: "Nathan Carter",
      userRole: "Employee",
      userEmail: "nathan.carter@ccmcare.com",
      action: "File Access",
      timestamp: "2023-12-07 11:20:33",
      avatar: "👨",
    },
    {
      id: 5,
      userName: "Olivia Parker",
      userRole: "Manager",
      userEmail: "olivia.parker@ccmcare.com",
      action: "Data Retrieval",
      timestamp: "2023-12-07 12:45:19",
      avatar: "👩‍💼",
    },
    {
      id: 6,
      userName: "Jordan Bennett",
      userRole: "Team Lead",
      userEmail: "jordan.bennett@ccmcare.com",
      action: "Settings Change",
      timestamp: "2023-12-07 14:30:05",
      avatar: "👨🏻",
    },
    {
      id: 7,
      userName: "Samantha Wells",
      userRole: "Employee",
      userEmail: "samantha.wells@ccmcare.com",
      action: "File Access",
      timestamp: "2023-12-07 16:10:47",
      avatar: "👩",
    },
    {
      id: 8,
      userName: "Isaac Foster",
      userRole: "Manager",
      userEmail: "isaac.foster@ccmcare.com",
      action: "File Created",
      timestamp: "2023-12-07 18:40:12",
      avatar: "👨‍💼",
    },
  ];

  const actions = ["All", "File Modification", "File Created", "Settings Change", "File Access", "Data Retrieval"];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === "All" || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700 flex items-center gap-3">
            <Shield className="text-blue-600" size={28} />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-1 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Track all system activities and user actions
          </p>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-sm"
          />
        </div>

        {/* Action Filter */}
        <div className="w-full md:w-72">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-5 py-3 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-sm text-gray-700"
          >
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-blue-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full table-fixed">
            <thead>
              <tr className="bg-blue-50 border-b border-blue-100">
                <th className="text-left py-5 px-8 font-semibold text-blue-700 w-80 text-sm">User</th>
                <th className="text-left py-5 px-6 font-semibold text-blue-700 text-sm">Email</th>
                <th className="text-left py-5 px-8 font-semibold text-blue-700 text-sm">Action</th>
                <th className="text-left py-5 px-8 font-semibold text-blue-700 w-52 text-sm">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center text-xl border border-blue-100">
                        {log.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{log.userName}</p>
                        <p className="text-xs text-gray-500">{log.userRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <a 
                      href={`mailto:${log.userEmail}`} 
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {log.userEmail}
                    </a>
                  </td>
                  <td className="py-5 px-8">
                    <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-gray-600 font-medium text-sm">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No audit logs found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;