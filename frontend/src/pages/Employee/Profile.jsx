// src/pages/Employee/Profile.jsx
import { useState } from "react";
import {
  Mail,
  Calendar,
  Shield,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  User
} from "lucide-react";

function EmployeeProfile() {
  // Static data for now (backend will be connected later)
  const employeeData = {
    name: "Aditya Sinha",
    email: "aditya.sinha@company.com",
    phone: "+91 91234 56789",
    location: "Kolkata, West Bengal",
    designation: "Software Developer",
    created_at: "2025-02-10",
    bio: "Dedicated software developer with expertise in React, Node.js, and full-stack development. Passionate about building efficient and user-friendly applications."
  };

  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="p-8">

      {/* ─── HEADER ───────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-xl">

        <div className="flex flex-col md:flex-row items-center gap-6">

          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-white text-blue-600 flex items-center justify-center text-4xl font-bold shadow-lg">
            {employeeData.name?.charAt(0)}
          </div>

          {/* Info */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{employeeData.name}</h1>
            <p className="text-sm opacity-90 mt-0.5">
              {employeeData.designation || "Software Developer"}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {employeeData.email}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 ">

        {/* LEFT PANEL */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">

          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User size={20} /> Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">

            <InfoRow icon={<Mail />} label="Email" value={employeeData.email} />
            <InfoRow
              icon={<Phone />}
              label="Phone"
              value={employeeData.phone || "+91 XXXXXXXXXX"}
            />
            <InfoRow
              icon={<MapPin />}
              label="Location"
              value={employeeData.location || "India"}
            />
            <InfoRow
              icon={<Briefcase />}
              label="Designation"
              value={employeeData.designation || "Employee"}
            />
            <InfoRow
              icon={<Calendar />}
              label="Joined"
              value={new Date(employeeData.created_at).toDateString()}
            />
            <InfoRow
              icon={<Shield />}
              label="Role"
              value="Employee"
            />

          </div>

          {/* BIO */}
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-1">Bio</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {employeeData.bio}
            </p>
          </div>

          {/* ACTION */}
          <button 
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition shadow"
          >
            <Lock size={16} />
            Change Password
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-4">

          <StatCard title="Projects Assigned" value="7" />
          <StatCard title="Tasks Completed" value="89" />
          <StatCard title="Hours Worked" value="142" />

        </div>
      </div>

      {/* Simple Change Password Modal (Frontend only) */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center">
            <h3 className="text-xl font-semibold mb-4">Change Password</h3>
            <p className="text-gray-600 mb-8">Backend integration will be added later.</p>
            <button 
              onClick={() => setShowChangePassword(false)}
              className="px-8 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SMALL COMPONENTS ───────────────────────────── (Exactly same as Admin) */

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
  <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
    <p className="text-gray-500 text-md">{title}</p>
    <p className="text-3xl font-bold mt-1 text-blue-600">{value}</p>
  </div>
);

export default EmployeeProfile;