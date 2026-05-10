// backend/src/controllers/reviewerController.js
import pool from '../config/db.js';
import { addNotificationForEmployee } from './employeeController.js';
import { addNotificationForManager } from './managerController.js';

// Get ALL projects for Reviewer 
export const getAllProjectsForReviewer = async (req, res) => {
  try {
    const reviewer_id = req.user.id;

    // 🔹 Step 1: Get reviewer department
    const [deptRows] = await pool.execute(
      `SELECT department FROM pulse_employees WHERE id = ?`,
      [reviewer_id]
    );

    const department = deptRows[0]?.department;

    // 🔹 Step 2: Fetch ONLY projects from same department
    const [projects] = await pool.execute(`
      SELECT 
        p.*,
        CONCAT(u.firstname, ' ', u.lastname) AS project_manager_name,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN pulse_employees u ON p.manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.department = ?   -- ✅ IMPORTANT FILTER ADDED
      GROUP BY p.id, u.firstname, u.lastname
      ORDER BY p.created_at DESC
    `, [department]);

    // 🔹 Step 3: Format response (unchanged)
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
    const reviewer_id = req.user.id;

    // 🔹 Step 1: Get reviewer department
    const [deptRows] = await pool.execute(
      `SELECT department FROM pulse_employees WHERE id = ?`,
      [reviewer_id]
    );

    const department = deptRows[0]?.department;

    // 🔹 Step 2: Fetch ONLY tasks from same department projects
    const [tasks] = await pool.execute(`
      SELECT 
        t.id,
        t.project_id,
        p.name AS project,
        COALESCE(CONCAT(pm.firstname, ' ', pm.lastname),'No Manager Assigned' )AS project_manager_name,
        t.title,
        t.description,
        t.assigned_to,
        t.due_date,
        t.status,
        COALESCE(CONCAT(e.firstname, ' ', e.lastname), 'Unassigned') AS assignee_name,
        COUNT(c.id) AS comment_count                    
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN pulse_employees pm ON p.manager_id = pm.id
      LEFT JOIN pulse_employees e ON t.assigned_to = e.id
      LEFT JOIN comments c ON t.id = c.task_id

      WHERE 
        p.department = ?
        AND t.status = 'Pending Review'

      GROUP BY
        t.id,
        t.project_id,
        p.name,
        pm.firstname,
        pm.lastname,
        t.title,
        t.description,
        t.assigned_to,
        t.due_date,
        t.status,
        e.firstname,
        e.lastname
      ORDER BY p.name ASC, t.due_date DESC
    `, [department]);

    // 🔹 Step 3: Format response (unchanged)
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

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  if (!comment_text?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Comment cannot be empty"
    });
  }

  try {

    // Get reviewer name
    const [reviewerRows] = await pool.execute(
      `
      SELECT
        firstname,
        lastname

      FROM pulse_employees

      WHERE id = ?
      `,
      [userId]
    );

    const reviewerName =
      reviewerRows.length > 0
        ? `${reviewerRows[0].firstname} ${reviewerRows[0].lastname}`
        : 'Reviewer';

    // Insert comment
    await pool.execute(
      `
      INSERT INTO comments (
        task_id,
        user_id,
        reviewer_name,
        comment_text
      )

      VALUES (?, ?, ?, ?)
      `,
      [
        taskId,
        userId,
        reviewerName,
        comment_text.trim()
      ]
    );

    // Get task details
    const [taskRows] = await pool.execute(
      `
      SELECT
        t.title,
        t.assigned_to,
        p.manager_id

      FROM tasks t

      JOIN projects p
        ON t.project_id = p.id

      WHERE t.id = ?
      `,
      [taskId]
    );

    if (taskRows.length > 0) {

      const {
        title: taskTitle,
        assigned_to: employeeId,
        manager_id
      } = taskRows[0];

      // Notification to employee
      if (employeeId) {

        await addNotificationForEmployee(
          `New feedback received on task: "${taskTitle}"`,
          'feedback',
          'medium',
          employeeId
        );
      }

      // Notification to manager
      if (manager_id) {

        await addNotificationForManager(
          `New comment on task: "${taskTitle}" by ${reviewerName}`,
          'feedback',
          'medium',
          manager_id
        );
      }
    }

    res.json({
      success: true,
      message: "Comment added successfully"
    });

  } catch (error) {

    console.error(
      "Add comment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to add comment"
    });
  }
};

export const getReviewerTaskStats = async (req, res) => {
  try {
    const reviewer_id = req.user.id;

    const [deptRows] = await pool.execute(
      `SELECT department FROM pulse_employees WHERE id = ?`,
      [reviewer_id]
    );

    const department = deptRows[0]?.department;

    const [statsRows] = await pool.execute(`
      SELECT
        SUM(CASE WHEN status = 'Pending Review' THEN 1 ELSE 0 END) AS pending,
        
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS approved,

        SUM(
          CASE 
            WHEN status = 'In Progress'
            AND reviewed_by IS NOT NULL
            THEN 1
            ELSE 0
          END
        ) AS reopened,

        SUM(
          CASE
            WHEN reviewed_by IS NOT NULL
            THEN 1
            ELSE 0
          END
        ) AS totalReviewed

      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.department = ?
    `, [department]);

    res.json({
      success: true,
      data: statsRows[0]
    });

  } catch (error) {
    console.error("Reviewer stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stats"
    });
  }
};
//REVIEWER NOTIFICATIONS

// Helper: Send notification to a single reviewer
export const addNotificationForReviewer = async (
  message,
  type = 'info',
  priority = 'medium',
  reviewerId
) => {
  if (!reviewerId) return;

  try {
    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id, message, type, priority, status)
       VALUES (?, ?, ?, ?, ?, 'unread')`,
      ['reviewer', reviewerId, message.trim(), type, priority]
    );
    console.log(`✅ Notification sent to reviewer ${reviewerId}: ${message}`);
  } catch (err) {
    console.error('Reviewer notification failed:', err.message);
  }
};

// Get notifications for the logged-in reviewer
export const getReviewerNotifications = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { limit = 20 } = req.query;

    const [rows] = await pool.query(`
      SELECT 
        id, 
        message, 
        type, 
        priority, 
        status, 
        created_at 
      FROM notifications
      WHERE recipient_type = 'reviewer' 
        AND recipient_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [reviewerId, Number(limit)]);

    res.json({ 
      success: true, 
      notifications: rows || [] 
    });
  } catch (err) {
    console.error('Get reviewer notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load notifications',
      notifications: [] 
    });
  }
};

// Mark notification as read
export const markReviewerNotificationAsRead = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { notificationId } = req.params;

    if (!notificationId || isNaN(notificationId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification ID' 
      });
    }

    const [result] = await pool.query(`
      UPDATE notifications
      SET status = 'read'
      WHERE id = ? 
        AND recipient_type = 'reviewer'
        AND recipient_id = ?
        AND status = 'unread'
    `, [notificationId, reviewerId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found, already read, or not yours'
      });
    }

    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Mark reviewer notification read error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// ====================== REVIEWER PROFILE ======================

// Get Reviewer Profile (with real data including picture, bio, location)
export const getReviewerProfile = async (req, res) => {

  try {

    const reviewerId = req.user.id;

    const [rows] = await pool.execute(
      `
      SELECT
        id,
        employee_id,
        firstname,
        lastname,
        CONCAT(firstname, ' ', lastname) AS name,
        email_id,
        work_phone,
        designation,
        department,
        location,
        bio,
        profile_picture,
        created_at

      FROM pulse_employees

      WHERE id = ?
        AND LOWER(office_role) = 'reviewer'
      `,
      [reviewerId]
    );

    if (rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Reviewer profile not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {

    console.error(
      "Get reviewer profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch reviewer profile"
    });
  }
};

// Update Reviewer Profile
export const updateReviewerProfile = async (req, res) => {

  const reviewerId = req.user.id;

  const {
    name,
    phone,
    designation,
    location,
    bio
  } = req.body;

  try {

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const firstName =
      name.trim().split(' ')[0];

    const lastName =
      name.trim().split(' ').slice(1).join(' ') || null;

    const [result] = await pool.execute(
      `
      UPDATE pulse_employees

      SET
        firstname = ?,
        lastname = ?,
        work_phone = ?,
        designation = ?,
        location = ?,
        bio = ?

      WHERE id = ?
        AND LOWER(office_role) = 'reviewer'
      `,
      [
        firstName,
        lastName,
        phone || null,
        designation || null,
        location || null,
        bio || null,
        reviewerId
      ]
    );

    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message:
          "Reviewer profile not found or unauthorized"
      });
    }

    const [updatedRows] = await pool.execute(
      `
      SELECT
        id,
        employee_id,
        firstname,
        lastname,
        CONCAT(firstname, ' ', lastname) AS name,
        email_id,
        work_phone,
        designation,
        department,
        location,
        bio,
        profile_picture,
        created_at

      FROM pulse_employees

      WHERE id = ?
      `,
      [reviewerId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedRows[0]
    });

  } catch (error) {

    console.error(
      "Update reviewer profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

export const approveTask = async (req, res) => {
  const { taskId } = req.params;
  const reviewerId = req.user.id;

  try {
    const [taskRows] = await pool.execute(`
      SELECT 
        t.title,
        t.assigned_to,
        p.manager_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    if (taskRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    await pool.execute(`
      UPDATE tasks
      SET
        status = 'Completed',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reviewerId, taskId]);

    const task = taskRows[0];

    if (task.assigned_to) {
      await addNotificationForEmployee(
        `Your task "${task.title}" has been approved`,
        'task_completed',
        'medium',
        task.assigned_to
      );
    }

    if (task.manager_id) {
      await addNotificationForManager(
        `Task "${task.title}" has been approved by reviewer`,
        'task_completed',
        'medium',
        task.manager_id
      );
    }

    res.json({
      success: true,
      message: "Task approved successfully"
    });

  } catch (error) {
    console.error("Approve task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve task"
    });
  }
};

export const reopenTask = async (req, res) => {
  const { taskId } = req.params;
  const reviewerId = req.user.id;

  try {
    const [taskRows] = await pool.execute(`
      SELECT 
        t.title,
        t.assigned_to,
        p.manager_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    if (taskRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    await pool.execute(`
      UPDATE tasks
      SET
        status = 'In Progress',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        progress = 50
      WHERE id = ?
    `, [reviewerId, taskId]);

    const task = taskRows[0];

    if (task.assigned_to) {
      await addNotificationForEmployee(
        `Your task "${task.title}" was reopened by reviewer`,
        'task_reopened',
        'high',
        task.assigned_to
      );
    }

    if (task.manager_id) {
      await addNotificationForManager(
        `Task "${task.title}" was reopened by reviewer`,
        'task_reopened',
        'high',
        task.manager_id
      );
    }

    res.json({
      success: true,
      message: "Task reopened successfully"
    });

  } catch (error) {
    console.error("Reopen task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reopen task"
    });
  }
};

export default {
  getAllProjectsForReviewer,
  getAllTasksForReviewer,
  getTaskComments,
  addTaskComment,
  getReviewerProfile,          
  updateReviewerProfile,
  approveTask,
  reopenTask
};