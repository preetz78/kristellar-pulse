// backend/src/controllers/adminController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get all users (for Team Management page)
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT
         u.id,
         'user' AS entity_type,
         u.user_id AS member_code,
         u.name,
         u.email,
         u.role,
         u.profile_picture,
         u.department_id,
         d.name AS department_name,
         u.created_at
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.role <> 'admin'

       UNION ALL

       SELECT
         e.id,
         'employee' AS entity_type,
         e.employee_id AS member_code,
         e.name,
         e.email,
         e.role,
         e.profile_picture,
         e.department_id,
         d.name AS department_name,
         e.created_at
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id

       ORDER BY created_at DESC, id DESC`
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Create new user (with profile picture support) - FIXED
export const createUser = async (req, res) => {
  const {
    userId,
    name,
    email,
    password,
    role,
    phone,
    designation,
    location,
    bio,
    department,
    departmentId
  } = req.body;

  const profilePicPath = req.file
    ? `/uploads/profile_pics/${req.file.filename}`
    : null;

  // Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password and role are required"
    });
  }

  try {
    const userRole = role.toLowerCase();
    const normalizedDepartmentId = departmentId || department || null;

    if (normalizedDepartmentId && Number.isNaN(Number(normalizedDepartmentId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid department selected"
      });
    }

    if (normalizedDepartmentId) {
      const [departmentRows] = await pool.execute(
        `SELECT id FROM departments WHERE id = ?`,
        [normalizedDepartmentId]
      );

      if (departmentRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected department does not exist"
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    /*
      =========================
      IF ROLE IS EMPLOYEE
      SAVE INTO EMPLOYEES TABLE
      =========================
    */
    if (userRole === "employee") {
      // Check duplicate email in employees table
      const [existingEmployee] = await pool.execute(
        `SELECT id FROM employees WHERE email = ?`,
        [email]
      );

      if (existingEmployee.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Employee email already exists"
        });
      }

      if (userId) {
        const [existingEmployeeId] = await pool.execute(
          `SELECT id FROM employees WHERE employee_id = ?`,
          [userId]
        );

        if (existingEmployeeId.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Employee ID already exists"
          });
        }
      }

      const [result] = await pool.execute(
        `INSERT INTO employees
        (
          employee_id,
          name,
          email,
          password,
          phone,
          designation,
          location,
          bio,
          department_id,
          profile_picture,
          created_by,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId || null,
          name,
          email,
          hashedPassword,
          phone || null,
          designation || null,
          location || null,
          bio || null,
          normalizedDepartmentId || null,
          profilePicPath,
          req.user?.id || null
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employeeId: result.insertId
      });
    }

    /*
      =========================
      MANAGER / REVIEWER / ADMIN
      SAVE INTO USERS TABLE
      =========================
    */
    else {
      // Check duplicate email in users table
      const [existingUser] = await pool.execute(
        `SELECT id FROM users WHERE email = ?`,
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: "User email already exists"
        });
      }

      if (userId) {
        const [existingUserId] = await pool.execute(
          `SELECT id FROM users WHERE user_id = ?`,
          [userId]
        );

        if (existingUserId.length > 0) {
          return res.status(409).json({
            success: false,
            message: "User ID already exists"
          });
        }
      }

      const [result] = await pool.execute(
        `INSERT INTO users
        (
          user_id,
          name,
          email,
          password,
          role,
          phone,
          designation,
          location,
          bio,
          department_id,
          profile_picture,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId || null,
          name,
          email,
          hashedPassword,
          userRole,
          phone || null,
          designation || null,
          location || null,
          bio || null,
          normalizedDepartmentId || null,
          profilePicPath
        ]
      );

      return res.status(201).json({
        success: true,
        message: `${role} created successfully`,
        userId: result.insertId
      });
    }

  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user"
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

// Create projects 
export const createAdminProject = async (req, res) => {
  const {
    project_id,
    name,
    description,
    department_id,
    manager_id,
    assigned_employee_ids,
    start_date,
    deadline,
    priority
  } = req.body;

  const adminId = req.user.id;

  if (!project_id || !name || !department_id || !deadline) {
    return res.status(400).json({
      success: false,
      message: "Project ID, Name, Department and Deadline are required"
    });
  }

  try {
    // =========================
    // 1. Validate Department
    // =========================
    const [departmentRows] = await pool.execute(
      `
      SELECT id, name
      FROM departments
      WHERE id = ?
      `,
      [department_id]
    );

    if (departmentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // =========================
    // 2. Validate Manager
    // =========================
    let managerName = null;

    if (manager_id) {
      const [managerRows] = await pool.execute(
        `
        SELECT id, name
        FROM users
        WHERE id = ?
        AND role = 'manager'
        AND department_id = ?
        `,
        [manager_id, department_id]
      );

      if (managerRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected manager does not belong to this department"
        });
      }

      managerName = managerRows[0].name;
    }

    // =========================
    // 3. Validate Employees First
    // =========================
    let validEmployeeIds = [];

    if (
      Array.isArray(assigned_employee_ids) &&
      assigned_employee_ids.length > 0
    ) {
      for (const empId of assigned_employee_ids) {
        const [employeeRows] = await pool.execute(
          `
          SELECT id, name
          FROM employees
          WHERE id = ?
          AND department_id = ?
          `,
          [empId, department_id]
        );

        if (employeeRows.length > 0) {
          validEmployeeIds.push(empId);
        }
      }
    }

    // Final team size should be based on VALID employees only
    const teamSize = validEmployeeIds.length;

    // =========================
    // 4. Insert Project
    // =========================
    const [projectResult] = await pool.execute(
      `
      INSERT INTO projects (
        project_id,
        name,
        description,
        department_id,
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
        department_id,
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
    // 5. Insert Project Assignments
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
    // 6. Return Fresh Project Data
    // =========================
    const [newProjectRows] = await pool.execute(
      `
      SELECT
        p.id,
        p.project_id,
        p.name,
        p.description,
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
    console.error("Create Admin Project Error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create project"
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
        p.department_id,
        p.manager_id,
        p.project_manager_name AS manager,
        p.project_manager_name,
        p.team_size,
        p.start_date,
        p.deadline,
        p.priority,
        p.created_at,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END) AS completed_tasks,
        GROUP_CONCAT(DISTINCT pa.employee_id ORDER BY pa.employee_id) AS assigned_employee_ids
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_assignments pa ON pa.project_id = p.id
      GROUP BY p.id, p.project_id, p.name, p.project_manager_name, 
               p.description, p.department_id, p.manager_id, p.team_size, 
               p.start_date, p.deadline, p.priority, p.created_at
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
        project_id: project.project_id || project.idCode,
        title: project.title || "Untitled Project",
        name: project.name || project.title || "Untitled Project",
        description: project.description || "",
        department_id: project.department_id,
        manager_id: project.manager_id,
        manager: project.manager || "Not Assigned",
        project_manager_name: project.project_manager_name || project.manager || "",
        start_date: project.start_date
          ? (typeof project.start_date === 'string' ? project.start_date : project.start_date.toISOString().split('T')[0])
          : "",
        teamSize: project.team_size 
          ? `${project.team_size} Members` 
          : "0 Members",
        team_size: Number(project.team_size) || 0,
        deadline: formattedDeadline,
        progress: progress,
        priority: project.priority || "Medium",
        status: status,
        total_tasks: Number(project.total_tasks) || 0,
        completed_tasks: Number(project.completed_tasks) || 0,
        assigned_employee_ids: project.assigned_employee_ids
          ? project.assigned_employee_ids.split(',').map(id => Number(id.trim())).filter(Boolean)
          : []
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

export const updateAdminProject = async (req, res) => {
  const { id } = req.params;
  const {
    project_id,
    name,
    description,
    department_id,
    manager_id,
    assigned_employee_ids,
    start_date,
    deadline,
    priority
  } = req.body;

  const adminId = req.user.id;

  if (!project_id || !name || !department_id || !deadline) {
    return res.status(400).json({
      success: false,
      message: "Project ID, Name, Department and Deadline are required"
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

    const [departmentRows] = await connection.execute(
      `SELECT id FROM departments WHERE id = ?`,
      [department_id]
    );

    if (departmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    let managerName = null;

    if (manager_id) {
      const [managerRows] = await connection.execute(
        `
        SELECT id, name
        FROM users
        WHERE id = ?
          AND role = 'manager'
          AND department_id = ?
        `,
        [manager_id, department_id]
      );

      if (managerRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Selected manager does not belong to this department"
        });
      }

      managerName = managerRows[0].name;
    }

    const requestedEmployeeIds = Array.isArray(assigned_employee_ids)
      ? assigned_employee_ids.map(Number).filter(Boolean)
      : [];

    let validEmployeeIds = [];

    if (requestedEmployeeIds.length > 0) {
      const placeholders = requestedEmployeeIds.map(() => "?").join(",");
      const [employeeRows] = await connection.execute(
        `
        SELECT id
        FROM employees
        WHERE department_id = ?
          AND id IN (${placeholders})
        `,
        [department_id, ...requestedEmployeeIds]
      );

      validEmployeeIds = employeeRows.map(employee => employee.id);
    }

    await connection.execute(
      `
      UPDATE projects
      SET project_id = ?,
          name = ?,
          description = ?,
          department_id = ?,
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
        department_id,
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
        INSERT INTO project_assignments (project_id, employee_id, assigned_by)
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
    console.error("Update admin project error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update project"
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

export const getDepartmentPeople = async (req, res) => {
  const { departmentId } = req.params;

  try {
    // Get managers from users table
    const [managers] = await pool.execute(
      `
      SELECT id, name
      FROM users
      WHERE role = 'manager'
      AND department_id = ?
      ORDER BY name ASC
      `,
      [departmentId]
    );

    // Get employees from employees table
    const [employees] = await pool.execute(
      `
      SELECT id, name
      FROM employees
      WHERE department_id = ?
      ORDER BY name ASC
      `,
      [departmentId]
    );

    res.status(200).json({
      success: true,
      data: {
        managers,
        employees
      }
    });

  } catch (error) {
    console.error("Get Department People Error:", error);

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
        u.name AS manager_name,
        u.email AS manager_email,
        d.name AS department_name,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM projects p
      LEFT JOIN users u ON u.id = p.manager_id
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.name, u.email, d.name
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
    const totalTasks = Number(project.total_tasks) || 0;
    const completedTasks = Number(project.completed_tasks) || 0;

    res.json({
      success: true,
      data: {
        ...project,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    });
  } catch (error) {
    console.error("Get admin project by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project details"
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
        e.name AS assignee_name
      FROM tasks t
      LEFT JOIN employees e ON e.id = t.assigned_to
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
        u.name,
        u.email
      FROM projects p
      JOIN users u ON u.id = p.manager_id
      WHERE p.id = ?
        AND u.role = 'manager'
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
    // Fetch all tasks with project and employee details
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
        e.name AS assignee_name,
        e.email AS assignee_email,
        e.profile_picture AS assignee_profile_picture
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN employees e ON t.assigned_to = e.id
      ORDER BY p.name, t.due_date DESC
    `);

    // Fetch all comments efficiently in a single query
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

    // Create a map of task_id -> comments for faster lookup
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

    // Map comments to tasks
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
    res.status(500).json({ success: false, message: "Failed to fetch tasks", error: error.message });
  }
};

// Get Dashboard Statistics (without weekly progress chart)
export const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    let departmentFilter = '';
    let params = [];

    // If user is a reviewer, get their department and filter by it
    if (userRole === 'reviewer') {
      const [deptRows] = await pool.execute(
        `SELECT department_id FROM users WHERE id = ?`,
        [req.user.id]
      );
      const departmentId = deptRows[0]?.department_id;
      if (departmentId) {
        departmentFilter = ' WHERE p.department_id = ?';
        params = [departmentId];
      }
    }

    // Total, Active, and Completed Projects
    const [projectStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_projects,

        -- Completed Projects:
        -- Projects having at least 1 task
        -- and all tasks are completed
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

        -- Active Projects:
        -- Total Projects - Completed Projects
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
    `, params);

    // Overall Completion % based on tasks (filtered by department for reviewers)
    let completionQuery = `
      SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        ROUND(
          IFNULL(
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
            0
          ), 0) AS overall_completion
      FROM tasks t`;
    
    let completionParams = [];
    if (userRole === 'reviewer') {
      const [deptRows] = await pool.execute(
        `SELECT department_id FROM users WHERE id = ?`,
        [req.user.id]
      );
      const departmentId = deptRows[0]?.department_id;
      if (departmentId) {
        completionQuery += ` JOIN projects p ON t.project_id = p.id WHERE p.department_id = ?`;
        completionParams = [departmentId];
      }
    }

    const [completionStats] = await pool.execute(completionQuery, completionParams);

    // Fetch projects for the dropdown in frontend
    let projectsQuery = `SELECT id, name FROM projects`;
    let projectsParams = [];
    if (userRole === 'reviewer') {
      const [deptRows] = await pool.execute(
        `SELECT department_id FROM users WHERE id = ?`,
        [req.user.id]
      );
      const departmentId = deptRows[0]?.department_id;
      if (departmentId) {
        projectsQuery += ` WHERE department_id = ?`;
        projectsParams = [departmentId];
      }
    }
    projectsQuery += ` ORDER BY name ASC`;

    const [allProjects] = await pool.execute(projectsQuery, projectsParams);

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

    // 🔹 GROUP PROJECTS
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

    // 🔹 PROCESS EACH PROJECT
    for (const proj of Object.values(projectGroups)) {

      const totalTasks = proj.tasks.length;

      // Fallback
      if (!proj.start_date || !proj.deadline || totalTasks === 0) {
        projectsProgress.push({
          id: proj.id,
          name: proj.name,
          weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
          normalProgress: [0, 0, 0, 0],
          delayedProgress: [null, null, null, null],
          isDelayed: false
        });
        continue;
      }

      const start = new Date(proj.start_date);
      const deadline = new Date(proj.deadline);

      // 🔹 Completed tasks
      const completedTasks = proj.tasks.filter(
        t => t.status === "Completed" && t.completed_at
      );

      let actualEndDate = null;

      if (completedTasks.length === totalTasks) {
        actualEndDate = new Date(
          Math.max(...completedTasks.map(t => new Date(t.completed_at)))
        );
      }

      // 🔹 Dynamic END DATE
      let end;

      if (actualEndDate) {
        end = actualEndDate; // stop at completion
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
      let prevWeekStart = new Date(start);
      let cumulativeCompleted = 0;

      // 🔹 WEEKLY PROGRESS
      for (let i = 1; i <= numWeeks; i++) {
        const weekEnd = new Date(start);
        weekEnd.setDate(start.getDate() + (i * 7));

        const completedThisWeek = proj.tasks.filter(task => {
          if (task.status !== 'Completed' || !task.completed_at) return false;

          const completedDate = new Date(task.completed_at);

          return (
            completedDate >= prevWeekStart &&
            completedDate < weekEnd
          );
        }).length;

        cumulativeCompleted += completedThisWeek;

        const percentage = totalTasks > 0
          ? Math.round((cumulativeCompleted / totalTasks) * 100)
          : 0;

        weeklyProgress.push(Math.min(100, percentage));

        prevWeekStart = weekEnd;
      }

      // 🔹 DELAY LOGIC (same as manager)
      const isCompletedOnTime = actualEndDate && actualEndDate <= deadline;
      const isDelayed = !isCompletedOnTime && end > deadline;

      let deadlineWeekIndex = Math.ceil(
        (deadline - start) / (1000 * 3600 * 24 * 7)
      ) - 1;

      if (deadlineWeekIndex < 0) deadlineWeekIndex = 0;
      if (deadlineWeekIndex >= weeklyProgress.length) {
        deadlineWeekIndex = weeklyProgress.length - 1;
      }

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
    console.error("Project progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate progress graph"
    });
  }
};


// Get Admin Profile - Fetch ALL columns including new ones
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, designation, location, bio, created_at 
       FROM users 
       WHERE id = ? AND role = 'admin'`,
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
        email: admin.email,
        phone: admin.phone,
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
      message: "Current password and new password are required"
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long"
    });
  }

  try {
    // Get current hashed password
    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, adminId]
    );

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Change admin password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

// ====================== ADMIN NOTIFICATIONS ======================

const getAdminIds = async () => {
  const [admins] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin'`
  );
  return admins.map(admin => admin.id);
};

// Helper: Send notification to Admin
export const addNotificationForAdmin = async (
  message,
  type = 'info',
  priority = 'medium',
  adminId
) => {
  try {
    let adminIds = [];

    if (adminId) {
      const [rows] = await pool.query(
        `SELECT id FROM users WHERE id = ? AND role = 'admin'`,
        [adminId]
      );

      if (rows.length > 0) {
        adminIds = [adminId];
      }
    }

    if (adminIds.length === 0) {
      adminIds = await getAdminIds();
    }

    if (adminIds.length === 0) {
      console.warn('No admin users found. Skipping admin notification.');
      return;
    }

    const values = adminIds.map((id) => [
      'admin',
      id,
      message.trim(),
      type,
      priority,
      'unread'
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(',');

    await pool.query(
      `INSERT INTO notifications 
        (recipient_type, recipient_id, message, type, priority, status)
       VALUES ${placeholders}`,
      values.flat()
    );

    console.log(`✅ Notification sent to admin(s) ${adminIds.join(', ')}: ${message}`);
  } catch (err) {
    console.error('Admin notification failed:', err.message);
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
        message, 
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
  const { name, phone, designation, location, bio } = req.body;

  try {
    // Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const [result] = await pool.execute(
      `UPDATE users 
       SET name = ?, 
           phone = ?, 
           designation = ?, 
           location = ?, 
           bio = ? 
       WHERE id = ? AND role = 'admin'`,
      [name, phone || null, designation || null, location || null, bio || null, adminId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found or unauthorized"
      });
    }

    // Fetch updated data to return
    const [updatedRows] = await pool.execute(
      `SELECT id, name, email, phone, designation, location, bio, created_at 
       FROM users 
       WHERE id = ?`,
      [adminId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedRows[0]
    });

  } catch (error) {
    console.error("Update admin profile error:", error);
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
    const [projectResult] = await pool.execute("SELECT COUNT(*) as total_projects FROM projects");

    // Total Completed Tasks
    const [taskResult] = await pool.execute(
      "SELECT COUNT(*) as total_completed_tasks FROM tasks WHERE status = 'Completed'"
    );

    // Total Users (from users table - managers, reviewers, admins)
    const [userResult] = await pool.execute("SELECT COUNT(*) as total_users FROM users");

    // Total Employees (from employees table)
    const [employeeResult] = await pool.execute("SELECT COUNT(*) as total_employees FROM employees");

    // Total Team Members = Users + Employees
    const totalTeamMembers = 
      (userResult[0].total_users || 0) + 
      (employeeResult[0].total_employees || 0);

    res.json({
      success: true,
      stats: {
        totalProjects: projectResult[0].total_projects || 0,
        totalCompletedTasks: taskResult[0].total_completed_tasks || 0,
        totalUsers: userResult[0].total_users || 0,
        totalEmployees: employeeResult[0].total_employees || 0,
        totalTeamMembers: totalTeamMembers   // ← This is what we will show
      }
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
};

// Create New Department
export const createDepartment = async (req, res) => {
  const { name, description } = req.body;
  const adminId = req.user?.id;

  if (!name || name.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      message: "Department name is required" 
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO departments (name, description, created_by) 
       VALUES (?, ?, ?)`,
      [name.trim(), description?.trim() || null, adminId]
    );

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: {
        id: result.insertId,
        name: name.trim(),
        description: description?.trim() || null
      }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: "A department with this name already exists" 
      });
    }

    console.error("Create Department Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create department" 
    });
  }
};

// Get All Departments
export const getAllDepartments = async (req, res) => {
  try {
    const [departments] = await pool.execute(`
      SELECT 
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at
      FROM departments 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      departments: departments
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch departments" 
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

    const [employees] = await pool.execute(
      `SELECT e.id, e.employee_id, e.name, e.email
       FROM project_assignments pa
       JOIN employees e ON pa.employee_id = e.id
       WHERE pa.project_id = ?
       ORDER BY e.name ASC`,
      [projectId]
    );

    res.json({
      success: true,
      data: employees
    });

  } catch (error) {
    console.error("Get admin project employees error:", error);
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
