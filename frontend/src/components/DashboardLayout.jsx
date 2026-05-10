// src/components/DashboardLayout.jsx
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  SearchCheck,
  UsersRound,
  X
} from 'lucide-react';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const DashboardLayout = ({ logout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null); // NEW

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
  } catch {
    console.error("Failed to parse user data in DashboardLayout");
  }

  const userName = userData.name || "User";
  const userEmail = userData.email || "";
  const profilePicture = userData.profile_picture || null;

  const displayInitials = userName.substring(0, 2).toUpperCase() ||
    (role === "employee" ? "EM" : role === "admin" ? "AD" : "US");

  // Notification endpoint based on role
  const getNotificationEndpoint = useCallback(() => {
    switch (role) {
      case 'admin': return '/api/admin/notifications';
      case 'manager': return '/api/manager/notifications';
      case 'reviewer': return '/api/reviewer/notifications';
      case 'employee':
      default: return '/api/employees/notifications';
    }
  }, [role]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = `${API_BASE_URL}${getNotificationEndpoint()}`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data || {};
      const notifs = data.notifications || data.data || [];

      setNotifications(notifs);
      const unread = notifs.filter(n => n && n.status === 'unread').length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getNotificationEndpoint, token]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!token || !notificationId) return;
    try {
      const baseEndpoint = getNotificationEndpoint().replace('/notifications', '');
      const endpoint = `${API_BASE_URL}${baseEndpoint}/notifications/${notificationId}/read`;
      
      await axios.patch(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // NEW: Open notification in modal
  const openNotification = async (notif) => {
    setSelectedNotification(notif);
    if (notif.status === 'unread') {
      await markAsRead(notif.id);
    }
  };

  // NEW: Close modal
  const closeModal = () => {
    setSelectedNotification(null);
  };

  // Fetch notifications on mount and role change
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
        closeModal(); // NEW
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Role-based menu (unchanged)
  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { path: '/admin/task-insights', label: 'Task Insights', icon: SearchCheck },
    { path: '/admin/team', label: 'Team Management', icon: UsersRound },
  ];

  const managerMenu = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/manager/projects', label: 'Projects', icon: FolderKanban },
    { path: '/manager/task-insights', label: 'Task Insights', icon: SearchCheck },
  ];

  const reviewerMenu = [
    { path: '/reviewer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reviewer/projects', label: 'Projects', icon: FolderKanban },
    { path: '/reviewer/task-insights', label: 'Task Insights', icon: SearchCheck },
  ];

  const employeeMenu = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/projects', label: 'Projects', icon: FolderKanban },
    { path: '/employee/task-insights', label: 'Task Insights', icon: SearchCheck },
  ];

  let menuItems = employeeMenu;
  if (role === "admin") menuItems = adminMenu;
  else if (role === "manager") menuItems = managerMenu;
  else if (role === "reviewer") menuItems = reviewerMenu;

  const getCurrentPageLabel = () => {
    const pathname = location.pathname.toLowerCase();

    if (pathname.includes('/profile')) return 'Profile';
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/projects')) return 'Projects';
    if (pathname.includes('/task-insights')) return 'Task Insights';
    if (pathname.includes('/team')) return 'Team Management';
    if (pathname.includes('/department')) return 'Department';
    return 'Dashboard';
  };

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
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">

      {/* SIDEBAR - Unchanged */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} relative flex h-full flex-shrink-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(160deg,#06111f_0%,#132044_48%,#0b1220_100%)] text-white shadow-2xl transition-all duration-300`}>
        {/* ... (all sidebar code remains exactly the same) ... */}
        <div className={`relative z-10 flex items-center gap-3 px-5 py-6 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-blue-700 shadow-xl shadow-blue-950/40">
            K
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold tracking-wide">KRISTELLAR</h1>
              <p className="text-xs font-medium tracking-[0.28em] text-cyan-200">PULSE</p>
            </div>
          )}
        </div>

        <nav className="relative z-10 mt-4 space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${
                    sidebarOpen ? '' : 'justify-center'
                  } ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xl shadow-blue-950/25'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && sidebarOpen && (
                      <span className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-cyan-400" />
                    )}
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'bg-white/5 text-cyan-100 group-hover:bg-white/10'
                    }`}>
                      <Icon size={19} />
                    </span>
                    {sidebarOpen && <span className="font-semibold">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* NAVBAR - Unchanged */}
        <nav className="relative z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 shadow-sm backdrop-blur-xl">
          {/* ... (navbar content unchanged) ... */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 text-slate-600 transition hover:text-blue-600"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {getCurrentPageLabel()}
              </h2>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-6">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-50 mt-4 flex max-h-[460px] w-96 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <p className="text-xs text-slate-500">{unreadCount} unread updates</p>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-800">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-3">
                    {loading ? (
                      <div className="py-10 text-center text-slate-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="py-12 text-center text-slate-500">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => openNotification(notif)}   // CHANGED
                          className={`mb-2 cursor-pointer rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 ${
                            notif.status === 'unread' ? 'border-blue-100 bg-blue-50/80' : 'border-slate-100 bg-white'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${notif.status === 'unread' ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]' : 'bg-slate-300'}`} />
                            <div className="flex-1">
                              <p className="line-clamp-2 text-sm leading-relaxed text-slate-800">{notif.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-medium text-slate-500">
                                  {new Date(notif.created_at).toLocaleDateString('en-IN', { 
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE SECTION - Unchanged */}
            <div className="relative" ref={profileMenuRef}>
              {/* ... (profile dropdown code unchanged) ... */}
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-1.5 transition hover:border-blue-100 hover:bg-blue-50"
              >
                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
                  {profilePicture ? (
                    <img 
                      src={`${API_BASE_URL}${profilePicture}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white">
                      {displayInitials}
                    </div>
                  )}
                </div>

                <div className="hidden md:block">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-slate-900">{userName}</p>
                    <ChevronDown 
                      size={16} 
                      className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  <p className="-mt-0.5 text-xs font-medium capitalize text-slate-500">{role}</p>
                </div>
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                  {/* ... profile dropdown content unchanged ... */}
                  <div className="border-b border-blue-100 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_36%),linear-gradient(135deg,#eff6ff,#ffffff)] p-6">
                    <div className="flex gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-blue-200 shadow-sm">
                        {profilePicture ? (
                          <img 
                            src={`${API_BASE_URL}${profilePicture}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-bold text-white">
                            {displayInitials}
                          </div>
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="text-xl font-bold text-slate-900">{userName}</p>
                        <p className="text-sm text-slate-600">{userEmail}</p>
                        <p className="mt-1 inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">{role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <NavLink
                      to={`/${role}/profile`}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-3 px-6 py-3 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <CircleUserRound size={18} />
                      <span className="font-medium">My Profile</span>
                    </NavLink>
                  </div>

                  <div className="border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-6 py-4 font-semibold text-red-600 transition hover:bg-red-50"
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
        <main className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)]">
          <Outlet />
        </main>
      </div>

      {/* ==================== NEW NOTIFICATION MODAL ==================== */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">

            {/* HEADER (keep similar, slightly refined) */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-full">
                  <Bell className="text-blue-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    Notification
                  </h3>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* 🔥 IMPROVED BODY */}
            <div className="px-6 py-6 space-y-5">

              {/* MESSAGE CARD */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4">
                <p className="text-slate-800 text-[15px] leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {/* DATE + TIME (clean alignment) */}
              <div className="flex items-center justify-between text-sm text-slate-500">

                <span>
                  {new Date(selectedNotification.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>

                <span>
                  {new Date(selectedNotification.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>

              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
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

export default DashboardLayout;