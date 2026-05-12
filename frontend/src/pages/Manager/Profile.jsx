// src/pages/Manager/Profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Calendar,
  Shield,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  User,
  Edit2
} from "lucide-react";
import apiConfig from "../../config/apiConfig";

const validatePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
};

function ManagerProfile() {
  const [managerData, setManagerData] = useState(null);
  const [stats, setStats] = useState({
    projectsManaged: 0,
    activeTasks: 0,
    teamMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Change Password Modal State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Fetch Manager Profile + Real Stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");

        // 1. Fetch Manager Profile
        const profileRes = await fetch(`${apiConfig.API_BASE_URL}/api/manager/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const profileData = await profileRes.json();
        if (profileData.success) {
          setManagerData(profileData.data);
          setEditForm(profileData.data);
        }

        // 2. Fetch Real Stats
        const statsRes = await fetch(`${apiConfig.API_BASE_URL}/api/manager/profile-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

      } catch (err) {
        console.error("Data fetch error:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle input change during editing
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Save profile changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${apiConfig.API_BASE_URL}/api/manager/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          designation: editForm.designation,
          location: editForm.location,
          bio: editForm.bio
        })
      });

      const data = await res.json();

      if (data.success) {
        setManagerData(data.data || editForm);
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditForm(managerData);
    setIsEditing(false);
  };

  // Change Password Handler (with fix)
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (!validatePassword(passwordForm.newPassword)) {
      alert(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      alert("New password cannot be the same as current password!");
      return;
    }

    setPasswordLoading(true);

    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch(`${apiConfig.API_BASE_URL}/api/manager/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Password changed successfully! Please login again with the new password.");
        setShowChangePassword(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setPasswordError("");
        sessionStorage.clear();
        window.dispatchEvent(new Event("auth-change"));
        navigate("/login", { replace: true });
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (err) {
      alert("Failed to change password. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading profile...</div>;
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>;
  if (!managerData) return <div className="p-12 text-center">No profile data found</div>;

  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-white text-blue-600 flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden">
            {managerData.profile_picture ? (
              <img 
                src={`${apiConfig.API_BASE_URL}${managerData.profile_picture}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              managerData.name?.charAt(0) || "R"
            )}
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleEditChange}
                  className="bg-transparent border-b border-white text-white focus:outline-none text-3xl font-bold w-full"
                />
              ) : managerData.name}
            </h1>
            <p className="text-sm opacity-90 mt-0.5">
              {isEditing ? (
                <input
                  type="text"
                  name="designation"
                  value={editForm.designation || ""}
                  onChange={handleEditChange}
                  className="bg-transparent border-b border-white text-white focus:outline-none"
                />
              ) : managerData.designation}
            </p>
            <p className="text-xs opacity-80 mt-0.5">{managerData.email_id}</p>
          </div>

          {/* Edit / Save / Cancel Buttons */}
          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl text-sm transition"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 ">

        {/* LEFT PANEL */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User size={20} /> Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <InfoRow icon={<Mail />} label="Email" value={managerData.email_id} />
            
            <InfoRow 
              icon={<Phone />} 
              label="Phone" 
              value={isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleEditChange}
                  className="bg-white border border-gray-300 px-3 py-1 rounded-lg w-full focus:outline-none"
                />
              ) : (managerData.work_phone || "")} 
            />

            <InfoRow 
              icon={<MapPin />} 
              label="Location" 
              value={isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={editForm.location || ""}
                  onChange={handleEditChange}
                  className="bg-white border border-gray-300 px-3 py-1 rounded-lg w-full focus:outline-none"
                />
              ) : (managerData.location || "")} 
            />

            <InfoRow 
              icon={<Briefcase />} 
              label="Designation" 
              value={isEditing ? (
                <input
                  type="text"
                  name="designation"
                  value={editForm.designation || ""}
                  onChange={handleEditChange}
                  className="bg-white border border-gray-300 px-3 py-1 rounded-lg w-full focus:outline-none"
                />
              ) : (managerData.designation || "")} 
            />

            <InfoRow
              icon={<Calendar />}
              label="Joined"
              value={managerData.created_at ? new Date(managerData.created_at).toDateString() : ""}
            />
            <InfoRow icon={<Shield />} label="Role" value="Manager" />
          </div>

          {/* BIO - Editable */}
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-1">Bio</h3>
            {isEditing ? (
              <textarea
                name="bio"
                value={editForm.bio || ""}
                onChange={handleEditChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 resize-y"
              />
            ) : (
              <p className="text-gray-600 text-sm leading-relaxed">
                {managerData.bio || ""}
              </p>
            )}
          </div>

          {/* Change Password Button */}
          <button 
            onClick={() => setShowChangePassword(true)}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition shadow"
          >
            <Lock size={16} />
            Change Password
          </button>
        </div>

        {/* RIGHT PANEL - REAL DATA */}
        <div className="space-y-4">
          <StatCard title="Projects Managed" value={stats.projectsManaged} />
          <StatCard title="Active Tasks" value={stats.activeTasks} />
          <StatCard title="Team Members" value={stats.teamMembers} />
        </div>
      </div>

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-6">Change Password</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPasswordForm(prev => ({ ...prev, newPassword: value }));

                    if (!validatePassword(value)) {
                      setPasswordError("Weak password");
                    } else {
                      setPasswordError("");
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be 8+ characters with uppercase, lowercase, number & special character
                </p>
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                  setPasswordError("");
                }}
                className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 disabled:opacity-70"
              >
                {passwordLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small Components */
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-6 bg-blue-50 p-3 rounded-lg shadow-sm">
    <div className="text-blue-600">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

const StatCard = ({ title, value }) => (
  <div className="bg-white p-9 rounded-2xl shadow-lg text-center">
    <p className="text-gray-500 text-md">{title}</p>
    <p className="text-3xl font-bold mt-1 text-blue-600">{value}</p>
  </div>
);

export default ManagerProfile;