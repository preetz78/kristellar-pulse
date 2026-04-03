// src/pages/Admin/AccessControl.jsx
import { useState } from "react";
import { Shield, Check, X } from "lucide-react";

const AccessControl = () => {
  const [selectedRole, setSelectedRole] = useState("Admin");

  const [permissions, setPermissions] = useState([
    { module: "Organizations", view: true, create: true, edit: true, delete: true },
    { module: "Users", view: true, create: true, edit: false, delete: false },
    { module: "Projects", view: true, create: true, edit: true, delete: false },
    { module: "Tasks", view: true, create: true, edit: true, delete: false },
    { module: "Access Control", view: true, create: false, edit: true, delete: false },
    { module: "Audit Logs", view: true, create: false, edit: false, delete: false },
  ]);

  const roles = ["Admin", "Manager", "Team Lead", "Employee"];

  const togglePermission = (index, type) => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [type]: !updated[index][type]
      };
      return updated;
    });
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700 flex items-center gap-3">
            <Shield className="text-blue-600" size={28} />
            Access Control
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Manage role-based permissions across the system
          </p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
        <span className="text-gray-700 font-medium text-sm">Selected Role:</span>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
        >
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {/* Permissions Table */}
      <div className="bg-white border border-blue-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
          <h2 className="text-xl font-semibold text-gray-800">Module Permissions</h2>
          <p className="text-gray-600 text-sm mt-0.5">
            Control what <span className="font-semibold text-blue-600">{selectedRole}</span> can do
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-blue-50">
                <th className="text-left py-4 px-6 font-semibold text-blue-700 w-64 text-sm">
                  Module
                </th>
                {["View", "Create", "Edit", "Delete"].map((col) => (
                  <th
                    key={col}
                    className="text-center py-4 font-semibold text-blue-700 w-28 text-sm"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {permissions.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="py-5 px-6 font-medium text-gray-800 text-sm">
                    {item.module}
                  </td>

                  {["view", "create", "edit", "delete"].map((type) => (
                    <td key={type} className="py-5 text-center">
                      <button
                        onClick={() => togglePermission(index, type)}
                        className={`w-9 h-9 mx-auto rounded-2xl flex items-center justify-center transition-all hover:scale-110 ${
                          item[type]
                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                            : "bg-red-100 text-red-500 hover:bg-red-200"
                        }`}
                      >
                        {item[type] ? <Check size={18} /> : <X size={18} />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-700 text-sm">
        <strong>Tip:</strong> Changes made here will apply immediately to all users with the selected role. 
        Consider reviewing Audit Logs after making major permission changes.
      </div>
    </div>
  );
};

export default AccessControl;