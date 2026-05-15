import pool from '../config/db.js';
import { 
  addNotificationForEmployee 
} from './employeeController.js';
import { addNotificationForAdmin } from './adminController.js';

const getAssignedManagerProject = async (projectId, managerId) => {
  const [projects] = await pool.execute(
    `
    SELECT id, department
    FROM projects
    WHERE id = ?
    AND (
      manager_id = ?
      OR created_by = ?
    )
    `,
    [projectId, managerId, managerId]
  );

  return projects[0] || null;
};

const isEmployeeAssignedToProject = async (projectId, employeeId) => {
  const [assignments] = await pool.execute(
    `SELECT 1 FROM project_assignments WHERE project_id = ? AND employee_id = ? LIMIT 1`,
    [projectId, employeeId]
  );

  return assignments.length > 0;
};

const getManagerTask = async (taskId, managerId) => {
  const [tasks] = await pool.execute(
    `
    SELECT t.id, t.project_id
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
    AND (
      p.manager_id = ?
      OR p.created_by = ?
    )
    `,
    [taskId, managerId, managerId]
  );

  return tasks[0] || null;
};

// ====================== HELPER: Validate Employees belong to Manager's Department ======================
const validateAssignedEmployees = async (
  assigned_employee_ids,
  managerDepartment
) => {

  const employeeIds = Array.isArray(assigned_employee_ids)
    ? assigned_employee_ids
        .map(id => Number(id))
        .filter(Boolean)
    : [];

  if (employeeIds.length === 0) {
    return true;
  }

  const placeholders =
    employeeIds.map(() => '?').join(',');

  const [employees] = await pool.execute(
    `
    SELECT id

    FROM pulse_employees

    WHERE id IN (${placeholders})
      AND department = ?
      AND LOWER(office_role) = 'employee'
    `,
    [...employeeIds, managerDepartment]
  );

  return employees.length === employeeIds.length;
};

// Create New Project + Notify Employees + Notify Admin
export const createProject = async (req, res) => {

  try {

    const {
      project_id,
      name,
      description,
      department,
      project_manager_name,
      start_date,
      deadline,
      priority,
      assigned_employee_ids
    } = req.body;

    const manager_id = req.user.id;

    // ====================== GET MANAGER ======================
    const [managerRows] = await pool.execute(
      `
      SELECT
        firstname,
        lastname,
        department,
        office_role
      FROM pulse_employees
      WHERE id = ?
      `,
      [manager_id]
    );

    if (managerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    const manager = managerRows[0];

    // ====================== VALIDATE ROLE ======================
    if (
      !manager.office_role ||
      manager.office_role.toLowerCase() !== "manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only managers can create projects."
      });
    }

    // ====================== MANAGER DATA ======================
    const managerDepartment = manager.department;

    const finalManagerName =
      `${manager.firstname} ${manager.lastname}`;

    // ====================== VALIDATION ======================
    if (
      !project_id ||
      !name ||
      !managerDepartment ||
      !deadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project ID, Name, Department and Deadline are required"
      });
    }

    //DATE VALIDATION 

  if (start_date && deadline) {

    const startDateObj = new Date(start_date);
    const deadlineDateObj = new Date(deadline);

    // Remove time portion
    startDateObj.setHours(0, 0, 0, 0);
    deadlineDateObj.setHours(0, 0, 0, 0);

    // Deadline must be AFTER start date
    if (deadlineDateObj <= startDateObj) {

      return res.status(400).json({
        success: false,
        message:
          "Deadline date must be after the start date"
      });
    }
  }

    //  VALIDATE ASSIGNED EMPLOYEES 
    if (
      Array.isArray(assigned_employee_ids) &&
      assigned_employee_ids.length > 0
    ) {

      const isValid = await validateAssignedEmployees(
        assigned_employee_ids,
        managerDepartment
      );

      if (!isValid) {

        return res.status(400).json({
          success: false,
          message:
            "One or more assigned employees do not belong to your department"
        });
      }
    }

    // ====================== CLEAN EMPLOYEE IDS ======================
    const assignedEmployeeIds = Array.isArray(assigned_employee_ids)
      ? assigned_employee_ids
          .map((id) => Number(id))
          .filter(Boolean)
      : [];

    const teamSize = assignedEmployeeIds.length;

    
    // ====================== CREATE PROJECT ======================
    const [result] = await pool.execute(
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
        managerDepartment,
        manager_id,
        finalManagerName,
        manager_id,
        start_date || null,
        deadline,
        teamSize,
        priority || "Medium"
      ]
    );

    const newProjectDbId = result.insertId;

    // ====================== ASSIGN EMPLOYEES ======================
    if (teamSize > 0) {

      const values = assignedEmployeeIds.map((empId) => [
        newProjectDbId,
        empId,
        manager_id
      ]);

      await pool.query(
        `
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          assigned_by
        )
        VALUES ?
        `,
        [values]
      );

      // ====================== EMPLOYEE NOTIFICATIONS ======================
      for (const empId of assignedEmployeeIds) {

        try {

              await addNotificationForEmployee({

                title: "Project Assigned",

                full_message:
              `You have been assigned to project '${name}'.
              Please review the assigned project details.`,

                type: "project",

                priority: "medium",

                employeeId: empId
              });

        } catch (e) {

          console.error(
            `Failed to notify employee ${empId}`,
            e.message
          );
        }
      }
    }

    
    // ====================== ADMIN NOTIFICATION ======================
    try {

          await addNotificationForAdmin({

            title: "New Project Created",

            full_message:
          `Project '${name}' has been created by ${finalManagerName}.
          The project is now active in the system.`,

            type: "project",

            priority: "medium",

            adminId: manager_id
          });

      console.log(
        `✅ Admin notified about new project: "${name}"`
      );

    } catch (notifyError) {

      console.error(
        "Admin notification error:",
        notifyError.message
      );
    }

    // ====================== SUCCESS RESPONSE ======================
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        id: newProjectDbId,
        project_id,
        name,
        department: managerDepartment,
        project_manager_name: finalManagerName,
        team_size: teamSize
      }
    });

  } catch (error) {

    console.error(
      "Create project error:",
      error
    );

    if (error.code === "ER_DUP_ENTRY") {

      return res.status(409).json({
        success: false,
        message: "Project ID already exists"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message
    });
  }
};

export const getDepartmentEmployees = async (req, res) => {

  try {

    const managerId = req.user.id;

    // Get manager department
    const [managerRows] = await pool.execute(
      `
      SELECT department
      FROM pulse_employees
      WHERE id = ?
      `,
      [managerId]
    );

    if (managerRows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    const department = managerRows[0].department;

    // Get employees from same department
    const [employees] = await pool.execute(
      `
      SELECT
        id,
        employee_id,
        CONCAT(firstname, ' ', lastname) AS name

      FROM pulse_employees

      WHERE LOWER(office_role) = 'employee'
      AND department = ?
      `,
      [department]
    );

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {

    console.error(
      "Get department employees error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees"
    });
  }
};

// Get ONLY the logged-in manager's projects with REAL progress calculation
export const getMyProjects = async (req, res) => {
  const manager_id = req.user.id;

  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.*,
        CONCAT(u.firstname, ' ', u.lastname) AS manager_name,
        IFNULL(GROUP_CONCAT(DISTINCT pa.employee_id), '') AS assigned_employee_ids,
        IFNULL(tc.total_tasks, 0) AS total_tasks,
        IFNULL(tc.completed_tasks, 0) AS completed_tasks
      FROM projects p
      LEFT JOIN pulse_employees u ON p.manager_id = u.id
      LEFT JOIN project_assignments pa ON p.id = pa.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM tasks
        GROUP BY project_id
      ) tc ON p.id = tc.project_id
      WHERE
      (
        p.manager_id = ?
        OR p.created_by = ?
      )
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [manager_id, manager_id]);   // ← Fixed: Two parameters

    const formattedProjects = projects.map(project => {
      const total = Number(project.total_tasks) || 0;
      const completed = Number(project.completed_tasks) || 0;
      
      const progress = total > 0 
        ? Math.round((completed / total) * 100) 
        : 0;

      const displayStatus = progress === 100 ? "Completed" : "In Progress";

      return {
        ...project,
        assigned_employee_ids: project.assigned_employee_ids 
          ? project.assigned_employee_ids.split(',').map(id => Number(id.trim())).filter(Boolean)
          : [],
        total_tasks: total,
        completed_tasks: completed,
        progress: progress,
        display_status: displayStatus
      };
    });

    res.json({ 
      success: true, 
      data: formattedProjects 
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch projects" 
    });
  }
};

// Update Project - Disabled (Admin managed)
export const updateProject = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Projects are managed by Admin. Managers can create and manage tasks only."
  });
};

// Delete Project - Disabled (Admin managed)
export const deleteProject = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Projects are managed by Admin. Managers can create and manage tasks only."
  });
};

// Get Single Project by ID
export const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.*,
        CONCAT(u.firstname, ' ', u.lastname) AS manager_name
      FROM projects p
      LEFT JOIN pulse_employees u ON p.manager_id = u.id
      WHERE p.id = ?
        AND (
          p.manager_id = ?
          OR p.created_by = ?
        )
    `, [id, req.user.id, req.user.id]);   // ← Fixed

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.json({
      success: true,
      data: projects[0]
    });

  } catch (error) {
    console.error("Get project by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project details"
    });
  }
};

// Add Task
export const addTask = async (req, res) => {
  const { 
    project_id, 
    title, 
    description, 
    assigned_to, 
    due_date 
  } = req.body;

  const created_by = req.user.id;
  const projectId = Number(req.params.id || project_id);
  const assigneeId = Number(assigned_to);

  if (!projectId || !title || !assigneeId || !due_date) {
    return res.status(400).json({ 
      success: false, 
      message: "Project ID, Title, Assignee, and Due Date are required" 
    });
  }

  try {
    const project = await getAssignedManagerProject(projectId, created_by);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or not assigned to you"
      });
    }

    const employeeIsAssigned = await isEmployeeAssignedToProject(projectId, assigneeId);

    if (!employeeIsAssigned) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be an employee already assigned to this project"
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (project_id, title, description, assigned_to, created_by, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'In Progress')`,
      [projectId, title.trim(), description || null, assigneeId, created_by, due_date || null]
    );

    const newTaskId = result.insertId;

    // Get employee name for notification
    const [employeeRows] = await pool.execute(
      `SELECT firstname, lastname FROM pulse_employees WHERE id = ?`,
      [assigneeId]
    );

    const employeeName = employeeRows.length > 0 ? `${employeeRows[0].firstname} ${employeeRows[0].lastname}` : 'Employee';

    await addNotificationForEmployee({

      title: "New Task Assigned",

      full_message:
    `Task '${title}' has been assigned to you.

    Please complete the task before the deadline.`,

      type: 'task',

      priority: 'high',

      employeeId: assigneeId
    });

    console.log(`Notification sent for new task "${title}" to employee ID: ${assigneeId}`);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      taskId: newTaskId
    });

  } catch (error) {
    console.error("Add task error:", error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

// Get Tasks for a Project
export const getProjectTasks = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await getAssignedManagerProject(id, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or not assigned to you"
      });
    }

    const [tasks] = await pool.execute(`
      SELECT 
        t.*,
        e.employee_id,
        CONCAT(e.firstname, ' ', e.lastname) AS assignee_name
      FROM tasks t
      LEFT JOIN pulse_employees e ON t.assigned_to = e.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

// Get Employees Assigned to a Specific Project
export const getProjectEmployees = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await getAssignedManagerProject(id, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or not assigned to you"
      });
    }

    const [employees] = await pool.execute(`
      SELECT e.id, e.employee_id, CONCAT(e.firstname, ' ', e.lastname) AS name
      FROM project_assignments pa
      JOIN pulse_employees e ON pa.employee_id = e.id
      WHERE pa.project_id = ?
      ORDER BY e.firstname ASC
    `, [id]);

    res.json({ 
      success: true, 
      data: employees 
    });
  } catch (error) {
    console.error("Get project employees error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch assigned employees" 
    });
  }
};

// Update Task
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  let { title, description, assigned_to, due_date } = req.body;
  const assigneeId = Number(assigned_to);

  if (!title || !assigneeId || !due_date) {
    return res.status(400).json({
      success: false,
      message: "Title, Assignee, and Due Date are required"
    });
  }

  try {
    const task = await getManagerTask(taskId, req.user.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to one of your projects"
      });
    }

    const employeeIsAssigned = await isEmployeeAssignedToProject(task.project_id, assigneeId);

    if (!employeeIsAssigned) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be an employee already assigned to this project"
      });
    }

    let formattedDueDate = null;
    if (due_date) {
      formattedDueDate = due_date.includes('T') ? due_date.split('T')[0] : due_date;
    }

    const [result] = await pool.execute(
      `UPDATE tasks 
       SET title = ?, 
           description = ?, 
           assigned_to = ?, 
           due_date = ? 
       WHERE id = ?`,
      [
        title.trim(),
        description ? description.trim() : null,
        assigneeId,
        formattedDueDate,
        taskId
      ]
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
    console.error("Update task error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update task",
      error: error.message
    });
  }
};

// Delete Task
export const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await getManagerTask(taskId, req.user.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to one of your projects"
      });
    }

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
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

// Get Task Insights for the logged-in manager
export const getTaskInsights = async (req, res) => {

  try {

    const managerId = req.user.id;

    // ====================== GET MANAGER ======================
    const [managerRows] = await pool.execute(
      `
      SELECT
        department,
        office_role
      FROM pulse_employees
      WHERE id = ?
      `,
      [managerId]
    );

    if (managerRows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    const manager = managerRows[0];

    // ====================== VALIDATE ROLE ======================
    if (
      !manager.office_role ||
      manager.office_role.toLowerCase() !== "manager"
    ) {

      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const department = manager.department;

    // ====================== FETCH TASKS ======================
    const [tasks] = await pool.execute(
      `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.due_date,

        p.name AS project_name,

        CONCAT(
          pe.firstname,
          ' ',
          pe.lastname
        ) AS assignee_name

      FROM tasks t

      LEFT JOIN projects p
        ON t.project_id = p.id

      LEFT JOIN pulse_employees pe
        ON t.assigned_to = pe.id

      WHERE p.department = ?

      ORDER BY t.created_at DESC
      `,
      [department]
    );

    // ====================== FETCH COMMENTS ======================
    const taskIds = tasks.map(task => task.id);

    let commentsMap = {};

    if (taskIds.length > 0) {

      const [comments] = await pool.query(
        `
        SELECT
          c.id,
          c.task_id,
          c.comment_text AS comment,
          c.created_at,

          CONCAT(
            pe.firstname,
            ' ',
            pe.lastname
          ) AS reviewer_name

        FROM comments c

        LEFT JOIN pulse_employees pe
          ON c.user_id = pe.id

        WHERE c.task_id IN (?)
        `,
        [taskIds]
      );

      commentsMap = comments.reduce((acc, comment) => {

        if (!acc[comment.task_id]) {
          acc[comment.task_id] = [];
        }

        acc[comment.task_id].push(comment);

        return acc;

      }, {});
    }

    // ====================== ATTACH COMMENTS ======================
    const formattedTasks = tasks.map(task => ({
      ...task,
      comments: commentsMap[task.id] || []
    }));

    return res.status(200).json({
      success: true,
      data: formattedTasks
    });

  } catch (error) {

    console.error(
      "Get task insights error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch task insights",
      error: error.message
    });
  }
};

// NEW: Get Dashboard Stats for Logged-in Manager Only
export const getManagerDashboardStats = async (req, res) => {
  const manager_id = req.user.id;

  try {

    // =========================================
    // TOTAL / COMPLETED / ACTIVE PROJECTS
    // ONLY FOR THIS MANAGER
    // =========================================
    const [projectStats] = await pool.execute(
      `
      SELECT 
        COUNT(*) AS total_projects,

        -- COMPLETED PROJECTS
        -- Project must have at least 1 task
        -- AND all tasks must be completed
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

      FROM projects p
      WHERE (
        p.manager_id = ?
        OR p.created_by = ?
      )
      `,
      [manager_id, manager_id]
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

    // =========================================
    // FETCH ONLY MANAGER PROJECTS
    // =========================================
    const [managerProjects] = await pool.execute(
      `
      SELECT 
        id,
        name
      FROM projects
      WHERE (
        manager_id = ?
        OR created_by = ?
      )
      ORDER BY name ASC
      `,
      [manager_id, manager_id]
    );

    const stats = projectStats[0] || {};

    // =========================================
    // FINAL RESPONSE
    // =========================================
    res.json({
      success: true,

      stats: {
        totalProjects:
          Number(stats.total_projects) || 0,

        activeProjects:
          Number(stats.active_projects) || 0,

        completedProjects:
          Number(stats.completed_projects) || 0,

        overallCompletion:
          overallCompletion,
      },

      projects: managerProjects
    });

  } catch (error) {
    console.error("Manager dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch manager dashboard statistics"
    });
  }
};

// Get Project Progress for Manager's Projects Only
export const getManagerProjectProgress = async (req, res) => {

  const { projectId } = req.query;

  const managerId = req.user.id;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required"
    });
  }

  try {

    // =========================
    // FETCH PROJECT
    // =========================

    const [projects] = await pool.execute(`

      SELECT 
        p.id,
        p.name,
        p.start_date,
        p.deadline,
        p.created_by,
        p.manager_id,

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
        (
          p.manager_id = ?
          OR
          p.created_by = ?
        )

      GROUP BY
        p.id,
        p.name,
        p.start_date,
        p.deadline,
        p.created_by,
        p.manager_id

    `, [projectId, managerId, managerId]);

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
      "Manager project progress error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate project progress"
    });
  }
};

// MANAGER NOTIFICATIONS 

export const addNotificationForManager = async ({
  title,
  full_message,
  type = 'info',
  priority = 'medium',
  managerId
}) => {
  if (!managerId) return;

  try {
    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id,title, full_message, type, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unread')`,
      ['manager', managerId, title.trim(), full_message.trim(), type, priority]
    );
    console.log(`✅ Notification sent to manager ${managerId}: ${title}`);
  } catch (err) {
    console.error('Manager notification failed:', err.message);
  }
};

export const getManagerNotifications = async (req, res) => {
  try {
    const managerId = req.user.id;
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
      WHERE recipient_type = 'manager' 
        AND recipient_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [managerId, Number(limit)]);

    res.json({ 
      success: true, 
      notifications: rows || [] 
    });
  } catch (err) {
    console.error('Get manager notifications error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load notifications',
      notifications: [] 
    });
  }
};

export const markManagerNotificationAsRead = async (req, res) => {
  try {
    const managerId = req.user.id;
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
        AND recipient_type = 'manager'
        AND recipient_id = ?
        AND status = 'unread'
    `, [notificationId, managerId]);

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
    console.error('Mark manager notification read error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// ====================== MANAGER PROFILE ======================

export const getManagerProfile = async (req, res) => {

  try {

    const managerId = req.user.id;

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
        AND LOWER(office_role) = 'manager'
      `,
      [managerId]
    );

    if (rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Manager profile not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {

    console.error(
      "Get manager profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch manager profile"
    });
  }
};

export const updateManagerProfile = async (req, res) => {
  const managerId = req.user.id;
  const { name, phone, designation, location, bio } = req.body;

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
      AND LOWER(office_role) = 'manager'
    `,
    [
      firstName,
      lastName,
      phone || null,
      designation || null,
      location || null,
      bio || null,
      managerId
    ]
  );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Manager profile not found or unauthorized"
      });
    }

    const [updatedRows] = await pool.execute(
      `SELECT id, firstname, lastname, email_id, work_phone, designation, location, bio, 
              profile_picture, created_at 
       FROM pulse_employees 
       WHERE id = ?`,
      [managerId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedRows[0]
    });

  } catch (error) {
    console.error("Update manager profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

export const getManagerProfileStats = async (req, res) => {

  const managerId = req.user.id;

  try {

    const [projectResult] = await pool.execute(
      `
      SELECT COUNT(*) AS projects_managed

      FROM projects

      WHERE manager_id = ?
         OR created_by = ?
      `,
      [managerId, managerId]
    );

    const [taskResult] = await pool.execute(
      `
      SELECT COUNT(*) AS active_tasks

      FROM tasks t

      JOIN projects p
        ON t.project_id = p.id

      WHERE (
        p.manager_id = ?
        OR p.created_by = ?
      )

      AND t.status = 'In Progress'
      `,
      [managerId, managerId]
    );

    const [employeeResult] = await pool.execute(
      `
      SELECT COUNT(*) AS team_members

      FROM pulse_employees

      WHERE department = (
        SELECT department
        FROM pulse_employees
        WHERE id = ?
      )

      AND LOWER(office_role) = 'employee'
      `,
      [managerId]
    );

    res.json({
      success: true,

      stats: {
        projectsManaged:
          projectResult[0].projects_managed || 0,

        activeTasks:
          taskResult[0].active_tasks || 0,

        teamMembers:
          employeeResult[0].team_members || 0
      }
    });

  } catch (error) {

    console.error(
      "Manager profile stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch profile statistics"
    });
  }
};
