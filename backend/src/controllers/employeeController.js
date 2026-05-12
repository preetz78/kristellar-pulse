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
  const employee_id = req.user.id;
  const { projectId } = req.query;

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
            'completed_at', t.completed_at
          )
        ) AS tasks
      FROM projects p
      JOIN project_assignments pa
        ON p.id = pa.project_id
      LEFT JOIN tasks t
        ON p.id = t.project_id
        AND t.assigned_to = ?
      WHERE p.id = ?
      AND pa.employee_id = ?
      GROUP BY
        p.id,
        p.name,
        p.start_date,
        p.deadline
    `, [employee_id, projectId, employee_id]);

    if (projects.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const proj = projects[0];

    let taskList = [];

    try {
      taskList =
        typeof proj.tasks === "string"
          ? JSON.parse(proj.tasks)
          : proj.tasks;
    } catch {
      taskList = [];
    }

    taskList = taskList.filter(
      task => task.id !== null
    );

    const totalTasks = taskList.length;

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const normaliseDate = (value) => {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const formatDate = (date) =>
      date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

    const getDayOffset = (date, startDate) =>
      Math.max(
        0,
        Math.floor(
          (normaliseDate(date) - startDate) /
          MS_PER_DAY
        )
      );

    if (!proj.start_date || totalTasks === 0) {

      return res.json({
        success: true,
        data: [{
          id: proj.id,
          name: proj.name,
          startDate: proj.start_date,
          deadline: proj.deadline,
          actualCompletionDate: null,
          isCompleted: false,
          currentDate: new Date().toISOString(),
          totalTasks,
          completedTasks: 0,
          totalDays: 1,
          deadlineDayOffset: 0,
          currentDayOffset: 0,
          weeks: ["Week 1"],
          weeklyDates: [],
          normalProgress: [null],
          delayedProgress: [null],
          actualDots: [],
          linePoints: [],
          projectionPoint: null,
          isDelayed: false
        }]
      });
    }

    const startDate = normaliseDate(
      proj.start_date
    );

    const deadline = proj.deadline
      ? normaliseDate(proj.deadline)
      : normaliseDate(proj.start_date);

    const today = normaliseDate(
      new Date()
    );

    const completedTasks = taskList
      .filter(
        task =>
          task.status === "Completed" &&
          task.completed_at
      )
      .sort(
        (a, b) =>
          new Date(a.completed_at) -
          new Date(b.completed_at)
      );

    const allTasksCompleted =
      completedTasks.length === totalTasks;

    const lastCompletionDate =
      completedTasks.length > 0
        ? normaliseDate(
            completedTasks[
              completedTasks.length - 1
            ].completed_at
          )
        : null;

    const finalEndDate = allTasksCompleted
      ? lastCompletionDate > deadline
        ? lastCompletionDate
        : deadline
      : today > deadline
        ? today
        : deadline;

    const totalDays = Math.max(
      1,
      Math.ceil(
        (finalEndDate - startDate) /
        MS_PER_DAY
      )
    );

    const totalWeeks = Math.max(
      1,
      Math.ceil(totalDays / 7)
    );

    const actualDots = [];
    const dotsByDate = {};

    let cumulativeCompleted = 0;

    completedTasks.forEach(task => {

      const completedDate =
        normaliseDate(task.completed_at);

      const dateKey =
        completedDate
          .toISOString()
          .slice(0, 10);

      cumulativeCompleted += 1;

      const percentage = Math.round(
        (cumulativeCompleted / totalTasks) * 100
      );

      dotsByDate[dateKey] = {
        dayOffset: getDayOffset(
          completedDate,
          startDate
        ),
        percentage,
        date: formatDate(completedDate),
        completedTasks: cumulativeCompleted,
        tasksCompletedOnDate:
          (
            dotsByDate[dateKey]
              ?.tasksCompletedOnDate || 0
          ) + 1,
        completedAt:
          completedDate.toISOString()
      };
    });

    actualDots.push(
      ...Object.values(dotsByDate)
    );

    const weeklyDates = [];
    const progressValues = [];
    const weekMarkers = [];

    let lastPercentage = null;

    for (let i = 0; i < totalWeeks; i++) {

      const currentWeekDate =
        new Date(startDate);

      currentWeekDate.setDate(
        startDate.getDate() + (i * 7)
      );

      const weekDate =
        formatDate(currentWeekDate);

      weeklyDates.push(weekDate);

      weekMarkers.push({
        label: `Week ${i + 1}`,
        date: weekDate,
        dayOffset: Math.min(
          i * 7,
          totalDays
        )
      });

      const weekEndOffset =
        Math.min(
          (i + 1) * 7,
          totalDays
        );

      const dotsInWeek =
        actualDots.filter(
          dot =>
            dot.dayOffset <=
            weekEndOffset
        );

      const lastDotInWeek =
        dotsInWeek[dotsInWeek.length - 1];

      if (lastDotInWeek) {
        lastPercentage =
          lastDotInWeek.percentage;
      }

      progressValues.push(
        completedTasks.length > 0
          ? lastPercentage
          : null
      );
    }

    const deadlineDayOffset =
      getDayOffset(deadline, startDate);

    const currentDayOffset =
      Math.min(
        getDayOffset(today, startDate),
        totalDays
      );

    const deadlineWeekIndex =
      Math.floor(deadlineDayOffset / 7);

    const isDelayed =
      finalEndDate > deadline;

    let normalProgress = [
      ...progressValues
    ];

    let delayedProgress =
      Array(progressValues.length)
        .fill(null);

    if (isDelayed) {

      normalProgress =
        progressValues.map(
          (value, index) =>
            index <= deadlineWeekIndex
              ? value
              : null
        );

      delayedProgress =
        progressValues.map(
          (value, index) =>
            index > deadlineWeekIndex
              ? value
              : null
        );
    }

    const linePoints =
      completedTasks.length > 0
        ? [
            {
              dayOffset: 0,
              percentage: 0,
              date: formatDate(startDate),
              type: "start"
            },

            ...actualDots.map(dot => ({
              ...dot,
              type: "completed"
            }))
          ]
        : [];

    let projectionPoint = null;

    if (
      !allTasksCompleted &&
      totalTasks > 0
    ) {

      const lastPoint =
        linePoints.length > 0
          ? linePoints[
              linePoints.length - 1
            ]
          : {
              dayOffset: 0,
              percentage: 0
            };

      const projectionDate =
        today < startDate
          ? startDate
          : today > finalEndDate
            ? finalEndDate
            : today;

      const projectionDayOffset =
        Math.min(
          getDayOffset(
            projectionDate,
            startDate
          ),
          totalDays
        );

      const nextTaskPercentage =
        Math.min(
          100,
          Math.round(
            (
              (
                completedTasks.length + 1
              ) / totalTasks
            ) * 100
          )
        );

      const availableDays =
        Math.max(
          1,
          deadlineDayOffset -
          lastPoint.dayOffset
        );

      const elapsedDays =
        Math.max(
          0,
          projectionDayOffset -
          lastPoint.dayOffset
        );

      const progressRatio =
        Math.min(
          1,
          elapsedDays / availableDays
        );

      const percentage =
        Math.round(
          lastPoint.percentage +
          (
            (
              nextTaskPercentage -
              lastPoint.percentage
            ) * progressRatio
          )
        );

      projectionPoint = {
        dayOffset: projectionDayOffset,
        percentage,
        date: formatDate(projectionDate),
        completedTasks:
          completedTasks.length,
        nextTaskPercentage,
        type: "projection"
      };

      if (
        projectionPoint.dayOffset >
        lastPoint.dayOffset
      ) {
        linePoints.push(
          projectionPoint
        );
      }
    }

    const progressData = {
      id: proj.id,
      name: proj.name,
      startDate: proj.start_date,
      deadline: proj.deadline,
      actualCompletionDate:
        allTasksCompleted &&
        lastCompletionDate
          ? lastCompletionDate.toISOString()
          : null,
      isCompleted: allTasksCompleted,
      currentDate: today.toISOString(),
      totalTasks,
      completedTasks:
        completedTasks.length,
      totalDays,
      deadlineDayOffset,
      currentDayOffset,
      weeks: Array.from(
        { length: totalWeeks },
        (_, index) =>
          `Week ${index + 1}`
      ),
      weeklyDates,
      weekMarkers,
      normalProgress,
      delayedProgress,
      actualDots,
      linePoints,
      projectionPoint,
      deadlineWeekIndex,
      isDelayed
    };

    res.json({
      success: true,
      data: [progressData]
    });

  } catch (error) {

    console.error(
      "Employee project progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate your progress graph"
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