// backend/src/controllers/adminController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get all users (for Team Management page)
export const getAllUsers = async (req, res) => {

  try {

    const [users] = await pool.execute(`

      SELECT
        id,
        employee_id AS member_code,
        firstname,
        lastname,
        CONCAT(firstname, ' ', lastname) AS name,
        email_id,
        office_role,
        designation,
        department,
        profile_picture,
        location,
        created_at

      FROM pulse_employees
      ORDER BY created_at DESC

    `);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// Create projects 
export const createAdminProject = async (req, res) => {

  const {
    project_id,
    name,
    description,
    department,
    manager_id,
    assigned_employee_ids,
    start_date,
    deadline,
    priority
  } = req.body;

  const adminId = req.user.id;

  if (!project_id || !name || !department || !deadline) {
    return res.status(400).json({
      success: false,
      message: "Project ID, Name, Department and Deadline are required"
    });
  }

  try {

    // =========================
    // Validate Manager
    // =========================
    let managerName = null;

    if (manager_id) {

      const [managerRows] = await pool.execute(
        `
        SELECT
          id,
          firstname,
          lastname

        FROM pulse_employees

        WHERE id = ?
          AND LOWER(office_role) = 'manager'
          AND department = ?
        `,
        [manager_id, department]
      );

      if (managerRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected manager does not belong to this department"
        });
      }

      managerName =
        `${managerRows[0].firstname} ${managerRows[0].lastname}`;
    }

    // =========================
    // Validate Employees
    // =========================
    let validEmployeeIds = [];

    if (
      Array.isArray(assigned_employee_ids) &&
      assigned_employee_ids.length > 0
    ) {

      for (const empId of assigned_employee_ids) {

        const [employeeRows] = await pool.execute(
          `
          SELECT id

          FROM pulse_employees

          WHERE id = ?
            AND LOWER(office_role) = 'employee'
            AND department = ?
          `,
          [empId, department]
        );

        if (employeeRows.length > 0) {
          validEmployeeIds.push(empId);
        }
      }
    }

    const teamSize = validEmployeeIds.length;

    // =========================
    // Insert Project
    // =========================
    const [projectResult] = await pool.execute(
      `
      INSERT INTO projects (
        project_id,
        name,
        description,
        department,
        manager_id,
        project_manager_name,
        created_by,
        start_date,
        deadline,
        team_size,
        priority
      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project_id,
        name,
        description || null,
        department,
        manager_id || null,
        managerName,
        adminId,
        start_date || null,
        deadline,
        teamSize,
        priority || "Medium"
      ]
    );

    const newProjectId = projectResult.insertId;

    // =========================
    // Insert Project Assignments
    // =========================
    if (validEmployeeIds.length > 0) {

      for (const empId of validEmployeeIds) {

        await pool.execute(
          `
          INSERT INTO project_assignments (
            project_id,
            employee_id,
            assigned_by
          )

          VALUES (?, ?, ?)
          `,
          [newProjectId, empId, adminId]
        );
      }
    }

    // =========================
    // Return Project
    // =========================
    const [newProjectRows] = await pool.execute(
      `
      SELECT
        p.id,
        p.project_id,
        p.name,
        p.description,
        p.department,
        p.priority,
        p.deadline,
        p.team_size,
        p.created_at,
        p.project_manager_name,
        0 AS progress

      FROM projects p

      WHERE p.id = ?
      `,
      [newProjectId]
    );

    res.status(201).json({
      success: true,
      message: "Project created and assigned successfully",
      data: newProjectRows[0]
    });

  } catch (error) {

    console.error(
      "Create Admin Project Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to create project"
    });
  }
};
// Get all projects with dynamic progress & status based on tasks
export const getAllProjects = async (req, res) => {
  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.id,
        p.project_id AS idCode,
        p.project_id,
        p.name AS title,
        p.name,
        p.description,
        p.department,
        p.manager_id,
        p.project_manager_name AS manager,
        p.project_manager_name,
        p.team_size,
        p.start_date,
        p.deadline,
        p.priority,
        p.created_at,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(
          DISTINCT CASE
            WHEN t.status = 'Completed'
            THEN t.id
          END
        ) AS completed_tasks,
        GROUP_CONCAT(
          DISTINCT pa.employee_id
          ORDER BY pa.employee_id
        ) AS assigned_employee_ids

      FROM projects p

      LEFT JOIN tasks t
        ON t.project_id = p.id

      LEFT JOIN project_assignments pa
        ON pa.project_id = p.id

      GROUP BY
        p.id,
        p.project_id,
        p.name,
        p.project_manager_name,
        p.description,
        p.department,
        p.manager_id,
        p.team_size,
        p.start_date,
        p.deadline,
        p.priority,
        p.created_at

      ORDER BY p.created_at DESC
    `);

    const formattedProjects = projects.map(project => {
      const total = Number(project.total_tasks) || 0;
      const completed = Number(project.completed_tasks) || 0;

      const progress =
        total > 0
          ? Math.round((completed / total) * 100)
          : 0;

      const status =
        total > 0 && completed === total
          ? "Completed"
          : "In Progress";

      let formattedDeadline = "No Deadline";

      if (project.deadline) {
        formattedDeadline =
          typeof project.deadline === 'string'
            ? project.deadline
            : project.deadline.toISOString().split('T')[0];
      }

      return {
        id: project.id,

        idCode:
          project.idCode ||
          `PRJ-${String(project.id).padStart(3, '0')}`,

        project_id:
          project.project_id || project.idCode,

        title:
          project.title || "Untitled Project",

        name:
          project.name ||
          project.title ||
          "Untitled Project",

        description:
          project.description || "",

        department:
          project.department || "",

        manager_id:
          project.manager_id,

        manager:
          project.manager || "Not Assigned",

        project_manager_name:
          project.project_manager_name ||
          project.manager ||
          "",

        start_date:
          project.start_date
            ? (
                typeof project.start_date === 'string'
                  ? project.start_date
                  : project.start_date
                      .toISOString()
                      .split('T')[0]
              )
            : "",

        teamSize:
          project.team_size
            ? `${project.team_size} Members`
            : "0 Members",

        team_size:
          Number(project.team_size) || 0,

        deadline:
          formattedDeadline,

        progress:
          progress,

        priority:
          project.priority || "Medium",

        status:
          status,

        total_tasks:
          total,

        completed_tasks:
          completed,

        assigned_employee_ids:
          project.assigned_employee_ids
            ? project.assigned_employee_ids
                .split(',')
                .map(id => Number(id.trim()))
                .filter(Boolean)
            : []
      };
    });

    res.json({
      success: true,
      data: formattedProjects,

      stats: {
        total: formattedProjects.length,

        inProgress:
          formattedProjects.filter(
            p => p.status === "In Progress"
          ).length,

        highPriority:
          formattedProjects.filter(
            p => p.priority === "High"
          ).length
      }
    });

  } catch (error) {
    console.error(
      "Get all projects error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch projects from database"
    });
  }
};

export const updateAdminProject = async (req, res) => {

  const { id } = req.params;

  const {
    project_id,
    name,
    description,
    department,
    manager_id,
    assigned_employee_ids,
    start_date,
    deadline,
    priority
  } = req.body;

  const adminId = req.user.id;

  if (!project_id || !name || !department || !deadline) {
    return res.status(400).json({
      success: false,
      message:
        "Project ID, Name, Department and Deadline are required"
    });
  }

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    const [projectRows] = await connection.execute(
      `SELECT id FROM projects WHERE id = ?`,
      [id]
    );

    if (projectRows.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    let managerName = null;

    if (manager_id) {

      const [managerRows] = await connection.execute(
        `
        SELECT
          id,
          firstname,
          lastname

        FROM pulse_employees

        WHERE id = ?
          AND LOWER(office_role) = 'manager'
          AND department = ?
        `,
        [manager_id, department]
      );

      if (managerRows.length === 0) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Selected manager does not belong to this department"
        });
      }

      managerName =
        `${managerRows[0].firstname} ${managerRows[0].lastname}`;
    }

    const requestedEmployeeIds =
      Array.isArray(assigned_employee_ids)
        ? assigned_employee_ids
            .map(Number)
            .filter(Boolean)
        : [];

    let validEmployeeIds = [];

    if (requestedEmployeeIds.length > 0) {

      const placeholders =
        requestedEmployeeIds
          .map(() => "?")
          .join(",");

      const [employeeRows] = await connection.execute(
        `
        SELECT id

        FROM pulse_employees

        WHERE department = ?
          AND LOWER(office_role) = 'employee'
          AND id IN (${placeholders})
        `,
        [department, ...requestedEmployeeIds]
      );

      validEmployeeIds =
        employeeRows.map(employee => employee.id);
    }

    await connection.execute(
      `
      UPDATE projects

      SET
        project_id = ?,
        name = ?,
        description = ?,
        department = ?,
        manager_id = ?,
        project_manager_name = ?,
        start_date = ?,
        deadline = ?,
        team_size = ?,
        priority = ?

      WHERE id = ?
      `,
      [
        project_id,
        name,
        description || null,
        department,
        manager_id || null,
        managerName,
        start_date || null,
        deadline,
        validEmployeeIds.length,
        priority || "Medium",
        id
      ]
    );

    await connection.execute(
      `DELETE FROM project_assignments WHERE project_id = ?`,
      [id]
    );

    for (const employeeId of validEmployeeIds) {

      await connection.execute(
        `
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          assigned_by
        )

        VALUES (?, ?, ?)
        `,
        [id, employeeId, adminId]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Project updated successfully"
    });

  } catch (error) {

    await connection.rollback();

    console.error(
      "Update admin project error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to update project"
    });

  } finally {

    connection.release();
  }
};

export const deleteAdminProject = async (req, res) => {
  const { id } = req.params;

  try {
    const [projectRows] = await pool.execute(
      `SELECT id FROM projects WHERE id = ?`,
      [id]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    await pool.execute(
      `DELETE FROM projects WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Delete admin project error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete project"
    });
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  try {

    const [rows] = await pool.execute(`
      SELECT DISTINCT department
      FROM pulse_employees
      WHERE department IS NOT NULL
        AND department != ''
      ORDER BY department ASC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {

    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments"
    });
  }
};

export const getDepartmentPeople = async (req, res) => {

  const { department } = req.params;

  try {

    const [managers] = await pool.execute(

      `
      SELECT
        id,
        CONCAT(firstname, ' ', lastname) AS name

      FROM pulse_employees

      WHERE LOWER(office_role) = 'manager'
      AND department = ?

      ORDER BY firstname ASC
      `,
      [department]
    );

    const [employees] = await pool.execute(

      `
      SELECT
        id,
        CONCAT(firstname, ' ', lastname) AS name

      FROM pulse_employees

      WHERE LOWER(office_role) = 'employee'
      AND department = ?

      ORDER BY firstname ASC
      `,
      [department]
    );

    res.status(200).json({
      success: true,
      data: {
        managers,
        employees
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch department people"
    });
  }
};

export const getAdminProjectById = async (req, res) => {

  const { id } = req.params;

  try {

    const [projects] = await pool.execute(
      `
      SELECT
        p.*,

        CONCAT(
          u.firstname,
          ' ',
          u.lastname
        ) AS manager_name,

        u.email_id AS manager_email,

        COUNT(t.id) AS total_tasks,

        SUM(
          CASE
            WHEN t.status = 'Completed'
            THEN 1
            ELSE 0
          END
        ) AS completed_tasks

      FROM projects p

      LEFT JOIN pulse_employees u
        ON u.id = p.manager_id

      LEFT JOIN tasks t
        ON t.project_id = p.id

      WHERE p.id = ?

      GROUP BY
        p.id,
        u.firstname,
        u.lastname,
        u.email_id
      `,
      [id]
    );

    if (projects.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const project = projects[0];

    const totalTasks =
      Number(project.total_tasks) || 0;

    const completedTasks =
      Number(project.completed_tasks) || 0;

    const progress =
      totalTasks > 0
        ? Math.round(
            (completedTasks / totalTasks) * 100
          )
        : 0;

    res.json({
      success: true,

      data: {
        ...project,
        progress
      }
    });

  } catch (error) {

    console.error(
      "Get admin project by id error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch project details"
    });
  }
};

export const getAdminProjectTasks = async (req, res) => {
  const { id } = req.params;

  try {
    const [projects] = await pool.execute(
      `SELECT id FROM projects WHERE id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const [tasks] = await pool.execute(
      `
      SELECT
        t.*,
        e.employee_id,
        CONCAT(e.firstname, ' ', e.lastname) AS assignee_name,
        e.email_id AS assignee_email,
        e.department,
        e.designation

      FROM tasks t

      LEFT JOIN pulse_employees e
        ON e.id = t.assigned_to

      WHERE t.project_id = ?

      ORDER BY t.created_at DESC
      `,
      [id]
    );

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error("Get admin project tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks"
    });
  }
};

export const getAdminProjectManagers = async (req, res) => {
  const { id } = req.params;

  try {
    const [managers] = await pool.execute(
      `
      SELECT
        u.id,
        u.employee_id,
        CONCAT(u.firstname, ' ', u.lastname) AS name,
        u.email_id AS email,
        u.department,
        u.designation,
        u.profile_picture

      FROM projects p

      JOIN pulse_employees u
        ON u.id = p.manager_id

      WHERE p.id = ?
        AND LOWER(u.office_role) = 'manager'
      `,
      [id]
    );

    res.json({
      success: true,
      data: managers
    });

  } catch (error) {
    console.error("Get admin project managers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch project manager"
    });
  }
};

export const getAllAdminTasks = async (req, res) => {
  try {

    const [tasks] = await pool.execute(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.due_date,
        t.progress,
        t.completed_at,
        t.created_at,
        t.project_id,

        p.name AS project_name,

        e.id AS assignee_id,
        e.employee_id,
        CONCAT(e.firstname, ' ', e.lastname) AS assignee_name,
        e.email_id AS assignee_email,
        e.profile_picture AS assignee_profile_picture,
        e.department AS assignee_department,
        e.designation AS assignee_designation

      FROM tasks t

      LEFT JOIN projects p
        ON t.project_id = p.id

      LEFT JOIN pulse_employees e
        ON t.assigned_to = e.id

      ORDER BY p.name, t.due_date DESC
    `);

    const [allComments] = await pool.execute(`
      SELECT 
        id,
        task_id,
        reviewer_name,
        comment_text,
        created_at

      FROM comments

      ORDER BY task_id, created_at DESC
    `);

    const commentsMap = {};

    allComments.forEach(comment => {

      if (!commentsMap[comment.task_id]) {
        commentsMap[comment.task_id] = [];
      }

      commentsMap[comment.task_id].push({
        id: comment.id,
        reviewer_name: comment.reviewer_name,
        comment_text: comment.comment_text,
        created_at: comment.created_at
      });

    });

    const tasksWithComments = tasks.map(task => ({
      ...task,
      comments: commentsMap[task.id] || []
    }));

    res.json({
      success: true,
      data: tasksWithComments
    });

  } catch (error) {

    console.error("Get all admin tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

// Get Dashboard Statistics (without weekly progress chart)
export const getDashboardStats = async (req, res) => {
  try {

    const userRole =
      req.user?.role?.toLowerCase();

    let departmentFilter = '';
    let params = [];

    // REVIEWER DEPARTMENT FILTER
    if (userRole === 'reviewer') {

      const [deptRows] = await pool.execute(
        `
        SELECT department
        FROM pulse_employees
        WHERE id = ?
        `,
        [req.user.id]
      );

      const department =
        deptRows[0]?.department;

      if (department) {
        departmentFilter =
          ' WHERE p.department = ?';

        params = [department];
      }
    }

    // TOTAL / COMPLETED / ACTIVE PROJECTS
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
      ${departmentFilter}
      `,
      params
    );

    const totalProjects =
      Number(projectStats[0]?.total_projects) || 0;

    const completedProjects =
      Number(projectStats[0]?.completed_projects) || 0;

    const overallCompletion =
      totalProjects > 0
        ? Math.round(
            (completedProjects / totalProjects) * 100
          )
        : 0;

    // FETCH PROJECTS FOR DROPDOWN
    let projectsQuery = `
      SELECT id, name
      FROM projects
    `;

    let projectsParams = [];

    if (userRole === 'reviewer') {

      const [deptRows] = await pool.execute(
        `
        SELECT department
        FROM pulse_employees
        WHERE id = ?
        `,
        [req.user.id]
      );

      const department =
        deptRows[0]?.department;

      if (department) {
        projectsQuery +=
          ` WHERE department = ?`;

        projectsParams = [department];
      }
    }

    projectsQuery += ` ORDER BY name ASC`;

    const [allProjects] = await pool.execute(
      projectsQuery,
      projectsParams
    );

    const stats = projectStats[0] || {};

    res.json({
      success: true,

      stats: {
        totalProjects:
          Number(stats.total_projects) || 0,

        activeProjects:
          Number(stats.active_projects) || 0,

        completedProjects:
          Number(stats.completed_projects) || 0,

        overallCompletion
      },

      projects: allProjects
    });

  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard statistics"
    });
  }
};

// Get Project Progress based on actual Start Date and Deadline
export const getProjectProgress = async (req, res) => {

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

      LEFT JOIN tasks t
        ON p.id = t.project_id

      WHERE p.id = ?

      GROUP BY
        p.id,
        p.name,
        p.start_date,
        p.deadline
    `, [projectId]);

    // =========================
    // PROJECT NOT FOUND
    // =========================

    if (projects.length === 0) {
      return res.json({
        success: true,
        data: []
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

    tasks = tasks.filter(task => task.id !== null);

    // =========================
    // BASIC COUNTS
    // =========================

    const totalTasks = tasks.length;

    const completedTasks = tasks
      .filter(task =>
        task.status === "Completed" &&
        task.completed_at
      )
      .sort((a, b) =>
        new Date(a.completed_at) -
        new Date(b.completed_at)
      );

    // =========================
    // DATES
    // =========================

    const startDate = new Date(project.start_date);

    const deadlineDate = new Date(project.deadline);

    const today = new Date();

    // =========================
    // FINAL COMPLETION DATE
    // =========================

    let finalCompletionDate = null;

    if (
      totalTasks > 0 &&
      completedTasks.length === totalTasks
    ) {

      finalCompletionDate = new Date(
        completedTasks[
          completedTasks.length - 1
        ].completed_at
      );
    }

    // =========================
    // DELAY CHECK
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

    // =========================
    // DEADLINE PASSED
    // =========================

    const deadlinePassed =
      today > deadlineDate;

    // =========================
    // GRAPH POINTS
    // =========================

    const progressPoints = [];

    // =========================
    // START POINT
    // =========================

    progressPoints.push({

      date: startDate,

      percentage: 0,

      completedTasks: 0,

      tasksCompletedOnDate: 0,

      isToday: false,

      isDeadlineCrossed: false
    });

    // =========================
    // TASK COMPLETION DOTS
    // =========================

    completedTasks.forEach((task, index) => {

      const completedDate =
        new Date(task.completed_at);

      const percentage = totalTasks > 0
        ? Math.round(
            ((index + 1) / totalTasks) * 100
          )
        : 0;

      const isDeadlineCrossed =
        completedDate > deadlineDate;

      progressPoints.push({

        date: completedDate,

        percentage,

        completedTasks: index + 1,

        tasksCompletedOnDate: 1,

        isToday: false,

        isDeadlineCrossed
      });
    });

    // =========================
    // TODAY POINT ALWAYS
    // =========================

    const currentProgress = totalTasks > 0
      ? Math.round(
          (completedTasks.length / totalTasks) * 100
        )
      : 0;

    const todayDeadlineCrossed =
      today > deadlineDate;

    progressPoints.push({

      date: today,

      percentage: currentProgress,

      completedTasks: completedTasks.length,

      tasksCompletedOnDate: 0,

      isToday: true,

      isDeadlineCrossed: todayDeadlineCrossed
    });

    // =========================
    // SORT BY DATE
    // =========================

    progressPoints.sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );

    // =========================
    // FRONTEND READY GRAPH DATA
    // =========================

    const progressHistory =
      progressPoints.map(point => ({

        // X AXIS LABEL

        xLabel:

          point.isToday

            ? `Today ${new Date(point.date)
                .toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit"
                })}`

            : new Date(point.date)
                .toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                }),

        // Y VALUE

        percentage: point.percentage,

        // TASK DETAILS

        completedTasks:
          point.completedTasks,

        totalTasks,

        tasksCompletedOnDate:
          point.tasksCompletedOnDate,

        // DATE

        date: point.date,

        // FLAGS

        isToday: point.isToday,

        isDeadlineCrossed:
          point.isDeadlineCrossed,

        // GREEN LINE

        greenProgress:
          point.isDeadlineCrossed
            ? null
            : point.percentage,

        // RED LINE

        redProgress:
          point.isDeadlineCrossed
            ? point.percentage
            : null
      }));

    // =========================
    // RESPONSE
    // =========================

    res.json({
      success: true,

      data: [{

        id: project.id,

        name: project.name,

        startDate: project.start_date,

        deadline: project.deadline,

        currentDate: today,

        actualCompletionDate:
          finalCompletionDate,

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
      "Project progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate project progress"
    });
  }
};


// Get Admin Profile - Fetch ALL columns including new ones
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
          id,
          CONCAT(firstname, ' ', lastname) AS name,
          email_id,
          work_phone,
          designation,
          bio,
          location,
          profile_picture,
          created_at

      FROM pulse_employees

      WHERE id = ?`,
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found"
      });
    }

    const admin = rows[0];

    res.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email_id,
        phone: admin.work_phone,
        designation: admin.designation,
        location: admin.location,
        bio: admin.bio,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile"
    });
  }
};

// Change Admin Password
export const changeAdminPassword = async (req, res) => {

  const { currentPassword, newPassword } = req.body;

  const adminId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message:
        "Current password and new password are required"
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message:
        "New password must be at least 6 characters long"
    });
  }

  try {

    const [rows] = await pool.execute(
      `
      SELECT password

      FROM pulse_employees

      WHERE id = ?
        AND LOWER(office_role) = 'admin'
      `,
      [adminId]
    );

    if (rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      rows[0].password
    );

    if (!isMatch) {

      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(newPassword, salt);

    await pool.execute(
      `
      UPDATE pulse_employees

      SET password = ?

      WHERE id = ?
      `,
      [hashedPassword, adminId]
    );

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {

    console.error(
      "Change admin password error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

// ====================== ADMIN NOTIFICATIONS ======================

const getAdminIds = async () => {

  const [admins] = await pool.query(`
    SELECT id
    FROM pulse_employees
    WHERE LOWER(office_role) = 'admin'

  `);
  return admins.map(admin => admin.id);
};

// Helper: Send notification to Admin
export const addNotificationForAdmin = async ({
  title,
  full_message,
  type = 'info',
  priority = 'medium',
  adminId
}) => {

  try {

    let adminIds = [];

    // Specific admin notification
    if (adminId) {

      const [rows] = await pool.query(
        `
        SELECT id
        FROM pulse_employees
        WHERE id = ?
          AND LOWER(office_role) = 'admin'
        `,
        [adminId]
      );

      if (rows.length > 0) {
        adminIds = [adminId];
      }
    }

    // Notify all admins
    if (adminIds.length === 0) {
      adminIds = await getAdminIds();
    }

    if (adminIds.length === 0) {

      console.warn(
        'No admin users found. Skipping admin notification.'
      );

      return;
    }

    const values = adminIds.map(id => [
      'admin',
      id,
      title.trim(),
      full_message.trim(),
      type,
      priority,
      'unread'
    ]);

    const placeholders =
      values.map(() => '(?, ?, ?, ?, ?, ?, ?)')
        .join(',');

    await pool.query(
      `
      INSERT INTO notifications (
        recipient_type,
        recipient_id,
        title,
        full_message,
        type,
        priority,
        status
      )

      VALUES ${placeholders}
      `,
      values.flat()
    );

    console.log(
      `✅ Notification sent to admin(s) ${adminIds.join(', ')}: ${title}`
    );

  } catch (err) {

    console.error(
      'Admin notification failed:',
      err.message
    );
  }
};

// Get notifications for the logged-in admin
export const getAdminNotifications = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const adminIds = await getAdminIds();

    if (adminIds.length === 0) {
      return res.json({
        success: true,
        notifications: []
      });
    }

    const placeholders = adminIds.map(() => '?').join(',');
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
      WHERE recipient_type = 'admin'
        AND recipient_id IN (${placeholders})
      ORDER BY created_at DESC
      LIMIT ?
    `, [...adminIds, Number(limit)]);

    res.json({ 
      success: true, 
      notifications: rows || [] 
    });
  } catch (err) {
    console.error('Get admin notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load notifications',
      notifications: [] 
    });
  }
};

// Mark notification as read
export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
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
        AND recipient_type = 'admin'
        AND recipient_id = ?
        AND status = 'unread'
    `, [notificationId, adminId]);

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
    console.error('Mark admin notification read error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// Update Admin Profile
export const updateAdminProfile = async (req, res) => {

  const adminId = req.user.id;

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
        AND LOWER(office_role) = 'admin'
      `,
      [
        firstName,
        lastName,
        phone || null,
        designation || null,
        location || null,
        bio || null,
        adminId
      ]
    );

    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message:
          "Admin profile not found or unauthorized"
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
      [adminId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedRows[0]
    });

  } catch (error) {

    console.error(
      "Update admin profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

// Get Real Stats for Admin Profile (with correct Team Members count)
export const getAdminDashboardStats = async (req, res) => {

  try {

    // Total Projects
    const [projectResult] = await pool.execute(
      `SELECT COUNT(*) AS total_projects FROM projects`
    );

    // Total Completed Tasks
    const [taskResult] = await pool.execute(
      `
      SELECT COUNT(*) AS total_completed_tasks

      FROM tasks

      WHERE status = 'Completed'
      `
    );

    // Total Users / Team Members
    const [userResult] = await pool.execute(
      `
      SELECT COUNT(*) AS total_users

      FROM pulse_employees
      `
    );

    // Role-based counts
    const [managerResult] = await pool.execute(
      `
      SELECT COUNT(*) AS total_managers

      FROM pulse_employees

      WHERE LOWER(office_role) = 'manager'
      `
    );

    const [reviewerResult] = await pool.execute(
      `
      SELECT COUNT(*) AS total_reviewers

      FROM pulse_employees

      WHERE LOWER(office_role) = 'reviewer'
      `
    );

    const [employeeResult] = await pool.execute(
      `
      SELECT COUNT(*) AS total_employees

      FROM pulse_employees

      WHERE LOWER(office_role) = 'employee'
      `
    );

    const [adminResult] = await pool.execute(
      `
      SELECT COUNT(*) AS total_admins

      FROM pulse_employees

      WHERE LOWER(office_role) = 'admin'
      `
    );

    res.json({
      success: true,

      stats: {
        totalProjects:
          projectResult[0].total_projects || 0,

        totalCompletedTasks:
          taskResult[0].total_completed_tasks || 0,

        totalUsers:
          userResult[0].total_users || 0,

        totalAdmins:
          adminResult[0].total_admins || 0,

        totalManagers:
          managerResult[0].total_managers || 0,

        totalReviewers:
          reviewerResult[0].total_reviewers || 0,

        totalEmployees:
          employeeResult[0].total_employees || 0,

        totalTeamMembers:
          userResult[0].total_users || 0
      }
    });

  } catch (error) {

    console.error(
      "Admin dashboard stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard statistics"
    });
  }
};


export const createAdminTask = async (req, res) => {
  const { projectId } = req.params;
  const { 
    title, 
    description, 
    assigned_to, 
    due_date 
  } = req.body;

  const created_by = req.user.id;

  if (!title || !assigned_to) {
    return res.status(400).json({
      success: false,
      message: "Title and assigned_to (employee) are required"
    });
  }

  try {
    // Validate project exists
    const [projectRows] = await pool.execute(
      `SELECT id FROM projects WHERE id = ?`,
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Validate employee exists and is assigned to the project
    const [employeeRows] = await pool.execute(
      `SELECT id FROM project_assignments 
       WHERE project_id = ? AND employee_id = ?`,
      [projectId, assigned_to]
    );

    if (employeeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Employee is not assigned to this project"
      });
    }

    // Clean due_date
    let cleanDueDate = null;
    if (due_date) {
      cleanDueDate = due_date.includes('T') 
        ? due_date.split('T')[0] 
        : due_date;
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (project_id, title, description, assigned_to, created_by, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'In Progress')`,
      [projectId, title.trim(), description || null, assigned_to, created_by, cleanDueDate]
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      taskId: result.insertId
    });

  } catch (error) {
    console.error("Create admin task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message
    });
  }
};

// Get Employees Assigned to a Project (Admin view)
export const getAdminProjectEmployees = async (req, res) => {

  const { projectId } = req.params;

  try {

    const [projectRows] = await pool.execute(
      `SELECT id FROM projects WHERE id = ?`,
      [projectId]
    );

    if (projectRows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const [employees] = await pool.execute(
      `
      SELECT
        e.id,
        e.employee_id,

        CONCAT(
          e.firstname,
          ' ',
          e.lastname
        ) AS name,

        e.email_id AS email,
        e.department,
        e.designation,
        e.profile_picture

      FROM project_assignments pa

      JOIN pulse_employees e
        ON pa.employee_id = e.id

      WHERE pa.project_id = ?

      ORDER BY name ASC
      `,
      [projectId]
    );

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {

    console.error(
      "Get admin project employees error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned employees",
      error: error.message
    });
  }
};

// Update Task (Admin version)
export const updateAdminTask = async (req, res) => {
  const { taskId } = req.params;
  const { 
    title, 
    description, 
    assigned_to, 
    due_date 
  } = req.body;

  if (!title || !assigned_to) {
    return res.status(400).json({
      success: false,
      message: "Title and assigned_to are required"
    });
  }

  try {
    // Get the task to verify it exists
    const [taskRows] = await pool.execute(
      `SELECT project_id FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const projectId = taskRows[0].project_id;

    // Validate employee is assigned to the project
    const [employeeRows] = await pool.execute(
      `SELECT id FROM project_assignments 
       WHERE project_id = ? AND employee_id = ?`,
      [projectId, assigned_to]
    );

    if (employeeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Employee is not assigned to this project"
      });
    }

    // Clean due_date
    let cleanDueDate = null;
    if (due_date) {
      cleanDueDate = due_date.includes('T') 
        ? due_date.split('T')[0] 
        : due_date;
    }

    const [result] = await pool.execute(
      `UPDATE tasks 
       SET title = ?, 
           description = ?, 
           assigned_to = ?, 
           due_date = ? 
       WHERE id = ?`,
      [title.trim(), description || null, assigned_to, cleanDueDate, taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully"
    });

  } catch (error) {
    console.error("Update admin task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message
    });
  }
};

// Delete Task (Admin version)
export const deleteAdminTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const [result] = await pool.execute(
      `DELETE FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error("Delete admin task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message
    });
  }
};

export const getAllTeamMembers = async (req, res) => {

  try {

    const [rows] = await pool.execute(
      `
      SELECT
        id,
        employee_id,

        CONCAT(firstname, ' ', lastname) AS name,

        email_id AS email,

        office_role AS role,

        department,

        designation,

        work_phone AS phone,

        location,

        bio,

        profile_picture

      FROM pulse_employees

      ORDER BY created_at DESC
      `
    );

    return res.status(200).json(rows);

  } catch (error) {

    console.error(
      "Get team members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch team members"
    });
  }
};

export const updateUserRole = async (req, res) => {

  try {

    const { userId } = req.params;

    const { role } = req.body;

    if (!role) {

      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }

    await pool.execute(
      `
      UPDATE pulse_employees
      SET office_role = ?
      WHERE id = ?
      `,
      [role, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Role updated successfully"
    });

  } catch (error) {

    console.error(
      "Update role error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update role"
    });
  }
};
