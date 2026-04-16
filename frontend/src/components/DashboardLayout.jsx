// src/components/DashboardLayout.jsx
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const DashboardLayout = ({ logout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = apiConfig.API_BASE_URL || 'http://localhost:5000';

  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const location = useLocation();

  // Get role and user data from sessionStorage
  const role = sessionStorage.getItem("role")?.toLowerCase() || "employee";
  const token = sessionStorage.getItem("token");
  const userStr = sessionStorage.getItem("user");
  let userData = {};

  try {
    if (userStr) {
      userData = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Failed to parse user data in DashboardLayout");
  }

  const userName = userData.name || userData.username || 
    (role === "employee" ? "Employee" : "Admin User");
  
  const userEmail = userData.email || 
    (role === "employee" ? "employee@company.com" : "admin@company.com");

  const displayInitials = role === "employee" 
    ? "EM" 
    : (userName === "Admin User" ? "AD" : userName.substring(0, 2).toUpperCase());

  // Determine notification API endpoint based on role
  const getNotificationEndpoint = () => {
    switch (role) {
      case 'admin':
        return '/api/admin/notifications';
      case 'manager':
        return '/api/manager/notifications';
      case 'reviewer':
        return '/api/reviewer/notifications';
      case 'employee':
      default:
        return '/api/employee/notifications';
    }
  };

  // Fetch notifications for the current role - IMPROVED VERSION
  const fetchNotifications = async () => {
    if (!token) {
      console.warn("No token found, skipping notification fetch");
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = `${API_BASE_URL}${getNotificationEndpoint()}`;
      console.log(`Fetching notifications from: ${endpoint}`);

      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Notifications API response:", res.data);

      // Handle different possible response structures
      const data = res.data || {};
      const notifs = data.notifications || data.data || [];

      setNotifications(notifs);
      
      // Count unread notifications
      const unread = notifs.filter(n => n && n.status === 'unread').length;
      setUnreadCount(unread);

      console.log(`Loaded ${notifs.length} notifications, ${unread} unread`);
    } catch (err) {
      console.error("Failed to fetch notifications:", err.response?.data || err.message);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    if (!token || !notificationId) return;

    try {
      const baseEndpoint = getNotificationEndpoint().replace('/notifications', '');
      const endpoint = `${API_BASE_URL}${baseEndpoint}/notifications/${notificationId}/read`;
      
      await axios.patch(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI immediately
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Fetch notifications when component mounts or role changes
  useEffect(() => {
    fetchNotifications();

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [role]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // ==================== MENU BASED ON ROLE ====================
  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/projects', label: 'Projects', icon: '📁' },
    { path: '/admin/task-insights', label: 'Task Insights', icon: '🔍' },
    { path: '/admin/team', label: 'Team Management', icon: '👥' },
  ];

  const managerMenu = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/manager/projects', label: 'Projects', icon: '📁' },
    { path: '/manager/task-insights', label: 'Task Insights', icon: '🔍' },
    { path: '/manager/team', label: 'Team Management', icon: '👥' },
  ];

  const reviewerMenu = [
    { path: '/reviewer/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/reviewer/projects', label: 'Projects', icon: '📁' },
    { path: '/reviewer/task-insights', label: 'Task Insights', icon: '🔍' },
  ];

  const employeeMenu = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/employee/projects', label: 'Projects', icon: '📁' },
    { path: '/employee/task-insights', label: 'Task Insights', icon: '🔍' },
  ];

  // Select correct menu based on role
  let menuItems = employeeMenu;

  if (role === "admin") {
    menuItems = adminMenu;
  } else if (role === "manager") {
    menuItems = managerMenu;
  } else if (role === "reviewer") {
    menuItems = reviewerMenu;
  }

  // Improved function to show correct tab name even on sub-routes
  const getCurrentPageLabel = () => {
    const pathname = location.pathname.toLowerCase();

    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/projects')) return 'Projects';
    if (pathname.includes('/task-insights')) return 'Task Insights';
    if (pathname.includes('/team')) return 'Team Management';

    return 'Dashboard';
  };

  // Safe logout handler
  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    } else {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    setShowProfileMenu(false);
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

          {/* LEFT SIDE - Dynamic Tab Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-600 transition"
            >
              ☰
            </button>

            <h2 className="text-lg font-semibold text-gray-800">
              {getCurrentPageLabel()}
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

            {/* ==================== NOTIFICATION BELL ==================== */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    fetchNotifications();   // Force refresh on every click
                  }
                }}
                className="relative p-2.5 rounded-2xl hover:bg-blue-50 transition text-gray-600"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden z-50 max-h-[420px] flex flex-col">
                  
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X size={18} className="text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-2">
                    {loading ? (
                      <div className="py-8 text-center text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-4 hover:bg-blue-50 rounded-2xl mb-1 cursor-pointer transition-all ${
                            notif.status === 'unread' ? 'bg-blue-50/70' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(notif.created_at).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {notif.type && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                    {notif.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 text-center">
                      <button className="text-blue-600 text-sm font-medium hover:underline">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-sm">
                  {displayInitials}
                </div>

                <div className="hidden md:block">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      {userName}
                    </p>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  <p className="text-xs text-gray-500 -mt-0.5 capitalize">{role}</p>
                </div>
              </div>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden z-50">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-white border-b border-blue-100">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold shadow">
                        {displayInitials}
                      </div>
                      <div className="pt-1">
                        <p className="font-semibold text-xl text-gray-900">
                          {userName}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {userEmail}
                        </p>
                        <p className="text-blue-600 text-xs font-medium mt-1 capitalize">{role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <NavLink
                      to={`/${role}/profile`}
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-6 py-3 flex items-center gap-3 hover:bg-blue-50 text-gray-700 transition"
                    >
                      <User size={18} />
                      <span className="font-medium">My Profile</span>
                    </NavLink>
                  </div>

                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
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