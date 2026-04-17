// backend/src/controllers/employeeController.js
import pool from '../config/db.js';
import { addNotificationForManager } from './managerController.js';
import { addNotificationForAdmin } from './adminController.js';
import { addNotificationForReviewer } from './reviewerController.js';

// Get all projects assigned to the logged-in employee
export const getMyAssignedProjects = async (req, res) => {
  const employee_id = req.user.id;

  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.id,
        p.project_id,
        p.name AS title,
        p.description,
        p.deadline,
        p.priority,
        p.team_size,
        u.name AS manager,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE pa.employee_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [employee_id]);

    const formattedProjects = projects.map(project => {
      const total = Number(project.total_tasks) || 0;
      const completed = Number(project.completed_tasks) || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: project.id,
        title: project.title,
        idCode: project.project_id,
        manager: project.manager || "Unknown Manager",
        teamSize: `${project.team_size} Members`,
        deadline: project.deadline ? project.deadline.toISOString().split('T')[0] : 'No deadline',
        progress: progress,
        priority: project.priority || 'Medium',
        status: progress === 100 ? "Completed" : "In Progress"
      };
    });

    res.json({
      success: true,
      data: formattedProjects
    });

  } catch (error) {
    console.error("Get my projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your assigned projects"
    });
  }
};

// Get employee's assigned tasks with reviewer comments
export const getMyTasks = async (req, res) => {
  const employee_id = req.user.id;

  try {
    const [tasks] = await pool.execute(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.due_date,
        p.name AS project_name,
        p.project_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ?
      ORDER BY t.due_date ASC, t.created_at DESC
    `, [employee_id]);

    // Fetch reviewer comments for each task
    const tasksWithComments = await Promise.all(
      tasks.map(async (task) => {
        const [comments] = await pool.execute(`
          SELECT 
            id,
            reviewer_name,
            comment_text,
            created_at
          FROM comments
          WHERE task_id = ?
          ORDER BY created_at DESC
        `, [task.id]);

        return {
          ...task,
          comments: comments || []
        };
      })
    );

    res.json({
      success: true,
      data: tasksWithComments
    });

  } catch (error) {
    console.error("Get my tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your assigned tasks"
    });
  }
};


// Mark task as Completed + Notify Employee, Manager, AND Reviewer
export const completeTask = async (req, res) => {
  const { id } = req.params;
  const employee_id = req.user.id;

  try {
    // Get task, project, manager, and reviewer details
    const [taskData] = await pool.execute(`
      SELECT 
        t.title,
        t.project_id,
        p.name AS project_name,
        p.manager_id,
        e.name AS employee_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.id = ? AND t.assigned_to = ?
    `, [id, employee_id]);

    if (taskData.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task"
      });
    }

    const { title: taskTitle, project_name, manager_id, employee_name } = taskData[0];

    // Update task status
    await pool.execute(`
      UPDATE tasks 
      SET status = 'Completed', 
          completed_at = CURRENT_TIMESTAMP, 
          progress = 100 
      WHERE id = ?
    `, [id]);

    // 1. Notification to Employee
    await addNotificationForEmployee(
      `You have completed the task: "${taskTitle}"`,
      'task_completed',
      'medium',
      employee_id
    );

    // 2. Notification to Manager
    if (manager_id) {
      await addNotificationForManager(
        `Task '${taskTitle}' marked as completed by ${employee_name || 'Employee'}`,
        'task_completed',
        'medium',
        manager_id
      );
    }

    const [reviewers] = await pool.execute(`SELECT id FROM users WHERE role = 'reviewer'`);
    
    for (const reviewer of reviewers) {
      await addNotificationForReviewer(
        `Employee ${employee_name || 'Employee'} completed task: "${taskTitle}". Please review it.`,
        'task_review',
        'high',
        reviewer.id
      );
    }

    console.log(`✅ Reviewer notified about task completion: "${taskTitle}"`);

    res.json({
      success: true,
      message: "Task marked as completed successfully"
    });

  } catch (error) {
    console.error("Complete task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to complete task",
      error: error.message
    });
  }
};

// Get Dashboard Stats for Logged-in Employee Only
export const getEmployeeDashboardStats = async (req, res) => {
  const employee_id = req.user.id;

  try {
    // 1. Projects assigned to this employee
    const [projectStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT p.id) AS total_projects
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.employee_id = ?
    `, [employee_id]);

    // 2. Task statistics for this employee
    const [taskStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'In Progress' OR status = 'Delayed' THEN 1 ELSE 0 END) AS active_tasks
      FROM tasks 
      WHERE assigned_to = ?
    `, [employee_id]);

    // 3. Overall Completion Percentage
    const [completionStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        ROUND(
          IFNULL(
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
            0
          ), 0) AS overall_completion
      FROM tasks 
      WHERE assigned_to = ?
    `, [employee_id]);

    const projects = projectStats[0] || {};
    const tasksData = taskStats[0] || {};
    const completion = completionStats[0] || {};

    res.json({
      success: true,
      stats: {
        totalProjects: Number(projects.total_projects) || 0,
        activeTasks: Number(tasksData.active_tasks) || 0,
        completedTasks: Number(tasksData.completed_tasks) || 0,
        overallCompletion: Number(completion.overall_completion) || 0,
      }
    });

  } catch (error) {
    console.error("Employee dashboard stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch employee dashboard statistics" 
    });
  }
};

export const getEmployeeProjectProgress = async (req, res) => {
  const employee_id = req.user.id;
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ success: false, message: "projectId is required" });
  }

  try {
    // 🔹 Get project + ONLY employee's tasks
    const [projects] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.start_date,
        p.deadline,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', t.id,
            'status', t.status,
            'completed_at', t.completed_at
          )
        ) AS tasks
      FROM projects p
      JOIN project_assignments pa ON p.id = pa.project_id
      LEFT JOIN tasks t ON p.id = t.project_id AND t.assigned_to = ?
      WHERE p.id = ? AND pa.employee_id = ?
      GROUP BY p.id, p.name, p.start_date, p.deadline
    `, [employee_id, projectId, employee_id]);

    if (projects.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const proj = projects[0];

    const start = new Date(proj.start_date);
    const end = new Date(proj.deadline);

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const numWeeks = Math.ceil(totalDays / 7); // ✅ real weeks

    // 🔹 Parse tasks safely
    let taskList = [];
    try {
      taskList = typeof proj.tasks === "string" ? JSON.parse(proj.tasks) : proj.tasks;
    } catch {
      taskList = [];
    }

    // Remove null tasks (important for LEFT JOIN)
    taskList = taskList.filter(t => t.id !== null);

    const totalTasks = taskList.length;

    const weeklyProgress = [];
    let prevWeekStart = new Date(start);
    let cumulativeCompleted = 0; // ✅ key fix

    for (let i = 1; i <= numWeeks; i++) {
      const weekEnd = new Date(start);
      weekEnd.setDate(start.getDate() + (i * 7)); // ✅ proper weekly buckets

      const completedThisWeek = taskList.filter(task => {
        if (task.status !== 'Completed' || !task.completed_at) return false;

        const completedDate = new Date(task.completed_at);

        return (
          completedDate >= prevWeekStart &&
          completedDate < weekEnd
        );
      }).length;

      // ✅ cumulative logic
      cumulativeCompleted += completedThisWeek;

      const percentage = totalTasks > 0
        ? Math.round((cumulativeCompleted / totalTasks) * 100)
        : 0;

      weeklyProgress.push(Math.min(100, percentage));

      prevWeekStart = weekEnd;
    }

    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
    const color = colors[(proj.id % colors.length)];

    const progressData = {
      id: proj.id,
      name: proj.name,
      color: color,
      weeks: Array.from({ length: numWeeks }, (_, i) => `Week ${i + 1}`),
      progress: weeklyProgress
    };

    res.json({
      success: true,
      data: [progressData]
    });

  } catch (error) {
    console.error("Employee project progress error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate your progress graph" 
    });
  }
};

// EMPLOYEE NOTIFICATIONS 

// Send notification to a single employee
export const addNotificationForEmployee = async (
  message,
  type = 'info',
  priority = 'medium',
  employeeId
) => {
  if (!employeeId) return;

  try {
    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id, message, type, priority, status)
       VALUES (?, ?, ?, ?, ?, 'unread')`,
      ['employee', employeeId, message.trim(), type, priority]
    );
    console.log(`✅ Notification sent to employee ${employeeId}: ${message}`);
  } catch (err) {
    console.error('Employee notification failed:', err.message);
  }
};

// Helper: Send notification to multiple employees (bulk)
export const addNotificationForEmployees = async (
  message,
  type = 'info',
  priority = 'medium',
  employeeIds = []
) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;

  const values = employeeIds.map(id => [
    'employee',
    Number(id),
    message.trim(),
    type,
    priority,
    'unread'
  ]);

  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(',');

  try {
    await pool.query(`
      INSERT INTO notifications 
        (recipient_type, recipient_id, message, type, priority, status)
      VALUES ${placeholders}
    `, values.flat());
    console.log(`✅ Sent notification to ${employeeIds.length} employees`);
  } catch (err) {
    console.error('Bulk employee notification failed:', err.message);
  }
};

// Get all notifications for the logged-in employee
export const getEmployeeNotifications = async (req, res) => {
  try {
    const employeeId = req.user.id;
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
      WHERE recipient_type = 'employee' 
        AND recipient_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [employeeId, Number(limit)]);

    res.json({ 
      success: true, 
      notifications: rows || [] 
    });
  } catch (err) {
    console.error('Get employee notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load notifications',
      notifications: [] 
    });
  }
};

// Mark a specific notification as read
export const markEmployeeNotificationAsRead = async (req, res) => {
  try {
    const employeeId = req.user.id;
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
        AND recipient_type = 'employee'
        AND recipient_id = ?
        AND status = 'unread'
    `, [notificationId, employeeId]);

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
    console.error('Mark employee notification read error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// ====================== EMPLOYEE PROFILE ======================

// Get Employee Profile (with real data including picture, bio, location)
export const getEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const [rows] = await pool.execute(`
      SELECT 
        id, 
        employee_id, 
        name, 
        email, 
        phone, 
        designation, 
        location, 
        bio, 
        profile_picture, 
        created_at 
      FROM employees 
      WHERE id = ?
    `, [employeeId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("Get employee profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee profile"
    });
  }
};

// Update Employee Profile
export const updateEmployeeProfile = async (req, res) => {
  const employeeId = req.user.id;
  const { name, phone, designation, location, bio } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const [result] = await pool.execute(
      `UPDATE employees 
       SET name = ?, 
           phone = ?, 
           designation = ?, 
           location = ?, 
           bio = ? 
       WHERE id = ?`,
      [name, phone || null, designation || null, location || null, bio || null, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    // Return updated data
    const [updatedRows] = await pool.execute(`
      SELECT 
        id, employee_id, name, email, phone, designation, 
        location, bio, profile_picture, created_at 
      FROM employees 
      WHERE id = ?
    `, [employeeId]);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedRows[0]
    });

  } catch (error) {
    console.error("Update employee profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

export default {
  getMyAssignedProjects,
  getMyTasks,
  completeTask,
  getEmployeeDashboardStats,
  getEmployeeProjectProgress,
  getEmployeeNotifications,           
  markEmployeeNotificationAsRead,     
  addNotificationForEmployee,         
  addNotificationForEmployees,
  getEmployeeProfile,          
  updateEmployeeProfile         
};