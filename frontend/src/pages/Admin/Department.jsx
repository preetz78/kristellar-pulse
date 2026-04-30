// frontend/src/pages/Admin/Department.jsx
import { useState, useEffect } from 'react';
import { Plus, Building2, Trash2, X, Pencil, Users, UserCheck, ChevronRight } from 'lucide-react';
import apiConfig from '../../config/apiConfig';

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  const API_BASE_URL = apiConfig.API_BASE_URL || 'http://localhost:5000';
  const token = sessionStorage.getItem('token');

  // Fetch all departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || data || []);
      } else {
        setError('Failed to load departments');
      }
    } catch (err) {
      console.error('Fetch departments error:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Helpers 
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setModalError('');
    setError('');
  };

  //Create Modal
  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Department name is required');
      return;
    }
    setSubmitLoading(true);
    setModalError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        await fetchDepartments();
        showSuccess('Department created successfully!');
        setTimeout(() => handleCloseCreateModal(), 800);
      } else {
        setModalError(result.message || 'Failed to create department');
      }
    } catch (err) {
      console.error('Create department error:', err);
      setModalError('Failed to create department. Please check your connection.');
    } finally {
      setSubmitLoading(false);
    }
  };

  //Edit Modal 
  const handleOpenEditModal = (dept) => {
    setSelectedDept(dept);
    setEditFormData({ name: dept.name, description: dept.description || '' });
    setModalError('');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDept(null);
    setModalError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setModalError('Department name is required');
      return;
    }
    setSubmitLoading(true);
    setModalError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments/${selectedDept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          description: editFormData.description.trim() || null,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        await fetchDepartments();
        showSuccess('Department updated successfully!');
        setTimeout(() => handleCloseEditModal(), 800);
      } else {
        setModalError(result.message || 'Failed to update department');
      }
    } catch (err) {
      console.error('Update department error:', err);
      setModalError('Failed to update department. Please check your connection.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Modal
  const handleOpenDeleteModal = (dept) => {
    setSelectedDept(dept);
    setModalError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedDept(null);
    setModalError('');
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setModalError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments/${selectedDept.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDepartments((prev) => prev.filter((d) => d.id !== selectedDept.id));
        showSuccess('Department deleted successfully!');
        handleCloseDeleteModal();
      } else {
        const result = await res.json();
        setModalError(result.message || 'Failed to delete department');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setModalError('Failed to delete department. Please check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Shared field change 
  const handleChange = (e, setter) => {
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <style>{`
        .dept-card { transition: box-shadow 0.22s ease, transform 0.22s ease; }
        .dept-card:hover { box-shadow: 0 12px 36px -8px rgba(37,99,235,0.15); transform: translateY(-3px); }
        .dept-card .action-btns { opacity: 0; transition: opacity 0.18s ease; }
        .dept-card:hover .action-btns { opacity: 1; }
        .stat-pill { transition: background 0.18s ease; }
        .stat-pill:hover { background: #eff6ff; }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .modal-enter { animation: fadeIn 0.22s ease forwards; }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        .card-enter { animation: slideUp 0.3s ease forwards; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage organization departments</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-3 rounded-2xl font-medium transition-all shadow-sm text-sm"
        >
          <Plus size={18} />
          Create Department
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/*  Summary Bar */}
      {!loading && departments.length > 0 && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Building2 size={15} className="text-blue-500" />
          <span>
            <span className="font-semibold text-gray-700">{departments.length}</span> department
            {departments.length !== 1 ? 's' : ''}
          </span>
          <span className="mx-2 text-gray-300">|</span>
          <Users size={15} className="text-blue-500" />
          <span>
            <span className="font-semibold text-gray-700">
              {departments.reduce((acc, d) => acc + (d.employee_count || 0), 0)}
            </span>{' '}
            total employees
          </span>
        </div>
      )}

      {/*  Departments Grid  */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          /* Skeleton */
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-4/5 mb-4" />
              <div className="flex gap-2">
                <div className="h-7 bg-gray-100 rounded-xl flex-1" />
                <div className="h-7 bg-gray-100 rounded-xl flex-1" />
              </div>
            </div>
          ))
        ) : departments.length === 0 ? (
          <div className="col-span-full text-center py-24">
            <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 font-medium">No departments yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first department to get started.</p>
          </div>
        ) : (
          departments.map((dept, idx) => (
            <div
              key={dept.id}
              className="dept-card card-enter bg-white rounded-3xl border border-gray-100 p-6 relative overflow-hidden group"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              

              {/* Top Row */}
              <div className="flex items-start justify-between mb-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight">{dept.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(dept.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-btns flex items-center gap-1 relative z-10">
                  <button
                    onClick={() => handleOpenEditModal(dept)}
                    title="Edit department"
                    className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(dept)}
                    title="Delete department"
                    className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2 min-h-[2.5rem]">
                {dept.description || 'No description provided.'}
              </p>

              {/* Stats Pills */}
              <div className="flex gap-2 flex-wrap">
                <div className="stat-pill flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-xl cursor-default">
                  <Users size={13} className="text-blue-500" />
                  <span>
                    <span className="font-bold text-gray-800">{dept.employee_count ?? 0}</span>{' '}
                    {(dept.employee_count ?? 0) === 1 ? 'Employee' : 'Employees'}
                  </span>
                </div>

                <div className="stat-pill flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-xl cursor-default">
                  <UserCheck size={13} className="text-emerald-500" />
                  <span className="font-bold text-gray-800 truncate max-w-[100px]">
                    {dept.manager_name || 'No Manager'}
                  </span>
                </div>
              </div>

              {/* Hover CTA Strip */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1 text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Details</span>
                <ChevronRight size={13} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <Modal title="Create New Department" subtitle="Add a department to the organization" onClose={handleCloseCreateModal}>
          <form onSubmit={handleCreate} className="space-y-5">
            {modalError && <ModalError msg={modalError} />}
            <Field
              label="Department Name"
              required
              name="name"
              value={formData.name}
              onChange={(e) => handleChange(e, setFormData)}
              placeholder="e.g. Engineering"
            />
            <TextareaField
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => handleChange(e, setFormData)}
              placeholder="Brief description of the department..."
            />
            <ModalActions
              onCancel={handleCloseCreateModal}
              submitLabel={submitLoading ? 'Creating…' : 'Create Department'}
              loading={submitLoading}
              submitColor="bg-blue-600 hover:bg-blue-700"
            />
          </form>
        </Modal>
      )}

      {/* EDIT MODAL*/}
      {isEditModalOpen && selectedDept && (
        <Modal
          title="Edit Department"
          subtitle={`Editing "${selectedDept.name}"`}
          onClose={handleCloseEditModal}
          icon={<Pencil size={20} className="text-blue-500" />}
        >
          <form onSubmit={handleEdit} className="space-y-5">
            {modalError && <ModalError msg={modalError} />}
            <Field
              label="Department Name"
              required
              name="name"
              value={editFormData.name}
              onChange={(e) => handleChange(e, setEditFormData)}
              placeholder="e.g. Engineering"
            />
            <TextareaField
              label="Description"
              name="description"
              value={editFormData.description}
              onChange={(e) => handleChange(e, setEditFormData)}
              placeholder="Brief description of the department..."
            />
            <ModalActions
              onCancel={handleCloseEditModal}
              submitLabel={submitLoading ? 'Saving…' : 'Save Changes'}
              loading={submitLoading}
              submitColor="bg-blue-600 hover:bg-blue-700"
            />
          </form>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && selectedDept && (
        <Modal
          title="Delete Department"
          subtitle="This action cannot be undone."
          onClose={handleCloseDeleteModal}
          icon={<Trash2 size={20} className="text-red-500" />}
          danger
        >
          <div className="space-y-5">
            {modalError && <ModalError msg={modalError} />}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
              You are about to delete{' '}
              <span className="font-semibold">"{selectedDept.name}"</span>.{' '}
              {(selectedDept.employee_count ?? 0) > 0 && (
                <span>
                  This department has{' '}
                  <span className="font-semibold">{selectedDept.employee_count}</span>{' '}
                  employee{selectedDept.employee_count !== 1 ? 's' : ''} assigned.{' '}
                </span>
              )}
              Are you sure?
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteLoading}
                className="flex-1 py-3.5 text-gray-700 font-medium border border-gray-200 rounded-2xl hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-3.5 rounded-2xl transition-all text-sm"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Reusable Modal Shell 
const Modal = ({ title, subtitle, onClose, icon, danger, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="modal-enter bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div className={`px-7 pt-7 pb-4 flex items-start justify-between border-b border-gray-100`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100 mt-0.5">
          <X size={22} />
        </button>
      </div>
      <div className="p-7">{children}</div>
    </div>
  </div>
);

// ── Reusable Field ──────────────────────────────────────────────────────────
const Field = ({ label, required, name, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition"
      placeholder={placeholder}
    />
  </div>
);

// ── Reusable Textarea ───────────────────────────────────────────────────────
const TextareaField = ({ label, name, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={4}
      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-y text-sm transition"
      placeholder={placeholder}
    />
  </div>
);

// ── Reusable Modal Error ────────────────────────────────────────────────────
const ModalError = ({ msg }) => (
  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{msg}</div>
);

// ── Reusable Modal Actions ──────────────────────────────────────────────────
const ModalActions = ({ onCancel, submitLabel, loading, submitColor }) => (
  <div className="flex gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="flex-1 py-3.5 text-gray-700 font-medium border border-gray-200 rounded-2xl hover:bg-gray-50 transition text-sm"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className={`flex-1 ${submitColor} disabled:opacity-50 text-white font-medium py-3.5 rounded-2xl transition-all text-sm`}
    >
      {submitLabel}
    </button>
  </div>
);

export default Department;