// src/components/DashboardLayout.jsx
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Settings, LogOut, ChevronDown } from 'lucide-react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const location = useLocation();

  // ✅ STEP 1: Get Role from localStorage
  const role = localStorage.getItem("role");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showProfileMenu]);

  // ✅ STEP 2: Role-Based Menus
  const adminMenu = [
    { path: '/admin/overview', label: 'Overview', icon: '📊' },
    { path: '/admin/organizations', label: 'Organizations', icon: '🏢' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/projects', label: 'Projects', icon: '📁' },
    { path: '/admin/tasks', label: 'Tasks', icon: '✅' },
    { path: '/admin/access-control', label: 'Access Control', icon: '🔐' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
  ];

  const managerMenu = [
    { path: '/manager/overview', label: 'Overview', icon: '📊' },
    { path: '/manager/projects', label: 'Projects', icon: '📁' },
    { path: '/manager/tasks', label: 'Tasks', icon: '✅' },
    { path: '/manager/users', label: 'Users', icon: '👥' },
  ];

  // Updated Employee Menu as per your request
  const employeeMenu = [
    { path: '/employee/overview', label: 'Overview', icon: '📊' },
    { path: '/employee/projects', label: 'Projects', icon: '📁' },
    { path: '/employee/tasks', label: 'Tasks', icon: '✅' },
  ];

  let menuItems = [];

  if (role === "admin") {
    menuItems = adminMenu;
  } else if (role === "manager") {
    menuItems = managerMenu;
  } else if (role === "employee") {
    menuItems = employeeMenu;
  }

  const pageTitles = {
    '/admin/profile': 'My Profile',
    '/admin/settings': 'Settings',
    '/employee/profile': 'My Profile',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">

      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,64,175,0.9)),linear-gradient(135deg,rgba(14,165,233,0.22),transparent)] text-white h-full transition-all duration-300 shadow-2xl flex-shrink-0`}
      >
        {/* LOGO */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
            K
          </div>

          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold tracking-tight">KRISTELLAR</h1>
              <p className="text-xs text-blue-400 -mt-1">PULSE</p>
            </div>
          )}
        </div>

        {/* MENU */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 shadow-inner'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-xl opacity-90">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">

        {/* NAVBAR */}
        <nav className="h-16 px-6 flex items-center justify-between bg-white border-b border-blue-100 shadow-sm">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-600 transition"
            >
              ☰
            </button>

            <h2 className="text-lg font-semibold text-gray-800">
              {pageTitles[location.pathname] ||
                menuItems.find((item) => item.path === location.pathname)?.label ||
                'Dashboard'}
            </h2>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-6">

            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-11 pr-4 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-1 text-sm placeholder-gray-400"
              />
            </div>

            {/* Notification */}
            <button className="relative p-2.5 rounded-2xl hover:bg-blue-50 transition text-gray-600">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-sm">
                  AD
                </div>

                <div className="hidden md:block">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-800 text-sm">Asher Rhodes</p>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  <p className="text-xs text-gray-500 -mt-0.5 capitalize">{role}</p>
                </div>
              </div>

              {/* Enhanced Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* Profile Header */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-white border-b border-blue-100">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold shadow">
                        AD
                      </div>
                      <div className="pt-1">
                        <p className="font-semibold text-xl text-gray-900">Asher Rhodes</p>
                        <p className="text-gray-600 text-sm">asher.rhodes@company.com</p>
                        <p className="text-blue-600 text-xs font-medium mt-1 capitalize">{role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <NavLink
                      to={role === "employee" ? "/employee/profile" : "/admin/profile"}
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-6 py-3 flex items-center gap-3 hover:bg-blue-50 text-gray-700 transition"
                    >
                      <User size={18} />
                      <span className="font-medium">My Profile</span>
                    </NavLink>

                    <NavLink
                      to={role === "employee" ? "/employee/settings" : "/admin/settings"}
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-6 py-3 flex items-center gap-3 hover:bg-blue-50 text-gray-700 transition"
                    >
                      <Settings size={18} />
                      <span className="font-medium">Settings</span>
                    </NavLink>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        localStorage.removeItem("role");
                        window.dispatchEvent(new Event("auth-change"));
                        window.location.href = "/login";
                      }}
                      className="w-full px-6 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;