// src/pages/Admin/TaskInsights.jsx
import { useState, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  User, 
  MessageSquare, 
  X, 
  Send 
} from 'lucide-react';

const INITIAL_TASKS = [
  {
    id: '1',
    project: 'Pulse CRM',
    title: 'Design Dashboard UI',
    description: 'Improve UI consistency, spacing, and ensure the color palette matches the new brand guidelines.',
    status: 'In Progress',
    dueDate: 'Apr 12',
    assignee: 'Rahul',
    progress: 70,
    comments: [
      { id: 'c1', user: 'Manager', text: 'UI looks good, adjust padding on the mobile view specifically.', timestamp: '2h ago' },
      { id: 'c2', user: 'Developer', text: 'Working on responsiveness now.', timestamp: '1h ago' }
    ]
  },
  {
    id: '2',
    project: 'Pulse CRM',
    title: 'API Integration',
    description: 'Connect the lead management module to the backend REST API.',
    status: 'Delayed',
    dueDate: 'Apr 10',
    assignee: 'Sarah',
    progress: 30,
    comments: [
      { id: 'c3', user: 'Architect', text: 'Endpoint /leads/v2 is now live.', timestamp: '5h ago' }
    ]
  },
  {
    id: '3',
    project: 'HR System',
    title: 'Login Module',
    description: 'Implement OAuth2 and multi-factor authentication for the main portal.',
    status: 'Completed',
    dueDate: 'Apr 05',
    assignee: 'Michael',
    progress: 100,
    comments: [
      { id: 'c4', user: 'QA', text: 'Verified on all browsers. LGTM!', timestamp: '1d ago' }
    ]
  }
];

const StatusBadge = ({ status }) => {
  const styles = {
    'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Delayed': 'bg-red-100 text-red-700 border border-red-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function TaskInsights() {
  const [tasks] = useState(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.project]) acc[task.project] = [];
    acc[task.project].push(task);
    return acc;
  }, {});

  const handleOpenTask = (id) => {
    setSelectedTaskId(id);
  };

  const handleCloseSidebar = () => {
    setSelectedTaskId(null);
    setNewComment('');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    alert("Comment added successfully! (Demo)");
    setNewComment('');
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-2">   
        <h1 className="text-3xl font-semibold text-blue-700">Task Insights</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full animate-pulse"></span>
          Project performance and task reviews
        </p>
      </div>

      {/* Search Bar on Right */}
      <div className="flex justify-end mb-8">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search tasks or projects..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No tasks found
          </div>
        ) : (
          Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
            <section key={projectName} className="mb-10">   {/* Increased gap here too */}
              <div className="flex items-center gap-3 mb-6 px-2">   {/* Increased mb-6 */}
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                <h2 className="uppercase text-sm font-bold tracking-widest text-slate-500">
                  PROJECT: {projectName}
                </h2>
              </div>

              <div className="space-y-3">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTask(task.id)}
                    className="group bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 transition-all cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-5 mt-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {task.dueDate}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {task.assignee}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            {task.comments.length}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={task.status} />
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${task.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Right Sidebar - Kept intact */}
      {selectedTaskId && selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div 
            className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-xs font-medium text-blue-600">TASK DETAIL</p>
                <h2 className="font-bold text-xl text-slate-900 mt-1">{selectedTask.title}</h2>
              </div>
              <button 
                onClick={handleCloseSidebar}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">Project</p>
                  <p className="font-semibold text-slate-800">{selectedTask.project}</p>
                </div>
                <StatusBadge status={selectedTask.status} />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold text-blue-600">{selectedTask.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${selectedTask.progress}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">DESCRIPTION</p>
                <p className="text-slate-600 leading-relaxed">{selectedTask.description}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> REVIEWS & COMMENTS
                </p>
                <div className="space-y-4">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{comment.user}</span>
                        <span className="text-slate-400">{comment.timestamp}</span>
                      </div>
                      <p className="mt-2 text-slate-600 text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a review or comment..."
                  className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 rounded-2xl transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}