// backend/src/controllers/reviewerController.js
import pool from '../config/db.js';

// Get ALL projects for Reviewer 
export const getAllProjectsForReviewer = async (req, res) => {
  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.*,
        u.name as project_manager_name,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const formattedProjects = projects.map(project => {
      const total = Number(project.total_tasks) || 0;
      const completed = Number(project.completed_tasks) || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...project,
        progress: progress,
        display_status: progress === 100 ? 'Completed' : 'In Progress'
      };
    });

    res.json({ 
      success: true, 
      data: formattedProjects 
    });
  } catch (error) {
    console.error("Reviewer getAllProjects error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch all projects" 
    });
  }
};

// Get ALL tasks for Reviewer 
export const getAllTasksForReviewer = async (req, res) => {
  try {
    const [tasks] = await pool.execute(`
      SELECT 
        t.id,
        t.project_id,
        p.name AS project,
        COALESCE(pm.name, 'No Manager Assigned') AS project_manager_name,
        t.title,
        t.description,
        t.assigned_to,
        t.due_date,
        t.status,
        COALESCE(e.name, 'Unassigned') AS assignee_name,
        COUNT(c.id) AS comment_count                    
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users pm ON p.manager_id = pm.id
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN comments c ON t.id = c.task_id
      GROUP BY t.id, t.project_id, p.name, pm.name, t.title, t.description, 
               t.assigned_to, t.due_date, t.status, e.name
      ORDER BY p.name ASC, t.due_date DESC;
    `);

    const formattedTasks = tasks.map(task => ({
      id: task.id.toString(),
      project: task.project || 'Unknown Project',
      projectManager: task.project_manager_name,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      status: task.status || 'In Progress',
      dueDate: task.due_date 
        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.due_date))
        : 'No due date',
      assignee: task.assignee_name,
      progress: task.status === 'Completed' ? 100 : 
                task.status === 'In Progress' ? 65 : 25,
      comments: Number(task.comment_count) || 0          
    }));

    res.json({ 
      success: true, 
      data: formattedTasks 
    });

  } catch (error) {
    console.error("Reviewer getAllTasks error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch tasks" 
    });
  }
};

// Get Comments for a Task
export const getTaskComments = async (req, res) => {
  const { taskId } = req.params;

  try {
    const [comments] = await pool.execute(`
      SELECT 
        id,
        reviewer_name,
        comment_text,
        created_at
      FROM comments 
      WHERE task_id = ?
      ORDER BY created_at DESC
    `, [taskId]);

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error("Get task comments error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch comments" });
  }
};

// Add New Comment
export const addTaskComment = async (req, res) => {
  const { taskId } = req.params;
  const { comment_text } = req.body;
  const userId = req.user?.id;
  const reviewerName = req.user?.name || 'Reviewer';

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!comment_text?.trim()) {
    return res.status(400).json({ success: false, message: "Comment cannot be empty" });
  }

  try {
    await pool.execute(`
      INSERT INTO comments (task_id, user_id, reviewer_name, comment_text)
      VALUES (?, ?, ?, ?)
    `, [taskId, userId, reviewerName, comment_text.trim()]);

    res.json({ 
      success: true, 
      message: "Comment added successfully" 
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

export default {
  getAllProjectsForReviewer,
  getAllTasksForReviewer,
  getTaskComments,
  addTaskComment
};