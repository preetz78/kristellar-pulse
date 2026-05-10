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

    // ====================== VALIDATE ASSIGNED EMPLOYEES ======================
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
    // ====================== CREATE PROJECT ======================
    const [result] = await pool.execute(
      `
      INSERT INTO projects (
        project_id,
        name,
        description,
        department,
        project_manager_name,
        created_by,
        start_date,
        deadline,
        priority
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project_id,
        name,
        description || null,
        managerDepartment,
        finalManagerName,
        manager_id,
        start_date || null,
        deadline,
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

          await addNotificationForEmployee(
            `You have been assigned to project: "${name}"`,
            "project",
            "medium",
            empId
          );

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

      await addNotificationForAdmin(
        `New project '${name}' created by ${finalManagerName}`,
        "project",
        "medium",
        manager_id
      );

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

  if (!projectId || !title || !assigneeId) {
    return res.status(400).json({ 
      success: false, 
      message: "Project ID, Title and Assignee are required" 
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

    await addNotificationForEmployee(
      `New task assigned: "${title}"`,
      'task',
      'high',
      assigneeId
    );

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

  if (!title || !assigneeId) {
    return res.status(400).json({
      success: false,
      message: "Title and Assignee are required"
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
  const manager_id = req.user.id;
  const { projectId } = req.query;

  try {
    let sql = `
      SELECT 
        p.id,
        p.name,
        p.start_date,
        p.deadline,
        t.id AS task_id,
        t.status,
        t.completed_at
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE (
        p.manager_id = ?
        OR p.created_by = ?
      )
    `;

    const params = [manager_id, manager_id];

    if (projectId) {
      sql += ` AND p.id = ?`;
      params.push(projectId);
    }

    const [rows] = await pool.execute(sql, params);

    const projectsProgress = [];
    const projectGroups = {};

    rows.forEach(row => {
      if (!projectGroups[row.id]) {
        projectGroups[row.id] = {
          id: row.id,
          name: row.name,
          start_date: row.start_date,
          deadline: row.deadline,
          tasks: []
        };
      }

      if (row.task_id) {
        projectGroups[row.id].tasks.push({
          status: row.status,
          completed_at: row.completed_at
        });
      }
    });

    for (const proj of Object.values(projectGroups)) {

      const totalTasks = proj.tasks.length;

      if (!proj.start_date || !proj.deadline || totalTasks === 0) {
        projectsProgress.push({
          id: proj.id,
          name: proj.name,
          startDate: proj.start_date,
          deadline: proj.deadline,
          deadlineWeekIndex: null,
          weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
          normalProgress: [0, 0, 0, 0],
          delayedProgress: [null, null, null, null],
          isDelayed: false
        });
        continue;
      }

      const start = new Date(proj.start_date);
      const deadline = new Date(proj.deadline);

      const completedTasks = proj.tasks.filter(
        t => t.status === "Completed" && t.completed_at
      );

      let actualEndDate = null;

      if (completedTasks.length === totalTasks) {
        actualEndDate = new Date(
          Math.max(...completedTasks.map(t => new Date(t.completed_at)))
        );
      }

      let end;

      if (actualEndDate) {
        end = actualEndDate; // stop when project completes
      } else {
        const today = new Date();
        end = today > deadline ? today : deadline;
      }

      const totalDays = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 3600 * 24))
      );
      const numWeeks = Math.max(1, Math.ceil(totalDays / 7));

      const weeklyProgress = [];
      const weeklyDates = [];
      let prevWeekStart = new Date(start);
      let cumulativeCompleted = 0;

      for (let i = 1; i <= numWeeks; i++) {
        const weekEnd = new Date(start);
        weekEnd.setDate(start.getDate() + (i * 7));

        const completedThisWeek = proj.tasks.filter(task => {
          if (task.status !== 'Completed' || !task.completed_at) return false;
          const completedDate = new Date(task.completed_at);
          return completedDate >= prevWeekStart && completedDate < weekEnd;
        }).length;

        cumulativeCompleted += completedThisWeek;

        const percentage = totalTasks > 0
          ? Math.round((cumulativeCompleted / totalTasks) * 100)
          : 0;

        weeklyProgress.push(Math.min(100, percentage));
        // Format date as "DD MMM" (e.g., "17 May")
        const dateStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        weeklyDates.push(dateStr);
        prevWeekStart = weekEnd;
      }

      // Delay is defined by the project deadline, not by individual task lateness.
      const isCompletedOnTime = actualEndDate && actualEndDate <= deadline;
      const isDelayed = !isCompletedOnTime && end > deadline;
      let deadlineWeekIndex = Math.ceil(
        (deadline - start) / (1000 * 3600 * 24 * 7)
      ) - 1;

      if (deadlineWeekIndex < 0) deadlineWeekIndex = 0;
      if (deadlineWeekIndex >= weeklyProgress.length) deadlineWeekIndex = weeklyProgress.length - 1;

      let normalProgress = [...weeklyProgress];
      let delayedProgress = Array(weeklyProgress.length).fill(null);

      if (isDelayed) {
        normalProgress = weeklyProgress.map((val, idx) =>
          idx <= deadlineWeekIndex ? val : null
        );

        delayedProgress = weeklyProgress.map((val, idx) =>
          idx > deadlineWeekIndex ? val : null
        );
      }

      projectsProgress.push({
        id: proj.id,
        name: proj.name,
        startDate: proj.start_date,
        deadline: proj.deadline,
        deadlineWeekIndex,
        weeks: Array.from({ length: numWeeks }, (_, i) => `Week ${i + 1}`),
        weeklyDates,
        normalProgress,
        delayedProgress,
        isDelayed
      });
    }

    res.json({
      success: true,
      data: projectsProgress
    });

  } catch (error) {
    console.error("Manager project progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate progress graph"
    });
  }
};

// MANAGER NOTIFICATIONS 

export const addNotificationForManager = async (
  message,
  type = 'info',
  priority = 'medium',
  managerId
) => {
  if (!managerId) return;

  try {
    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id, message, type, priority, status)
       VALUES (?, ?, ?, ?, ?, 'unread')`,
      ['manager', managerId, message.trim(), type, priority]
    );
    console.log(`✅ Notification sent to manager ${managerId}: ${message}`);
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
        message, 
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

    const [result] = await pool.execute(
      `UPDATE pulse_employees 
       SET firstname = ?, 
           lastname = ?, 
           work_phone = ?, 
           designation = ?, 
           location = ?, 
           bio = ? 
       WHERE id = ? AND LOWER(office_role) = 'manager'`,
      [name, phone || null, designation || null, location || null, bio || null, managerId]
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
       FROM users 
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
