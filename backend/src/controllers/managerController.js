// backend/src/controllers/managerController.js
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
    assigned_employee_ids   // Array of employee IDs (new field)
  } = req.body;

  const manager_id = req.user.id;
  const finalManagerName = project_manager_name || req.user.name || "Unknown Manager";

  if (!project_id || !name || !deadline) {
    return res.status(400).json({ 
      success: false, 
      message: "Project ID, Name and Deadline are required" 
    });
  }

  // Calculate team_size from number of assigned employees
  const teamSize = Array.isArray(assigned_employee_ids) ? assigned_employee_ids.length : 0;

  try {
    // Step 1: Insert the project into projects table
    const [result] = await pool.execute(
      `INSERT INTO projects 
       (project_id, name, description, manager_id, project_manager_name, deadline, team_size, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, name, description || null, manager_id, finalManagerName, deadline, teamSize, priority || 'Medium']
    );

    const newProjectDbId = result.insertId;   // Auto-generated project ID

    // Step 2: Insert assignments into project_assignments junction table (if any employees selected)
    if (teamSize > 0 && Array.isArray(assigned_employee_ids)) {
      const values = assigned_employee_ids.map(empId => [
        newProjectDbId, 
        empId, 
        manager_id   // assigned_by = current manager
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

// Get ONLY the logged-in manager's projects
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
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...project,
        assigned_employee_ids: project.assigned_employee_ids 
          ? project.assigned_employee_ids.split(',').map(id => Number(id.trim())).filter(Boolean)
          : [],
        total_tasks: total,
        completed_tasks: completed,
        progress: progress,
        // Optional: Add a computed status
        display_status: progress === 100 ? 'Completed' : 'In Progress'
      };
    });

    res.json({ 
      success: true, 
      data: formattedProjects 
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

// Update Project (Edit)
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

    // Update main project
    await pool.execute(
      `UPDATE projects 
       SET project_id = ?, name = ?, description = ?, 
           project_manager_name = ?, deadline = ?, 
           team_size = ?, priority = ? 
       WHERE id = ?`,
      [project_id, name, description || null, project_manager_name, deadline, teamSize, priority || 'Medium', id]
    );

    // Replace all assignees in junction table
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
    // Delete will cascade to project_assignments because of FOREIGN KEY ON DELETE CASCADE
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

// Fetch all employees for assignee dropdown
export const getAllEmployees = async (req, res) => {
  try {
    const [employees] = await pool.execute(`
      SELECT id, employee_id, name 
      FROM employees 
      ORDER BY name ASC
    `);

    res.json({ 
      success: true, 
      data: employees 
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch employees" 
    });
  }
};

// Get Single Project by ID (for Project Detail page)
export const getProjectById = async (req, res) => {
  const { id } = req.params;   // This is the database auto-increment id (not project_id)

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

  // Auto determine status
  let status = "In Progress";
  if (due_date) {
    const today = new Date();
    const due = new Date(due_date);
    if (due < today) {
      status = "Delayed";
    }
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO tasks 
       (project_id, title, description, assigned_to, created_by, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project_id, title, description || null, assigned_to, created_by, due_date || null, status]
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

// Get Tasks with proper JOIN and status
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

// Get Employees Assigned to a Specific Project (for dropdown)
export const getProjectEmployees = async (req, res) => {
  const { id } = req.params;   // project id

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

// Update Task Status (In Progress / Completed / Delayed)
export const updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!['In Progress', 'Completed', 'Delayed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Allowed: In Progress, Completed, Delayed"
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE tasks 
       SET status = ? 
       WHERE id = ?`,
      [status, taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task status updated successfully"
    });

  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status"
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

// Get Task Insights for the logged-in manager
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
        0 AS comment_count,                    -- Placeholder (you can add comments table later)
        CASE 
          WHEN t.status = 'Completed' THEN 100
          WHEN t.due_date < CURDATE() AND t.status != 'Completed' THEN 0
          ELSE 50 
        END AS progress
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE p.manager_id = ?
      ORDER BY p.name ASC, t.due_date ASC
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