// src/pages/Admin/Organizations.jsx

import { useState } from "react";
import { Plus, Search, Eye, Edit2, Trash2, Users, Briefcase, X, Mail, Phone, User, Briefcase as BriefcaseIcon } from "lucide-react";

const Organizations = () => {
  const [organizations, setOrganizations] = useState([
    { 
      id: 1, 
      name: "TechFlow", 
      members: 25, 
      projects: 10,
      domainName: "Software Development",
      description: "Leading technology solutions provider specializing in cloud infrastructure and digital transformation.",
      orgHead: "Dr. Rajesh Sharma",
      email: "contact@techflow.com",
      phone: "+91 98765 43210"
    },
    { 
      id: 2, 
      name: "GreenGrid", 
      members: 18, 
      projects: 7,
      domainName: "greengrid.energy",
      description: "Renewable energy company focused on sustainable power solutions and smart grid technology.",
      orgHead: "Priya Malhotra",
      email: "info@greengrid.energy",
      phone: "+91 87654 32109"
    },
    { 
      id: 3, 
      name: "NextGen AI", 
      members: 30, 
      projects: 15,
      domainName: "nextgen.ai",
      description: "Artificial intelligence research and development firm building next-generation AI solutions.",
      orgHead: "Arjun Mehta",
      email: "hello@nextgen.ai",
      phone: "+91 76543 21098"
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);

  // Add Organization Form State
  const [newOrg, setNewOrg] = useState({
    name: "",
    domainName: "",
    description: "",
    orgHead: "",
    email: "",
    phone: "",
  });

  // Edit Organization Form State
  const [editOrg, setEditOrg] = useState({
    name: "",
    domainName: "",
    orgHead: "",
    email: "",
    phone: "",
  });

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openViewModal = (org) => {
    setSelectedOrg(org);
  };

  const closeViewModal = () => {
    setSelectedOrg(null);
  };

  const openEditModal = (org) => {
    setEditingOrg(org);
    setEditOrg({
      name: org.name,
      domainName: org.domainName || "",
      orgHead: org.orgHead || "",
      email: org.email || "",
      phone: org.phone || "",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingOrg(null);
  };

  const openDeleteModal = (org) => {
    setOrgToDelete(org);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setOrgToDelete(null);
  };

  const handleAddOrganization = (e) => {
    e.preventDefault();
    
    if (!newOrg.name || !newOrg.email) {
      alert("Organization Name and Email are required");
      return;
    }

    const newId = Math.max(0, ...organizations.map(o => o.id)) + 1;
    
    setOrganizations([...organizations, {
      id: newId,
      name: newOrg.name,
      members: 0,
      projects: 0,
      domainName: newOrg.domainName,
      description: newOrg.description,
      orgHead: newOrg.orgHead,
      email: newOrg.email,
      phone: newOrg.phone,
    }]);

    // Reset form and close modal
    setNewOrg({
      name: "",
      domainName: "",
      description: "",
      orgHead: "",
      email: "",
      phone: "",
    });
    setShowAddModal(false);
  };

  const handleEditOrganization = (e) => {
    e.preventDefault();
    
    if (!editOrg.name || !editOrg.email) {
      alert("Organization Name and Email are required");
      return;
    }

    setOrganizations(organizations.map((org) => 
      org.id === editingOrg.id 
        ? { 
            ...org, 
            name: editOrg.name,
            domainName: editOrg.domainName,
            orgHead: editOrg.orgHead,
            email: editOrg.email,
            phone: editOrg.phone 
          } 
        : org
    ));

    closeEditModal();
  };

  const handleDeleteOrganization = () => {
    if (orgToDelete) {
      setOrganizations(organizations.filter((org) => org.id !== orgToDelete.id));
      closeDeleteModal();
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-700">Organizations</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
            Manage and oversee all your organizations
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Plus size={18} />
          Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-sm transition-all"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org) => (
          <div
            key={org.id}
            className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
          >
            {/* Top Accent Bar */}
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-500"></div>

            {/* Card Content */}
            <div className="p-6">
              {/* Organization Name */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">{org.name}</h3>
                <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-500 transition-colors">Organization</p>
              </div>

              {/* Stats - Clean Two Column Style */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Members */}
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md transition-all duration-300 group/stat">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center transform group-hover/stat:scale-110 transition-transform duration-300">
                      <Users size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{org.members}</p>
                      <p className="text-xs font-semibold text-gray-500">MEMBERS</p>
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md transition-all duration-300 group/stat">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center transform group-hover/stat:scale-110 transition-transform duration-300">
                      <Briefcase size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{org.projects}</p>
                      <p className="text-xs font-semibold text-gray-500">PROJECTS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => openViewModal(org)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Eye size={16} />
                  View
                </button>
                <button 
                  onClick={() => openEditModal(org)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(org)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== ADD ORGANIZATION MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-blue-100 flex items-center justify-between bg-gradient-to-b from-blue-50 to-white rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-blue-700">Create New Organization</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-blue-100 rounded-full transition"
              >
                <X size={24} className="text-blue-500" />
              </button>
            </div>

            <form 
              onSubmit={handleAddOrganization} 
              className="p-8 overflow-y-auto max-h-[calc(92vh-80px)] space-y-8"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({...newOrg, name: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Domain Name</label>
                <input
                  type="text"
                  value={newOrg.domainName}
                  onChange={(e) => setNewOrg({...newOrg, domainName: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="acmecorp.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({...newOrg, description: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all h-24 resize-y"
                  placeholder="Brief description about the organization..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Head</label>
                <input
                  type="text"
                  value={newOrg.orgHead}
                  onChange={(e) => setNewOrg({...newOrg, orgHead: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="Dr. Rajesh Sharma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newOrg.email}
                  onChange={(e) => setNewOrg({...newOrg, email: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="contact@acmecorp.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={newOrg.phone}
                  onChange={(e) => setNewOrg({...newOrg, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 border border-blue-200 rounded-2xl font-medium text-blue-600 hover:bg-blue-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT ORGANIZATION MODAL ==================== */}
      {showEditModal && editingOrg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-blue-100 flex items-center justify-between bg-gradient-to-b from-blue-50 to-white rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-blue-700">Edit Organization</h2>
              <button 
                onClick={closeEditModal}
                className="p-2 hover:bg-blue-100 rounded-full transition"
              >
                <X size={24} className="text-blue-500" />
              </button>
            </div>

            <form 
              onSubmit={handleEditOrganization} 
              className="p-8 overflow-y-auto max-h-[calc(92vh-80px)] space-y-8"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                <input
                  type="text"
                  value={editOrg.name}
                  onChange={(e) => setEditOrg({...editOrg, name: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Domain Name</label>
                <input
                  type="text"
                  value={editOrg.domainName}
                  onChange={(e) => setEditOrg({...editOrg, domainName: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="acmecorp.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Head of the Organization</label>
                <input
                  type="text"
                  value={editOrg.orgHead}
                  onChange={(e) => setEditOrg({...editOrg, orgHead: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="Dr. Rajesh Sharma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={editOrg.email}
                  onChange={(e) => setEditOrg({...editOrg, email: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="contact@acmecorp.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={editOrg.phone}
                  onChange={(e) => setEditOrg({...editOrg, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-blue-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-3.5 border border-blue-200 rounded-2xl font-medium text-blue-600 hover:bg-blue-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteModal && orgToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-blue-100 flex items-center justify-between bg-gradient-to-b from-blue-50 to-white rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-red-600">Delete Organization</h2>
              <button 
                onClick={closeDeleteModal}
                className="p-2 hover:bg-blue-100 rounded-full transition"
              >
                <X size={24} className="text-blue-500" />
              </button>
            </div>

            <div className="p-8">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this organization?</p>
              <p className="text-xl font-semibold text-gray-900 mb-8">{orgToDelete.name}</p>
              <p className="text-sm text-red-600 mb-8">This action cannot be undone. All associated data will be permanently removed.</p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 py-3.5 border border-blue-200 rounded-2xl font-medium text-blue-600 hover:bg-blue-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrganization}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW ORGANIZATION MODAL ==================== */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-[fadeIn_.25s_ease]">
            
            {/* Header */}
            <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <h2 className="text-2xl font-semibold">{selectedOrg.name}</h2>
              <p className="text-sm text-blue-100 mt-1">
                {selectedOrg.description || "No description available."}
              </p>
              <button
                onClick={closeViewModal}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-xl p-4 flex items-start gap-3 hover:border-blue-400 hover:shadow-md transition-all duration-300">
                  <Briefcase className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Domain</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrg.domainName || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-xl p-4 flex items-start gap-3 hover:border-blue-400 hover:shadow-md transition-all duration-300">
                  <User className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Head</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrg.orgHead || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-xl p-4 flex items-start gap-3 hover:border-blue-400 hover:shadow-md transition-all duration-300">
                  <Mail className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrg.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-xl p-4 flex items-start gap-3 hover:border-blue-400 hover:shadow-md transition-all duration-300">
                  <Phone className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrg.phone || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-5 pt-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
                  <Users className="mx-auto text-blue-600 mb-2" size={22} />
                  <div className="text-3xl font-bold text-blue-700">
                    {selectedOrg.members}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">Members</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
                  <BriefcaseIcon className="mx-auto text-blue-600 mb-2" size={22} />
                  <div className="text-3xl font-bold text-blue-700">
                    {selectedOrg.projects}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">Projects</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-blue-100 bg-gradient-to-b from-blue-50 to-white flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;