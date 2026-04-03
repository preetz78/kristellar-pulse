// src/pages/Admin/Settings.jsx
import { useState } from "react";
import { 
  User, Bell, Shield, Palette, Globe, Moon, Sun, 
  Save, ArrowLeft 
} from "lucide-react";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskUpdates: true,
    securityAlerts: true,
  });

  const [profileSettings, setProfileSettings] = useState({
    name: "Asher Rhodes",
    email: "asher.rhodes@company.com",
    phone: "+91 98765 43210",
    language: "English",
    timezone: "IST (UTC+5:30)",
  });

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-blue-50 rounded-xl text-gray-600 hover:text-blue-600 transition"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm">Manage your account and preferences</p>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-medium transition shadow-sm"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN - Navigation */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-blue-200 rounded-3xl p-2 sticky top-6">
              <div className="space-y-1">
                {[
                  { icon: User, label: "Profile", active: true },
                  { icon: Bell, label: "Notifications" },
                  { icon: Shield, label: "Security" },
                  { icon: Palette, label: "Appearance" },
                  { icon: Globe, label: "Preferences" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer transition-all ${
                      item.active 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Content */}
          <div className="lg:col-span-9 space-y-6">

            {/* Profile Settings */}
            <div className="bg-white border border-blue-200 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileSettings.name}
                    onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                      className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white border border-blue-200 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Bell size={22} className="text-blue-600" />
                Notification Preferences
              </h2>

              <div className="space-y-5">
                {[
                  { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
                  { key: "push", label: "Push Notifications", desc: "Get notified in the browser" },
                  { key: "taskUpdates", label: "Task Updates", desc: "Notifications about task changes" },
                  { key: "securityAlerts", label: "Security Alerts", desc: "Important security notifications" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(item.key)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${
                        notifications[item.key] ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white border border-blue-200 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Palette size={22} className="text-blue-600" />
                Appearance
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Dark Mode</p>
                  <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${
                    darkMode ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;