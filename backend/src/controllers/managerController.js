import pool from '../config/db.js';

// Create New Project with Multiple Assignees
export const createProject = async (req, res) => {
  const { 
    project_id, 
    name, 
    description, 
    project_manager_name, 
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
       (project_id, name, description, manager_id, project_manager_name, deadline, team_size, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, name, description || null, manager_id, finalManagerName, deadline, teamSize, priority || 'Medium']
    );

    const newProjectDbId = result.insertId;

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
        u.name as manager_name,
        IFNULL(GROUP_CONCAT(DISTINCT pa.employee_id), '') as assigned_employee_ids,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN project_assignments pa ON p.id = pa.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
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
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { project_id, name, description, project_manager_name, deadline, priority, assigned_employee_ids } = req.body;

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
           project_manager_name = ?, deadline = ?, 
           team_size = ?, priority = ? 
       WHERE id = ?`,
      [project_id, name, description || null, project_manager_name, deadline, teamSize, priority || 'Medium', id]
    );

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
        e.employee_id AS assignee_employee_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE p.manager_id = ?
      ORDER BY p.name ASC, t.created_at DESC
    `, [manager_id]);

    res.json({ 
      success: true, 
      data 
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
// ==================== EMPLOYEE MANAGEMENT ====================

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