// src/pages/Reviewer/TaskReview.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import apiConfig from '../../config/apiConfig';
import toast from "react-hot-toast";
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileCheck2,
  ChevronDown,
  ChevronRight,
  Send,
  FileText,
  Download,
  MessageSquare,
  User,
  Calendar,
  Layers,
  Paperclip,
  Star,
  Activity,
  X,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const PROJECT_COLORS = [
  { bg: 'bg-violet-500' },
  { bg: 'bg-sky-500' },
  { bg: 'bg-rose-500' },
  { bg: 'bg-amber-500' },
  { bg: 'bg-teal-500' },
];

const PRIORITY_META = {
  High:   { label: 'High',   dot: 'bg-rose-500',    text: 'text-rose-600' },
  Medium: { label: 'Medium', dot: 'bg-amber-500',   text: 'text-amber-600' },
  Low:    { label: 'Low',    dot: 'bg-emerald-500', text: 'text-emerald-600' },
};

/* ─── StatCard ────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, value, label, color }) => {
  const colorMap = {
    amber:   { iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   grad: 'from-amber-50',   border: 'border-amber-200' },
    emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', grad: 'from-emerald-50', border: 'border-emerald-200' },
    rose:    { iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    grad: 'from-rose-50',    border: 'border-rose-200' },
    violet:  { iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  grad: 'from-violet-50',  border: 'border-violet-200' },
  };
  const c = colorMap[color] || colorMap.violet;
  return (
    <div className={`flex-1 min-w-0 bg-gradient-to-br ${c.grad} to-white border ${c.border} rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={c.iconText} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
export default function TaskReview() {
  const [tasks, setTasks]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask]       = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [newComment, setNewComment]           = useState('');
  const [comments, setComments]               = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [actionLoading, setActionLoading]     = useState(null);
  const [actionDone, setActionDone]           = useState(null);
  const [commentPosting, setCommentPosting]   = useState(false);

  // NEW: Stats from backend
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    reopened: 0,
    totalReviewed: 0
  });

  const commentsEndRef = useRef(null);

  /* ── fetch tasks ── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${apiConfig.API_BASE_URL}/api/reviewer/tasks`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setTasks(result.data);
          const first = [...new Set(result.data.map((t) => t.project))][0];
          setSelectedProject(first || null);

          // Fetch reviewer stats
          const statsRes = await fetch(
            `${apiConfig.API_BASE_URL}/api/reviewer/task-stats`,
            {
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );

          const statsResult = await statsRes.json();

          if (statsResult.success) {
            setStats({
              pending: Number(statsResult.data.pending) || 0,
              approved: Number(statsResult.data.approved) || 0,
              reopened: Number(statsResult.data.reopened) || 0,
              totalReviewed: Number(statsResult.data.totalReviewed) || 0,
            });
          }
        }
      } catch {
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── fetch comments ── */
  useEffect(() => {
    if (!selectedTask?.id) { setComments([]); return; }
    (async () => {
      setLoadingComments(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(
          `${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTask.id}/comments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await res.json();
        if (result.success) setComments(result.data || []);
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [selectedTask?.id]);

  /* auto-scroll to latest comment */
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  /* ── derived ── */
  const groupedTasks = useMemo(() =>
    tasks.reduce((acc, task) => {
      const p = task.project || 'Uncategorized';
      (acc[p] = acc[p] || []).push(task);
      return acc;
    }, {}), [tasks]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return Object.keys(groupedTasks);
    const q = searchQuery.toLowerCase();
    return Object.keys(groupedTasks).filter(
      (p) => p.toLowerCase().includes(q) ||
        groupedTasks[p].some((t) =>
          t.title?.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q)
        )
    );
  }, [searchQuery, groupedTasks]);

  /* ── handlers ── */
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setNewComment('');
    setActionDone(null);
  };

  const handleApprove = async () => {
    if (!selectedTask) return;
    setActionLoading('approve');
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTask.id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(prev =>
        prev.filter(task => task.id !== selectedTask.id)
      );
      setSelectedTask(null);
      setActionDone('approved');
    } catch {
      toast.error('Failed to approve task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async () => {
    if (!selectedTask) return;
    setActionLoading('reopen');
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTask.id}/reopen`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(prev =>
        prev.filter(task => task.id !== selectedTask.id)
      );
      setSelectedTask(null);
      setActionDone('reopened');
    } catch {
      toast.error('Failed to reopen task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || commentPosting) return;
    setCommentPosting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(
        `${apiConfig.API_BASE_URL}/api/reviewer/tasks/${selectedTask.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ comment_text: newComment.trim() }),
        }
      );
      const result = await res.json();
      if (result.success) {

        const optimisticComment = {
          id: Date.now(),
          reviewer_name: 'Reviewer',
          comment_text: newComment.trim(),
          created_at: new Date().toISOString()
        };

        setComments(prev => [
          optimisticComment,
          ...prev
        ]);

        setNewComment('');
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setCommentPosting(false);
    }
  };

  /* Enter sends, Shift+Enter inserts a newline */
  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  /* ── loading / error ── */
  if (loading) return (
    <div className="h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Loading tasks…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto text-rose-500 mb-3" size={36} />
        <p className="text-rose-600 font-semibold text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline">
          Try again
        </button>
      </div>
    </div>
  );

  const priorityMeta = selectedTask
    ? (PRIORITY_META[selectedTask.priority] || PRIORITY_META.Medium)
    : null;

  return (
    <div
      className="flex flex-col bg-slate-50"
      style={{ height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
    >

      {/* ══ STAT CARDS ══════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <StatCard icon={Clock}        value={stats.pending}      label="Pending Review" color="amber"   />
          <StatCard icon={CheckCircle2} value={stats.approved}     label="Approved"        color="emerald" />
          <StatCard icon={RotateCcw}    value={stats.reopened}     label="Reopened"        color="rose"    />
          <StatCard icon={FileCheck2}   value={stats.totalReviewed} label="Total Reviewed"  color="violet"  />
        </div>
      </div>

      {/* ══ THREE COLUMNS ═══════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: Projects ─────────────────────────────── */}
        <aside className="flex flex-col w-72 flex-shrink-0 border-r border-slate-200 bg-white min-h-0">

          {/* fixed top: search */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={15} className="text-violet-500" />
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Projects</h2>
              <span className="ml-auto text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full">
                {filteredProjects.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search projects or tasks…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* scrollable: project + task list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No projects found</div>
            ) : (
              filteredProjects.map((projectName, idx) => {
                const projectTasks = groupedTasks[projectName];
                const isOpen = selectedProject === projectName;
                const col = PROJECT_COLORS[idx % PROJECT_COLORS.length];
                return (
                  <div
                    key={projectName}
                    className={`rounded-xl overflow-hidden border transition-all ${isOpen ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}
                  >
                    <button
                      onClick={() => {
                        setSelectedProject(projectName);
                        setSelectedTask(null);
                        setActionDone(null);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.bg}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{projectName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 px-2 pt-2 pb-2 space-y-1.5">
                        {projectTasks.map((task) => {
                          const isActive = selectedTask?.id === task.id;
                          return (
                            <button
                              key={task.id}
                              onClick={() => handleSelectTask(task)}
                              className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
                                isActive
                                  ? 'bg-white border-violet-300 shadow-sm ring-1 ring-violet-200'
                                  : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                              }`}
                            >
                              <p className={`text-sm font-medium truncate ${isActive ? 'text-violet-700' : 'text-slate-700'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <User size={10} /> {task.assignee}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <Calendar size={10} /> {task.dueDate}
                                </span>
                              </div>
                              <div className="mt-2">
                                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                  Pending Review
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── MIDDLE: Task Details ────────────────────────── */}
        <main className="flex flex-col flex-1 min-h-0 min-w-0 bg-slate-50">

          {/* fixed top: breadcrumb + status */}
          {selectedTask && (
            <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-500 flex-shrink-0">
                  {selectedTask.project}
                </span>
                <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                <h1 className="text-sm font-bold text-slate-800 truncate">{selectedTask.title}</h1>
              </div>
              <span className="flex-shrink-0 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                Pending Review
              </span>
            </div>
          )}

          {/* scrollable: all task detail cards */}
          <div className="flex-1 overflow-y-auto">
            {selectedTask ? (
              <div className="max-w-2xl mx-auto px-6 py-5 space-y-4">

                {/* meta grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'EMPLOYEE',  value: selectedTask.assignee,                               icon: User,        iconColor: 'text-violet-500' },
                    { label: 'DUE DATE',  value: selectedTask.dueDate,                                icon: Calendar,    iconColor: 'text-sky-500' },
                    {
                      label: 'COMPLETED',
                      value: selectedTask.completed_at
                        ? new Date(selectedTask.completed_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Not completed',
                      icon: CheckCircle2,
                      iconColor: 'text-emerald-500'
                    },
                  ].map(({ label, value, icon: Icon, iconColor, extra }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon size={11} className={iconColor} />
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                      </div>
                      {extra || <p className="text-sm font-semibold text-slate-800">{value}</p>}
                    </div>
                  ))}
                </div>

                {/* description */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                    <FileText size={12} /> Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedTask.description ||
                      'Integrate third-party payment gateway API and implement transaction processing with full error handling, webhook support, and transaction log storage.'}
                  </p>
                </div>

                {/* review history */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                    <MessageSquare size={12} /> Review History
                  </h3>
                  {loadingComments ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <MessageSquare size={26} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400 font-medium">No review comments yet</p>
                      <p className="text-xs text-slate-400 mt-1">Post a comment from the right panel.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((c, i) => (
                        <div key={c.id || i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            R
                          </div>
                          <div className="flex-1 bg-violet-50 border border-violet-100 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-violet-700">Reviewer</span>
                              <span className="text-xs text-slate-400">{formatTimeAgo(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-700">{c.comment_text || c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FileText size={28} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-semibold">Select a task to view details</p>
                <p className="text-slate-400 text-sm mt-1">Click on any task from the left panel</p>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT: Reviewer Actions ─────────────────────── */}
        <aside className="flex flex-col w-80 flex-shrink-0 border-l border-slate-200 bg-white min-h-0">

          {/* fixed top: heading */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-violet-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Reviewer Actions</h3>
            </div>
          </div>

          {/* scrollable: actions + comment box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* status banner */}
            {actionDone && (
              <div className={`rounded-xl p-3 border text-sm font-semibold flex items-center gap-2 ${
                actionDone === 'approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {actionDone === 'approved' ? <CheckCircle2 size={15} /> : <RotateCcw size={15} />}
                Task {actionDone === 'approved' ? 'approved successfully!' : 'sent back to employee.'}
              </div>
            )}

            {/* approve */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <ThumbsUp size={16} className="text-emerald-600" />
                <span className="font-bold text-emerald-800 text-sm">Approve Task</span>
              </div>
              <p className="text-xs text-emerald-700 mb-4 leading-relaxed">
                Mark this task as reviewed and approved. The employee will be notified.
              </p>
              <button
                onClick={handleApprove}
                disabled={!selectedTask || actionLoading === 'approve' || actionDone === 'approved'}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                {actionLoading === 'approve' ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Approving…</>
                ) : (
                  <><CheckCircle2 size={15} /> Approve</>
                )}
              </button>
            </div>

            {/* reopen */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCw size={16} className="text-rose-600" />
                <span className="font-bold text-rose-800 text-sm">Reopen Task</span>
              </div>
              <p className="text-xs text-rose-700 mb-4 leading-relaxed">
                Send this task back to the employee with your feedback for corrections.
              </p>
              <button
                onClick={handleReopen}
                disabled={!selectedTask || actionLoading === 'reopen' || actionDone === 'reopened'}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                {actionLoading === 'reopen' ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Reopening…</>
                ) : (
                  <><RotateCcw size={15} /> Reopen</>
                )}
              </button>
            </div>

            {/* divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">Review Comment</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* comment input */}
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                  onKeyDown={handleCommentKeyDown}
                  placeholder={selectedTask ? 'Write comment… (Enter to send)' : 'Select a task first…'}
                  disabled={!selectedTask}
                  rows={4}
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                />
                <span className={`absolute bottom-2.5 right-3 text-xs pointer-events-none ${newComment.length > 450 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {newComment.length}/500
                </span>
              </div>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || !selectedTask || commentPosting}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                {commentPosting ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Posting…</>
                ) : (
                  <><Send size={13} /> Post Comment</>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center">Enter to send · Shift+Enter for new line</p>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}