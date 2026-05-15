// backend/src/controllers/employeeController.js
import pool from '../config/db.js';
// import axios from 'axios';
import bcrypt from "bcrypt";
import { addNotificationForManager } from './managerController.js';
import { addNotificationForAdmin } from './adminController.js';
import { addNotificationForReviewer } from './reviewerController.js';


export const syncEmployee = async (req, res) => {

    try {

        // Employee data from HRMS
        const {

            employee_id,
            firstname,
            lastname,
            email_id,
            office_role,
            work_phone,
            designation,
            department,
            profile_picture,
            location

        } = req.body;

        // Validate required fields
        if (
            !employee_id ||
            !firstname ||
            !lastname ||
            !email_id
        ) {

            return res.status(400).json({
                success: false,
                message: "Required employee fields are missing"
            });
        }

        // Default password = employee_id
        // Password will be hashed before storing
        const hashedPassword = await bcrypt.hash(employee_id, 10);

        // Upsert employee
        const query = `

            INSERT INTO pulse_employees (

                employee_id,
                firstname,
                lastname,
                email_id,
                password,
                office_role,
                work_phone,
                designation,
                department,
                profile_picture,
                location

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE

                firstname = VALUES(firstname),
                lastname = VALUES(lastname),
                email_id = VALUES(email_id),
                office_role = VALUES(office_role),
                work_phone = VALUES(work_phone),
                designation = VALUES(designation),
                department = VALUES(department),
                profile_picture = VALUES(profile_picture),
                location = VALUES(location),
                updated_at = CURRENT_TIMESTAMP

        `;

        await pool.execute(query, [

            employee_id,
            firstname,
            lastname,
            email_id,
            hashedPassword,
            office_role,
            work_phone,
            designation,
            department,
            profile_picture,
            location

        ]);

        return res.status(200).json({

            success: true,
            message: "Employee synced successfully"

        });

    } catch (error) {

        console.error(
            "Employee sync error:",
            error.message
        );

        return res.status(500).json({

            success: false,
            message: "Internal server error"

        });
    }
};


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
        CONCAT(u.firstname, ' ', u.lastname) AS manager,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      LEFT JOIN pulse_employees u ON p.manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE pa.employee_id = ?
      GROUP BY p.id, u.firstname, u.lastname
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
        p.project_id,
        CONCAT( e.firstname, ' ', e.lastname) AS assignee_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN pulse_employees e ON t.assigned_to = e.id
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
        CONCAT(e.firstname, ' ', e.lastname) AS employee_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN pulse_employees e ON t.assigned_to = e.id
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
      SET 
        status = 'Pending Review',
        completed_at = CURRENT_TIMESTAMP,
        progress = 100
      WHERE id = ?
    `, [id]);

    // 1. Notification to Employee
    await addNotificationForEmployee({

      title: "Task Submitted",

      full_message:
    `You submitted the task '${taskTitle}' for review.

    Please wait for reviewer approval.`,

      type: 'task_completed',

      priority: 'medium',

      employeeId: employee_id
    });

    // 2. Notification to Manager
    if (manager_id) {
      await addNotificationForManager({

        title: "Task Submitted For Review",

        full_message:
      `Task '${taskTitle}' has been submitted for review by ${employee_name || 'Employee'}.

      Please monitor the review process.`,

        type: 'task_completed',

        priority: 'medium',

        managerId: manager_id
      });
    }

    const [reviewers] = await pool.execute(`SELECT id FROM pulse_employees WHERE LOWER(office_role) = 'reviewer'`);
    
    for (const reviewer of reviewers) {
      await addNotificationForReviewer({

        title: "Task Review Required",

        full_message:
      `Employee ${employee_name || 'Employee'} submitted task '${taskTitle}' for review.

      Please review the task submission.`,

        type: 'task_review',

        priority: 'high',

        reviewerId: reviewer.id
      });
    }

    console.log(`✅ Reviewer notified about task completion: "${taskTitle}"`);

    res.json({
      success: true,
      message: "Task submitted for review successfully"
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

    // TOTAL PROJECTS ASSIGNED TO EMPLOYEE
    const [projectStats] = await pool.execute(
      `
      SELECT 
        COUNT(DISTINCT p.id) AS total_projects,

        -- COMPLETED PROJECTS
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

        -- ACTIVE PROJECTS
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

      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id

      WHERE pa.employee_id = ?
      `,
      [employee_id]
    );

    // =========================================
    // TASK STATS FOR THIS EMPLOYEE
    // =========================================
    const [taskStats] = await pool.execute(
      `
      SELECT 
        COUNT(*) AS total_tasks,

        SUM(
          CASE 
            WHEN status = 'Completed'
            THEN 1
            ELSE 0
          END
        ) AS completed_tasks,

        SUM(
          CASE 
            WHEN status = 'In Progress'
              OR status = 'Delayed'
            THEN 1
            ELSE 0
          END
        ) AS active_tasks

      FROM tasks
      WHERE assigned_to = ?
      `,
      [employee_id]
    );

    // =========================================
    // PROJECT COMPLETION %
    // BASED ON PROJECTS
    // =========================================
    const totalProjects =
      Number(projectStats[0]?.total_projects) || 0;

    const completedProjects =
      Number(projectStats[0]?.completed_projects) || 0;

    const overallCompletion =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    const projects = projectStats[0] || {};
    const tasksData = taskStats[0] || {};

    // =========================================
    // FINAL RESPONSE
    // =========================================
    res.json({
      success: true,

      stats: {
        totalProjects:
          Number(projects.total_projects) || 0,

        activeProjects:
          Number(projects.active_projects) || 0,

        completedProjects:
          Number(projects.completed_projects) || 0,

        activeTasks:
          Number(tasksData.active_tasks) || 0,

        completedTasks:
          Number(tasksData.completed_tasks) || 0,

        overallCompletion:
          overallCompletion,
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

  const { projectId } = req.query;

  const employeeId = req.user.id;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required"
    });
  }

  try {

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
            'reviewed_at', t.reviewed_at,
            'assigned_to', t.assigned_to
          )
        ) AS tasks

      FROM projects p

      LEFT JOIN tasks t
        ON p.id = t.project_id

      WHERE 
        p.id = ?
        AND EXISTS (
          SELECT 1
          FROM tasks et
          WHERE 
            et.project_id = p.id
            AND et.assigned_to = ?
        )

      GROUP BY
        p.id,
        p.name,
        p.start_date,
        p.deadline

    `, [projectId, employeeId]);

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
    // IMPORTANT
    // EMPLOYEE SHOULD ONLY SEE
    // TASKS ASSIGNED TO HIM
    // =========================

    tasks = tasks.filter(
      task =>
        Number(task.assigned_to) ===
        Number(employeeId)
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
      "Employee project progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate project progress"
    });
  }
};
// EMPLOYEE NOTIFICATIONS 

// Send notification to a single employee
export const addNotificationForEmployee = async ({
  title,
  full_message,
  type = 'info',
  priority = 'medium',
  employeeId
}) => {
  if (!employeeId) return;

  try {
    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id, title, full_message, type, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unread')`,
      ['employee', employeeId, title.trim(), full_message.trim(), type, priority]
    );
    console.log(`✅ Notification sent to employee ${employeeId}: ${title}`);
  } catch (err) {
    console.error('Employee notification failed:', err.message);
  }
};

// Helper: Send notification to multiple employees (bulk)
export const addNotificationForEmployees = async ({
  title,
  full_message,
  type = 'info',
  priority = 'medium',
  employeeIds = []
}) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;

  const values = employeeIds.map(id => [
    'employee',
    Number(id),
    title.trim(),
    full_message.trim(),
    type,
    priority,
    'unread'
  ]);

  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');

  try {
    await pool.query(`
      INSERT INTO notifications 
        (recipient_type, recipient_id, title, full_message, type, priority, status)
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
        title,
        full_message,
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
        AND LOWER(office_role) = 'employee'
      `,
      [employeeId]
    );

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

    console.error(
      "Get employee profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee profile"
    });
  }
};

// Update Employee Profile
export const updateEmployeeProfile = async (req, res) => {

  const employeeId = req.user.id;

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
        AND LOWER(office_role) = 'employee'
      `,
      [
        firstName,
        lastName,
        phone || null,
        designation || null,
        location || null,
        bio || null,
        employeeId
      ]
    );

    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
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
      [employeeId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedRows[0]
    });

  } catch (error) {

    console.error(
      "Update employee profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

export default {
  syncEmployee,
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