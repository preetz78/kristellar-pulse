// backend/src/controllers/reviewerController.js
import pool from '../config/db.js';
import { addNotificationForEmployee } from './employeeController.js';
import { addNotificationForManager } from './managerController.js';

export const getReviewerDashboardStats = async (req, res) => {

  try {

    const reviewerId = req.user.id;

    // =========================
    // GET REVIEWER DEPARTMENT
    // =========================

    const [deptRows] = await pool.execute(
      `
      SELECT department
      FROM pulse_employees
      WHERE id = ?
      `,
      [reviewerId]
    );

    const department =
      deptRows[0]?.department;

    if (!department) {
      return res.status(403).json({
        success: false,
        message: "Reviewer department not found"
      });
    }

    // =========================
    // PROJECT STATS
    // ONLY SAME DEPARTMENT
    // =========================

    const [projectStats] = await pool.execute(
      `
      SELECT 

        COUNT(*) AS total_projects,

        SUM(
          CASE 

            WHEN EXISTS (
              SELECT 1
              FROM tasks t
              WHERE t.project_id = p.id
            )

            AND NOT EXISTS (
              SELECT 1
              FROM tasks t
              WHERE t.project_id = p.id
              AND t.status != 'Completed'
            )

            THEN 1

            ELSE 0

          END
        ) AS completed_projects,

        SUM(
          CASE 

            WHEN NOT (

              EXISTS (
                SELECT 1
                FROM tasks t
                WHERE t.project_id = p.id
              )

              AND NOT EXISTS (
                SELECT 1
                FROM tasks t
                WHERE t.project_id = p.id
                AND t.status != 'Completed'
              )

            )

            THEN 1

            ELSE 0

          END
        ) AS active_projects

      FROM projects p

      WHERE p.department = ?
      `,
      [department]
    );

    // =========================
    // CALCULATIONS
    // =========================

    const totalProjects =
      Number(
        projectStats[0]?.total_projects
      ) || 0;

    const completedProjects =
      Number(
        projectStats[0]?.completed_projects
      ) || 0;

    const activeProjects =
      Number(
        projectStats[0]?.active_projects
      ) || 0;

    const overallCompletion =

      totalProjects > 0

        ? Math.round(
            (
              completedProjects /
              totalProjects
            ) * 100
          )

        : 0;

    // =========================
    // PROJECT DROPDOWN
    // ONLY SAME DEPARTMENT
    // =========================

    const [projects] = await pool.execute(
      `
      SELECT
        id,
        name,
        created_at
      FROM projects
      WHERE department = ?
      ORDER BY created_at DESC
      `,
      [department]
    );

    // =========================
    // RESPONSE
    // =========================

    res.json({

      success: true,

      stats: {

        totalProjects,

        activeProjects,

        completedProjects,

        overallCompletion
      },

      projects
    });

  } catch (error) {

    console.error(
      "Reviewer dashboard stats error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to fetch reviewer dashboard statistics"
    });
  }
};


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
        t.completed_at,
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
      comments: Number(task.comment_count) || 0 ,
      completed_at: task.completed_at
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

        await addNotificationForEmployee({

          title: "Task Reopened",

          full_message:
        `Your task '${task.title}' was reopened by the reviewer.

        Please review the feedback and resubmit the task.`,

          type: 'task_reopened',

          priority: 'high',

          employeeId: task.assigned_to
        });
              }

      // Notification to manager
      if (manager_id) {

        await addNotificationForManager({

          title: "Task Reopened",

          full_message:
        `Task '${task.title}' was reopened by the reviewer.

        The employee needs to make corrections and resubmit the task.`,

          type: 'task_reopened',

          priority: 'high',

          managerId: task.manager_id
        });
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
export const addNotificationForReviewer = async ({
  title,
  full_message,
  type = 'info',
  priority = 'medium',
  reviewerId
}) => {
  if (!reviewerId) return;

  try {
    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id, title, full_message, type, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unread')`,
      ['reviewer', reviewerId, title.trim(), full_message.trim(), type, priority]
    );
    console.log(`✅ Notification sent to reviewer ${reviewerId}: ${title}`);
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
        title,
        full_message,
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
      await addNotificationForEmployee({

        title: "New Feedback Received",

        full_message:
      `New feedback has been added on task '${taskTitle}'.

      Please review the reviewer comments.`,

        type: 'feedback',

        priority: 'medium',

        employeeId
      });
    }

    if (task.manager_id) {
      await addNotificationForManager({

        title: "New Task Comment",

        full_message:
      `Reviewer ${reviewerName} added a comment on task '${taskTitle}'.

      Please review the feedback.`,

        type: 'feedback',

        priority: 'medium',

        managerId: manager_id
      });
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
      await addNotificationForEmployee({

        title: "Task Approved",

        full_message:
      `Your task '${task.title}' has been approved by the reviewer.

      Great work on completing the task.`,

        type: 'task_completed',

        priority: 'medium',

        employeeId: task.assigned_to
      });
    }

    if (task.manager_id) {
      await addNotificationForManager({

        title: "Task Approved",

        full_message:
      `Task '${task.title}' has been approved by the reviewer.

      The task is now marked as completed.`,

        type: 'task_completed',

        priority: 'medium',

        managerId: task.manager_id
      });
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

export const getReviewerProjectProgress = async (req, res) => {

  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required"
    });
  }

  try {

    // =========================
    // GET REVIEWER DEPARTMENT
    // =========================

    const reviewerId = req.user.id;

    const [deptRows] = await pool.execute(
      `
      SELECT department
      FROM pulse_employees
      WHERE id = ?
      `,
      [reviewerId]
    );

    const reviewerDepartment =
      deptRows[0]?.department;

    if (!reviewerDepartment) {
      return res.status(403).json({
        success: false,
        message: "Reviewer department not found"
      });
    }


    const [projects] = await pool.execute(`

      SELECT 
        p.id,
        p.name,
        p.start_date,
        p.deadline,
        p.department,

        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', t.id,
            'status', t.status,
            'reviewed_at', t.reviewed_at
          )
        ) AS tasks

      FROM projects p

      LEFT JOIN tasks t
        ON p.id = t.project_id

      WHERE 
        p.id = ?
        AND
        p.department = ?

      GROUP BY
        p.id,
        p.name,
        p.start_date,
        p.deadline,
        p.department

    `, [projectId, reviewerDepartment]);

    // =========================
    // PROJECT NOT FOUND
    // =========================

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found or access denied"
      });
    }

    const project = projects[0];

    // =========================
    // PARSE TASKS
    // =========================

    let tasks = [];

    try {

      tasks =
        typeof project.tasks === "string"
          ? JSON.parse(project.tasks)
          : project.tasks || [];

    } catch {

      tasks = [];
    }

    tasks = tasks.filter(
      task => task.id !== null
    );

    // =========================
    // COUNTS
    // =========================

    const totalTasks = tasks.length;

    const completedTasks = tasks

      .filter(task =>
        task.status === "Completed" &&
        task.reviewed_at
      )

      .sort((a, b) =>
        new Date(a.reviewed_at) -
        new Date(b.reviewed_at)
      );

    // =========================
    // DATE HELPERS
    // =========================

    const MS_PER_DAY =
      1000 * 60 * 60 * 24;

    const normaliseDate = (value) => {

      const date =
        value
          ? new Date(value)
          : new Date();

      date.setHours(0, 0, 0, 0);

      return date;
    };

    const toIsoDate = (date) =>
      normaliseDate(date)
        .toISOString()
        .slice(0, 10);

    const sameDay = (a, b) =>
      toIsoDate(a) === toIsoDate(b);

    const formatDateLabel = (
      date,
      withYear = false
    ) =>

      normaliseDate(date)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          ...(withYear
            ? { year: "2-digit" }
            : {})
        });

    // =========================
    // IMPORTANT DATES
    // =========================

    const startDate =
      project.start_date
        ? normaliseDate(
            project.start_date
          )
        : normaliseDate(
            project.deadline || new Date()
          );

    const deadlineDate =
      project.deadline
        ? normaliseDate(
            project.deadline
          )
        : startDate;

    const today =
      normaliseDate(new Date());

    // =========================
    // FINAL COMPLETION DATE
    // =========================

    let finalCompletionDate = null;

    const allTasksCompleted =

      totalTasks > 0 &&
      completedTasks.length === totalTasks;

    if (allTasksCompleted) {

      finalCompletionDate =
        normaliseDate(

          completedTasks[
            completedTasks.length - 1
          ].reviewed_at
        );
    }

    // =========================
    // DELAY LOGIC
    // =========================

    const isDelayed =

      (
        finalCompletionDate &&
        finalCompletionDate > deadlineDate
      )

      ||

      (
        !finalCompletionDate &&
        today > deadlineDate
      );

    const deadlinePassed =
      today > deadlineDate;

    // =========================
    // CURRENT PROGRESS
    // =========================

    const currentProgress =

      totalTasks > 0

        ? Math.round(
            (
              completedTasks.length /
              totalTasks
            ) * 100
          )

        : 0;

    // =========================
    // CHART END DATE
    // =========================

    const finalChartDate =

      allTasksCompleted
        ? finalCompletionDate
        : today;

    // =========================
    // COMPLETION GROUPING
    // =========================

    const completedByDate = {};

    let cumulativeCompleted = 0;

    completedTasks.forEach((task) => {

      const completedDate =
        normaliseDate(
          task.reviewed_at
        );

      const dateKey =
        toIsoDate(completedDate);

      cumulativeCompleted += 1;

      completedByDate[dateKey] = {

        date: completedDate,

        percentage:

          totalTasks > 0

            ? Math.round(
                (
                  cumulativeCompleted /
                  totalTasks
                ) * 100
              )

            : 0,

        completedTasks:
          cumulativeCompleted,

        tasksCompletedOnDate:

          (
            completedByDate[dateKey]
              ?.tasksCompletedOnDate || 0
          ) + 1
      };
    });

    // =========================
    // HELPERS
    // =========================

    const getCompletedCountByDate = (
      date
    ) =>

      completedTasks.filter(task =>

        normaliseDate(
          task.reviewed_at
        ) <= normaliseDate(date)

      ).length;

    const getProgressByDate = (
      date
    ) => {

      if (totalTasks === 0) {
        return 0;
      }

      return Math.round(

        (
          getCompletedCountByDate(date) /
          totalTasks
        ) * 100
      );
    };

    // =========================
    // BUILD GRAPH POINTS
    // =========================

    const progressPoints = [];

    const addPoint = (point) => {

      progressPoints.push({

        ...point,

        date:
          point.date < startDate
            ? startDate
            : point.date
      });
    };

    // START POINT

    addPoint({

      date: startDate,

      percentage: 0,

      completedTasks: 0,

      tasksCompletedOnDate: 0,

      markerType: "start"
    });

    // TASK COMPLETION POINTS

    completedTasks.forEach(
      (task, index) => {

        const completedDate =
          normaliseDate(
            task.reviewed_at
          );

        const dateKey =
          toIsoDate(completedDate);

        addPoint({

          date: completedDate,

          percentage:

            totalTasks > 0

              ? Math.round(
                  (
                    (index + 1) /
                    totalTasks
                  ) * 100
                )

              : 0,

          completedTasks:
            index + 1,

          tasksCompletedOnDate:

            completedByDate[dateKey]
              ?.tasksCompletedOnDate || 1,

          markerType: "completion"
        });
      }
    );

    // DEADLINE MARKER

    if (

      isDelayed &&
      deadlineDate >= startDate &&
      deadlineDate <= finalChartDate

    ) {

      addPoint({

        date: deadlineDate,

        percentage:
          getProgressByDate(
            deadlineDate
          ),

        completedTasks:
          getCompletedCountByDate(
            deadlineDate
          ),

        tasksCompletedOnDate:

          completedByDate[
            toIsoDate(deadlineDate)
          ]?.tasksCompletedOnDate || 0,

        markerType: "deadline"
      });
    }

    // TODAY POINT

    if (

      !allTasksCompleted &&
      !sameDay(today, startDate)

    ) {

      addPoint({

        date: today,

        percentage: currentProgress,

        completedTasks:
          completedTasks.length,

        tasksCompletedOnDate: 0,

        markerType: "today"
      });
    }

    // =========================
    // SORT & REMOVE DUPLICATES
    // =========================

    progressPoints.sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );

    const uniquePointsByKey =
      new Map();

    progressPoints.forEach((point) => {

      const key =

        `${toIsoDate(point.date)}-${point.markerType}-${point.completedTasks}`;

      uniquePointsByKey.set(
        key,
        point
      );
    });

    const uniqueProgressPoints =

      Array.from(
        uniquePointsByKey.values()
      )

      .sort((a, b) =>
        new Date(a.date) -
        new Date(b.date)
      );

    // =========================
    // FINAL GRAPH DATA
    // =========================

    const progressHistory =
      uniqueProgressPoints.map((point, index) => {

        const date =
          normaliseDate(point.date);

        const isAfterDeadline =
          date > deadlineDate;

        const isDeadline =
          point.markerType === "deadline";

        const shouldUseRed =
          isDelayed &&
          (isAfterDeadline || isDeadline);

        // =========================
        // FIX SAME-DAY DOT OVERLAP
        // =========================

        const baseDayOffset =
          Math.max(
            0,
            Math.floor(
              (date - startDate) / MS_PER_DAY
            )
          );

        const sameDatePoints =
          uniqueProgressPoints.filter(
            p =>
              toIsoDate(p.date) ===
              toIsoDate(point.date)
          );

        const sameDateIndex =
          sameDatePoints.findIndex(
            p =>
              p.completedTasks ===
              point.completedTasks
          );

        const adjustedDayOffset =

          baseDayOffset +

          (
            sameDatePoints.length > 1
              ? sameDateIndex * 0.015
              : 0
          );

        // =========================
        // LABELS
        // =========================

        let xLabel =
          formatDateLabel(date);

        if (
          point.markerType === "start"
        ) {

          xLabel =
            `Start ${formatDateLabel(
              date,
              true
            )}`;

        } else if (
          point.markerType === "deadline"
        ) {

          xLabel =
            `Deadline ${formatDateLabel(
              date,
              true
            )}`;

        } else if (
          point.markerType === "today"
        ) {

          xLabel =
            `Today ${formatDateLabel(
              date,
              true
            )}`;

        } else if (

          allTasksCompleted &&
          finalCompletionDate &&
          sameDay(
            date,
            finalCompletionDate
          ) &&
          index ===
          uniqueProgressPoints.length - 1

        ) {

          xLabel =
            `Complete ${formatDateLabel(
              date,
              true
            )}`;
        }

        return {

          xLabel,

          label: xLabel,

          pointIndex: index,

          // =========================
          // FIXED DAY OFFSET
          // =========================

          dayOffset:
            adjustedDayOffset,

          markerType:
            point.markerType,

          percentage:
            point.percentage,

          completedTasks:
            point.completedTasks,

          totalTasks,

          tasksCompletedOnDate:
            point.tasksCompletedOnDate,

          date:
            date.toISOString(),

          isToday:
            point.markerType === "today",

          isDeadline,

          isCompletion:
            point.markerType === "completion",

          isDeadlineCrossed:
            shouldUseRed,

          greenProgress:

            shouldUseRed &&
            !isDeadline

              ? null

              : point.percentage,

          redProgress:

            shouldUseRed
              ? point.percentage
              : null,

          dotProgress:
            point.percentage
        };
      });

    // =========================
    // RESPONSE
    // =========================

    res.json({
      success: true,

      data: [{

        id: project.id,

        name: project.name,

        startDate:
          project.start_date,

        deadline:
          project.deadline,

        currentDate: today,

        actualCompletionDate:
          finalCompletionDate,

        chartEndDate:
          finalChartDate,

        totalTasks,

        completedTasks:
          completedTasks.length,

        currentProgress,

        isDelayed,

        deadlinePassed,

        progressHistory
      }]
    });

  } catch (error) {

    console.error(
      "Reviewer project progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate project progress"
    });
  }
};

export const getReviewerStatsCards = async (req, res) => {

  try {

    const reviewerId = req.user.id;

    const [reviewStats] = await pool.execute(
      `
      SELECT 

        COUNT(*) AS reviews_done,

        SUM(
          CASE
            WHEN status = 'Completed'
            THEN 1
            ELSE 0
          END
        ) AS approved_tasks,

        SUM(
          CASE
            WHEN status = 'Reopened'
            THEN 1
            ELSE 0
          END
        ) AS reopened_tasks

      FROM tasks

      WHERE reviewed_by = ?
      `,
      [reviewerId]
    );

    const reviewsDone =
      Number(
        reviewStats[0]?.reviews_done
      ) || 0;

    const approvedTasks =
      Number(
        reviewStats[0]?.approved_tasks
      ) || 0;

    const reopenedTasks =
      Number(
        reviewStats[0]?.reopened_tasks
      ) || 0;


    const [projectStats] = await pool.execute(
      `
      SELECT COUNT(*) AS projects_reviewed

      FROM (

        SELECT 
          p.id

        FROM projects p

        INNER JOIN tasks t
          ON p.id = t.project_id

        GROUP BY p.id

        HAVING 

          COUNT(t.id) > 0

          AND COUNT(
            CASE
              WHEN t.status != 'Completed'
              THEN 1
            END
          ) = 0

          AND COUNT(
            CASE
              WHEN t.reviewed_by = ?
              THEN 1
            END
          ) > 0

      ) reviewed_projects
      `,
      [reviewerId]
    );

    const projectsReviewed =
      Number(
        projectStats[0]?.projects_reviewed
      ) || 0;


    const approvalRate =

      reviewsDone > 0

        ? Math.round(
            (
              approvedTasks /
              reviewsDone
            ) * 100
          )

        : 0;


    res.json({

      success: true,

      stats: {

        reviewsDone,
        approvedTasks,
        reopenedTasks,
        projectsReviewed,
        approvalRate
      }
    });

  } catch (error) {

    console.error(
      "Reviewer stat cards error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to fetch reviewer statistics"
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
  reopenTask,
  getReviewerProjectProgress,
  getReviewerDashboardStats
};