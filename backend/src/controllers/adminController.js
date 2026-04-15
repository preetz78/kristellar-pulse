// backend/src/controllers/adminController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get all users (for Team Management page)
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, role, profile_picture, created_at 
       FROM users 
       ORDER BY id ASC`
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Create new user (with profile picture support) - FIXED
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const profilePicPath = req.file ? `/uploads/profile_pics/${req.file.filename}` : null;

  // Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email, password and role are required" 
    });
  }

  try {
    // Check if email already exists
    const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, role, profile_picture) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role.toLowerCase(), profilePicPath]   // Store role in lowercase
    );

    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create user. Please check server logs." 
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Update user (name, email, role, password, profile picture)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  const profilePicPath = req.file ? `/uploads/profile_pics/${req.file.filename}` : null;

  if (!name || !email || !role) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email and role are required" 
    });
  }

  try {
    // Check if email already exists for another user
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?', 
      [email, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Build dynamic update query
    let query = `
      UPDATE users 
      SET name = ?, email = ?, role = ?
    `;
    const params = [name, email, role.toLowerCase()];

    // If password is provided, hash and update it
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += `, password = ?`;
      params.push(hashedPassword);
    }

    // If new profile picture is uploaded, update it
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
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      message: "User updated successfully" 
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update user. Please check server logs." 
    });
  }
};

// Get all projects with dynamic progress & status based on tasks
// Get all projects with dynamic progress & status based on tasks
export const getAllProjects = async (req, res) => {
  try {
    const [projects] = await pool.execute(`
      SELECT 
        p.id,
        p.project_id AS idCode,
        p.name AS title,
        p.project_manager_name AS manager,
        p.team_size,
        p.deadline,
        p.priority,
        p.created_at,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id, p.project_id, p.name, p.project_manager_name, 
               p.team_size, p.deadline, p.priority, p.created_at
      ORDER BY p.created_at DESC
    `);

    const formattedProjects = projects.map(project => {
      const total = project.total_tasks || 0;
      const completed = project.completed_tasks || 0;
      
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Determine status
      const status = (total > 0 && completed === total && total > 0) 
        ? "Completed" 
        : "In Progress";

      // Safe deadline formatting
      let formattedDeadline = "No Deadline";
      if (project.deadline) {
        // Handle both string and Date objects safely
        const deadlineStr = typeof project.deadline === 'string' 
          ? project.deadline 
          : project.deadline.toISOString().split('T')[0];
        
        formattedDeadline = deadlineStr;
      }

      return {
        id: project.id,
        idCode: project.idCode || `PRJ-${String(project.id).padStart(3, '0')}`,
        title: project.title || "Untitled Project",
        manager: project.manager || "Not Assigned",
        teamSize: project.team_size 
          ? `${project.team_size} Members` 
          : "0 Members",
        deadline: formattedDeadline,
        progress: progress,
        priority: project.priority || "Medium",
        status: status
      };
    });

    res.json({
      success: true,
      data: formattedProjects,
      stats: {
        total: formattedProjects.length,
        inProgress: formattedProjects.filter(p => p.status === "In Progress").length,
        highPriority: formattedProjects.filter(p => p.priority === "High").length
      }
    });

  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch projects from database" 
    });
  }
};

export const getAllAdminTasks = async (req, res) => {
  try {
    // First, fetch all tasks
    const [tasks] = await pool.execute(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.due_date,
        t.project_id,
        p.name AS project_name,
        e.name AS assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN employees e ON t.assigned_to = e.id
      ORDER BY p.name, t.due_date DESC
    `);

    // For each task, fetch its comments separately
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
    console.error("Get all admin tasks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

// Get Dashboard Statistics (without weekly progress chart)
export const getDashboardStats = async (req, res) => {
  try {
    // Total, Active, and Completed Projects
    const [projectStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_projects,
        
        -- Active Projects: Projects that have at least one 'In Progress' task
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.project_id = p.id AND t.status = 'In Progress'
        ) THEN 1 ELSE 0 END) AS active_projects,
        
        -- Completed Projects: Projects where ALL tasks are Completed
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM tasks t WHERE t.project_id = p.id
        ) 
        AND NOT EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.project_id = p.id AND t.status != 'Completed'
        ) THEN 1 ELSE 0 END) AS completed_projects
        
      FROM projects p
    `);

    // Overall Completion % based on tasks (Global)
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
    `);

    // Fetch all projects for the dropdown in frontend
    const [allProjects] = await pool.execute(`
      SELECT 
        id, 
        name 
      FROM projects 
      ORDER BY name ASC
    `);

    const stats = projectStats[0] || {};
    const completion = completionStats[0] || {};

    res.json({
      success: true,
      stats: {
        totalProjects: Number(stats.total_projects) || 0,
        activeProjects: Number(stats.active_projects) || 0,
        completedProjects: Number(stats.completed_projects) || 0,
        overallCompletion: Number(completion.overall_completion) || 0,
      },
      projects: allProjects   // ← This will be used in the dropdown
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch dashboard statistics" 
    });
  }
};


// Get Project Progress based on actual Start Date and Deadline

export const getProjectProgress = async (req, res) => {
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
    `;

    const params = [];

    if (projectId) {
      sql += ` WHERE p.id = ?`;
      params.push(projectId);
    }

    const [rows] = await pool.execute(sql, params);

    const projectsProgress = [];

    const projectGroups = {};

    // Group tasks by project
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
      let prevWeekEnd = new Date(start);   // Start from project start date

      for (let i = 1; i <= numWeeks; i++) {
        const weekEnd = new Date(start);
        weekEnd.setDate(weekEnd.getDate() + Math.floor((totalDays / numWeeks) * i));

        // Count tasks completed ONLY in this specific week
        const completedThisWeek = proj.tasks.filter(task => {
          if (task.status !== 'Completed' || !task.completed_at) return false;

          const completedDate = new Date(task.completed_at);
          return completedDate > prevWeekEnd && completedDate <= weekEnd;
        }).length;

        // Calculate percentage for this week only
        const percentage = totalTasks > 0
          ? Math.round((completedThisWeek / totalTasks) * 100)
          : 0;

        weeklyProgress.push(Math.min(100, percentage));

        // Update previous week end for next iteration
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
    console.error("Project progress error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate progress graph" 
    });
  }
};