// src/pages/Manager/ManagerTeamManagement.jsx
import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  UserCheck, 
  Upload,
  X 
} from "lucide-react";

import apiConfig from "../../config/apiConfig";

const ManagerTeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    employeeId: "",
    email: "",
    password: "",
    phone: "",
    designation: "",
    profilePic: null,
    previewUrl: null,
  });

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('token');

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/employees`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch employees: ${response.status}`);

      const result = await response.json();
      if (result.success) {
        const formatted = result.data.map(emp => ({
          id: emp.id,
          employeeId: emp.employee_id,
          name: emp.name || "",
          email: emp.email || "",
          phone: emp.phone || "—",
          designation: emp.designation || "—",
          avatar: (emp.name || "??").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
          profile_picture: emp.profile_picture,
        }));
        setTeamMembers(formatted);
      } else {
        throw new Error(result.message || "Failed to load data");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load team members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add New Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.employeeId || !newEmployee.email || !newEmployee.password) {
      alert("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    const token = sessionStorage.getItem('token');
    const formData = new FormData();

    formData.append('name', newEmployee.name);
    formData.append('employee_id', newEmployee.employeeId.toUpperCase());
    formData.append('email', newEmployee.email);
    formData.append('password', newEmployee.password);
    if (newEmployee.phone) formData.append('phone', newEmployee.phone);
    if (newEmployee.designation) formData.append('designation', newEmployee.designation);
    if (newEmployee.profilePic) formData.append('profile_picture', newEmployee.profilePic);

    try {
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/employees`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert("Employee added successfully!");
        setShowAddModal(false);
        resetNewEmployeeForm();
        fetchEmployees();
      } else {
        alert(result.message || "Failed to add employee");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setSubmitting(true);
    const token = sessionStorage.getItem('token');
    const formData = new FormData();

    formData.append('name', editingEmployee.name);
    formData.append('employee_id', editingEmployee.employeeId);
    formData.append('email', editingEmployee.email);
    if (editingEmployee.phone) formData.append('phone', editingEmployee.phone);
    if (editingEmployee.designation) formData.append('designation', editingEmployee.designation);
    if (editingEmployee.profilePic) formData.append('profile_picture', editingEmployee.profilePic);

    try {
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert("Employee updated successfully!");
        setShowEditModal(false);
        fetchEmployees();
      } else {
        alert(result.message || "Failed to update employee");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating employee. Please check console.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async () => {
    if (!deletingEmployeeId) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/manager/employees/${deletingEmployeeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        alert("Employee deleted successfully");
        setShowDeleteModal(false);
        fetchEmployees();
      } else {
        alert(result.message || "Failed to delete");
      }
    } catch (err) {
      alert("Error deleting employee");
    }
  };

  const openEditModal = (member) => {
    setEditingEmployee({ 
      ...member,
      profilePic: null,
      previewUrl: member.profile_picture 
        ? `${apiConfig.API_BASE_URL}${member.profile_picture}` 
        : null
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (id) => {
    setDeletingEmployeeId(id);
    setShowDeleteModal(true);
  };

  const resetNewEmployeeForm = () => {
    setNewEmployee({
      name: "",
      employeeId: "",
      email: "",
      password: "",
      phone: "",
      designation: "",
      profilePic: null,
      previewUrl: null,
    });
  };

  if (loading) return <div className="p-6 text-center">Loading team members...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Team Management</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Manage your team members and assignments
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-medium transition-all shadow-lg"
        >
          <Plus size={18} />
          Add New Employee
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Team Table */}
      <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50">
                <th className="px-5 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-5 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-5 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-5 py-4 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-2xl overflow-hidden border border-white shadow-sm flex-shrink-0 bg-gray-100">
                        {member.profile_picture ? (
                          <img 
                            src={`${apiConfig.API_BASE_URL}${member.profile_picture}`} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              // Show fallback avatar
                              const fallback = e.target.parentElement.querySelector('.fallback-avatar');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback Avatar (Initials) */}
                        <div 
                          className="fallback-avatar w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm"
                          style={{ display: member.profile_picture ? 'none' : 'flex' }}
                        >
                          {member.avatar}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-medium text-gray-700">{member.employeeId}</td>

                  <td className="px-5 py-4">
                    <p className="text-gray-600 text-sm">{member.email}</p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-block px-4 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      {member.designation}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className={`flex gap-2 justify-end transition-opacity ${hoveredRow === idx ? 'opacity-100' : 'opacity-40'}`}>
                      <button 
                        onClick={() => openEditModal(member)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-xl transition"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(member.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-xl transition"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Employee Modal - Unchanged */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-2xl font-semibold">Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-2 rounded-full transition">✕</button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={newEmployee.name} 
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  placeholder="Aarav Mehta" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee ID</label>
                <input 
                  type="text" 
                  value={newEmployee.employeeId} 
                  onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  placeholder="KA001" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={newEmployee.email} 
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  placeholder="aarav@company.com" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={newEmployee.password} 
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  value={newEmployee.phone} 
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  placeholder="9876543210" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
                <input 
                  type="text" 
                  value={newEmployee.designation} 
                  onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  placeholder="Frontend Developer" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Picture</label>
                <label className="cursor-pointer block border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-all">
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-blue-500 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload profile picture</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setNewEmployee({ ...newEmployee, profilePic: file, previewUrl: URL.createObjectURL(file) });
                    }}
                    className="hidden"
                  />
                </label>

                {newEmployee.previewUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative">
                      <img src={newEmployee.previewUrl} alt="Preview" className="w-28 h-28 rounded-2xl object-cover border border-blue-200 shadow-sm" />
                      <button 
                        type="button" 
                        onClick={() => setNewEmployee({ ...newEmployee, profilePic: null, previewUrl: null })} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
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
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-2xl font-semibold">Edit Employee</h2>
              <button onClick={() => setShowEditModal(false)} className="hover:bg-white/20 p-2 rounded-full transition">✕</button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={editingEmployee.name} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee ID</label>
                <input 
                  type="text" 
                  value={editingEmployee.employeeId} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeId: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={editingEmployee.email} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  value={editingEmployee.phone || ""} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
                <input 
                  type="text" 
                  value={editingEmployee.designation} 
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })} 
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Picture</label>
                <label className="cursor-pointer block border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-all">
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-blue-500 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload new profile picture</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditingEmployee({ 
                          ...editingEmployee, 
                          profilePic: file, 
                          previewUrl: URL.createObjectURL(file) 
                        });
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {editingEmployee.previewUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative">
                      <img 
                        src={editingEmployee.previewUrl} 
                        alt="Preview" 
                        className="w-28 h-28 rounded-2xl object-cover border border-blue-200 shadow-sm" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setEditingEmployee({ 
                          ...editingEmployee, 
                          profilePic: null, 
                          previewUrl: null 
                        })} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
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
                  onClick={() => setShowEditModal(false)} 
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
                  {submitting ? "Updating..." : "Update Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Delete Employee?</h3>
              <p className="text-gray-600 mb-8">This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => { 
                    setShowDeleteModal(false); 
                    setDeletingEmployeeId(null); 
                  }} 
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteEmployee} 
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium"
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

export default ManagerTeamManagement;