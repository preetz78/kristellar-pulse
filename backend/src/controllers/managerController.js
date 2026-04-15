import pool from '../config/db.js';

// Create New Project with Multiple Assignees
// Create New Project with Start Date
export const createProject = async (req, res) => {
  const { 
    project_id, 
    name, 
    description, 
    project_manager_name, 
    start_date,      // ← NEW
    deadline, 
    priority,
    assigned_employee_ids   
  } = req.body;

  const manager_id = req.user.id;
  const finalManagerName = project_manager_name || req.user.name || "Unknown Manager";

  if (!project_id || !name || !deadline) {
    return res.status(400).json({ 
      success: false, 
      message: "Project ID, Name and Deadline are required" 
    });
  }

  const teamSize = Array.isArray(assigned_employee_ids) ? assigned_employee_ids.length : 0;

  try {
    const [result] = await pool.execute(
      `INSERT INTO projects 
       (project_id, name, description, manager_id, project_manager_name, start_date, deadline, team_size, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id, 
        name, 
        description || null, 
        manager_id, 
        finalManagerName, 
        start_date || null,        
        deadline, 
        teamSize, 
        priority || 'Medium'
      ]
    );

    const newProjectDbId = result.insertId;

    // Assign employees
    if (teamSize > 0 && Array.isArray(assigned_employee_ids)) {
      const values = assigned_employee_ids.map(empId => [
        newProjectDbId, 
        empId, 
        manager_id
      ]);

      await pool.query(
        `INSERT INTO project_assignments (project_id, employee_id, assigned_by) VALUES ?`,
        [values]
      );
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      projectId: project_id,
      team_size: teamSize
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: "Project ID already exists" 
      });
    }
    console.error("Create project error:", error);
    res.status(500).json({ success: false, message: "Failed to create project" });
  }
};

// Get ONLY the logged-in manager's projects with REAL progress calculation
export const getMyProjects = async (req, res) => {
  const manager_id = req.user.id;

  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.*,
        u.name AS manager_name,
        IFNULL(GROUP_CONCAT(DISTINCT pa.employee_id), '') AS assigned_employee_ids,
        IFNULL(tc.total_tasks, 0) AS total_tasks,
        IFNULL(tc.completed_tasks, 0) AS completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN project_assignments pa ON p.id = pa.project_id
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM tasks
        GROUP BY project_id
      ) tc ON p.id = tc.project_id
      WHERE p.manager_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [manager_id]);

    const formattedProjects = projects.map(project => {
      const total = Number(project.total_tasks) || 0;
      const completed = Number(project.completed_tasks) || 0;
      
      // Calculate actual progress percentage
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

// Update Project
// Update Project - Add start_date support
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { 
    project_id, 
    name, 
    description, 
    project_manager_name, 
    start_date,     // ← NEW
    deadline, 
    priority, 
    assigned_employee_ids 
  } = req.body;

  if (!project_id || !name || !deadline) {
    return res.status(400).json({ 
      success: false, 
      message: "Project ID, Name and Deadline are required" 
    });
  }

  try {
    const teamSize = Array.isArray(assigned_employee_ids) ? assigned_employee_ids.length : 0;

    await pool.execute(
      `UPDATE projects 
       SET project_id = ?, name = ?, description = ?, 
           project_manager_name = ?, start_date = ?, deadline = ?, 
           team_size = ?, priority = ? 
       WHERE id = ?`,
      [
        project_id, 
        name, 
        description || null, 
        project_manager_name, 
        start_date || null,           // ← NEW
        deadline, 
        teamSize, 
        priority || 'Medium', 
        id
      ]
    );

    // Re-assign employees (same as before)
    await pool.execute(`DELETE FROM project_assignments WHERE project_id = ?`, [id]);

    if (Array.isArray(assigned_employee_ids) && assigned_employee_ids.length > 0) {
      const values = assigned_employee_ids.map(empId => [id, empId, req.user.id]);
      await pool.query(
        `INSERT INTO project_assignments (project_id, employee_id, assigned_by) VALUES ?`,
        [values]
      );
    }

    res.json({
      success: true,
      message: "Project updated successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(`DELETE FROM projects WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
};

// Get Single Project by ID
export const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.*,
        u.name as manager_name
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = ?
    `, [id]);

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

  if (!project_id || !title || !assigned_to) {
    return res.status(400).json({ 
      success: false, 
      message: "Project ID, Title and Assignee are required" 
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (project_id, title, description, assigned_to, created_by, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'In Progress')`,
      [project_id, title, description || null, assigned_to, created_by, due_date || null]
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      taskId: result.insertId
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
    const [tasks] = await pool.execute(`
      SELECT 
        t.*,
        e.employee_id,
        e.name AS assignee_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
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
    const [employees] = await pool.execute(`
      SELECT e.id, e.employee_id, e.name 
      FROM project_assignments pa
      JOIN employees e ON pa.employee_id = e.id
      WHERE pa.project_id = ?
      ORDER BY e.name ASC
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

// Update Task (Edit)
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, assigned_to, due_date } = req.body;

  if (!title || !assigned_to) {
    return res.status(400).json({
      success: false,
      message: "Title and Assignee are required"
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE tasks 
       SET title = ?, 
           description = ?, 
           assigned_to = ?, 
           due_date = ? 
       WHERE id = ?`,
      [title, description || null, assigned_to, due_date || null, taskId]
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
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};

// Delete Task
export const deleteTask = async (req, res) => {
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
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

// Get Task Insights for the logged-in manager (Simplified)
export const getTaskInsights = async (req, res) => {
  const manager_id = req.user.id;

  try {
    const [data] = await pool.execute(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.due_date,
        p.name AS project_name,
        e.name AS assignee_name,
        e.employee_id AS assignee_employee_id,
        COUNT(c.id) AS comment_count,
        JSON_ARRAYAGG(
          CASE 
            WHEN c.id IS NOT NULL THEN JSON_OBJECT(
              'id', c.id,
              'reviewer_name', c.reviewer_name,
              'comment_text', c.comment_text,
              'created_at', c.created_at
            )
          END
        ) AS comments
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN comments c ON t.id = c.task_id
      WHERE p.manager_id = ?
      GROUP BY t.id, t.title, t.description, t.status, t.due_date, 
               p.name, e.name, e.employee_id
      ORDER BY p.name ASC, t.created_at DESC
    `, [manager_id]);

    // Clean and filter out null/empty comments
    const normalizedData = data.map(task => ({
      ...task,
      comments: Array.isArray(task.comments) 
        ? task.comments.filter(c => c && c.comment_text && c.comment_text.trim() !== "")
        : []
    }));

    res.json({ 
      success: true, 
      data: normalizedData 
    });
  } catch (error) {
    console.error("Task insights error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch task insights",
      error: error.message 
    });
  }
};
// EMPLOYEE MANAGEMENT 

export const createEmployee = async (req, res) => {
  const { name, employee_id, email, password, phone, designation } = req.body;
  const profilePicPath = req.file ? `/uploads/employee/${req.file.filename}` : null;

  const created_by_manager_id = req.user.id;

  if (!name || !employee_id || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, Employee ID, Email and Password are required" 
    });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM employees WHERE employee_id = ? OR email = ?', 
      [employee_id, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Employee ID or Email already exists" });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.execute(`
      INSERT INTO employees 
      (employee_id, name, email, password, phone, designation, profile_picture, created_by_manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee_id, name, email, hashedPassword, 
      phone || null, designation || null, 
      profilePicPath, created_by_manager_id
    ]);

    res.json({ 
      success: true, 
      message: "Employee created successfully" 
    });

  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create employee" 
    });
  }
};

export const getTeamEmployees = async (req, res) => {
  const manager_id = req.user.id;

  try {
    const [employees] = await pool.execute(`
      SELECT 
        id, employee_id, name, email, phone, 
        designation, profile_picture, created_at
      FROM employees 
      WHERE created_by_manager_id = ?    
      ORDER BY name ASC
    `, [manager_id]);

    res.json({ 
      success: true, 
      data: employees 
    });

  } catch (error) {
    console.error("Get team employees error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch team members" 
    });
  }
};

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, employee_id, email, phone, designation } = req.body;
  const profilePicPath = req.file ? `/uploads/employee/${req.file.filename}` : null;

  if (!name || !employee_id || !email) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, Employee ID and Email are required" 
    });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM employees WHERE id = ? AND created_by_manager_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found or unauthorized" 
      });
    }

    let query = `
      UPDATE employees 
      SET name = ?, employee_id = ?, email = ?, phone = ?, designation = ?
    `;
    let params = [name, employee_id, email, phone || null, designation || null];

    if (profilePicPath) {
      query += `, profile_picture = ?`;
      params.push(profilePicPath);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Failed to update employee" 
      });
    }

    res.json({ 
      success: true, 
      message: "Employee updated successfully" 
    });

  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update employee" 
    });
  }
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const [employee] = await pool.execute(
      'SELECT profile_picture FROM employees WHERE id = ?', 
      [id]
    );

    if (employee.length > 0 && employee[0].profile_picture) {
      const filePath = path.join(process.cwd(), employee[0].profile_picture.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.execute('DELETE FROM employees WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: "Employee deleted successfully" 
    });

  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ success: false, message: "Failed to delete employee" });
  }
};

// NEW: Get Dashboard Stats for Logged-in Manager Only

export const getManagerDashboardStats = async (req, res) => {
  const manager_id = req.user.id;

  try {
    // Stats for this manager's projects only
    const [projectStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_projects,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.project_id = p.id AND t.status = 'In Progress'
        ) THEN 1 ELSE 0 END) AS active_projects,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM tasks t WHERE t.project_id = p.id
        ) 
        AND NOT EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.project_id = p.id AND t.status != 'Completed'
        ) THEN 1 ELSE 0 END) AS completed_projects
      FROM projects p
      WHERE p.manager_id = ?
    `, [manager_id]);

    // Overall Completion % for this manager's tasks only
    const [completionStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        ROUND(
          IFNULL(
            SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
            0
          ), 0) AS overall_completion
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.manager_id = ?
    `, [manager_id]);

    // Projects list for dropdown (only this manager's projects)
    const [managerProjects] = await pool.execute(`
      SELECT id, name 
      FROM projects 
      WHERE manager_id = ?
      ORDER BY name ASC
    `, [manager_id]);

    const stats = projectStats[0] || {};
    const completion = completionStats[0] || {};

    res.json({
      success: true,
      stats: {
        totalProjects: Number(stats.total_projects) || 0,
        activeProjects: Number(stats.active_projects) || 0,
        completedProjects: Number(stats.completed_projects) || 0,   // Fixed key
        overallCompletion: Number(completion.overall_completion) || 0,
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
      WHERE p.manager_id = ?
    `;

    const params = [manager_id];

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
          color: "#3b82f6",
          weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
          progress: [0, 0, 0, 0]
        });
        continue;
      }

      const start = new Date(proj.start_date);
      const end = new Date(proj.deadline);

      const totalDays = Math.max(7, Math.ceil((end - start) / (1000 * 3600 * 24)));
      const numWeeks = Math.max(4, Math.ceil(totalDays / 7));

      const weeklyProgress = [];
      let prevWeekEnd = new Date(start);

      for (let i = 1; i <= numWeeks; i++) {
        const weekEnd = new Date(start);
        weekEnd.setDate(weekEnd.getDate() + Math.floor((totalDays / numWeeks) * i));

        const completedThisWeek = proj.tasks.filter(task => {
          if (task.status !== 'Completed' || !task.completed_at) return false;
          const completedDate = new Date(task.completed_at);
          return completedDate > prevWeekEnd && completedDate <= weekEnd;
        }).length;

        const percentage = totalTasks > 0
          ? Math.round((completedThisWeek / totalTasks) * 100)
          : 0;

        weeklyProgress.push(Math.min(100, percentage));

        prevWeekEnd = weekEnd;
      }

      const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
      const color = colors[(proj.id % colors.length)];

      projectsProgress.push({
        id: proj.id,
        name: proj.name,
        color: color,
        weeks: Array.from({ length: numWeeks }, (_, i) => `Week ${i + 1}`),
        progress: weeklyProgress
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