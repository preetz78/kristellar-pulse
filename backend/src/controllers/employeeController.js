// backend/src/controllers/employeeController.js
import pool from '../config/db.js';

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
        u.name AS manager,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE pa.employee_id = ?
      GROUP BY p.id
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
        p.project_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
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

// Mark task as Completed when employee ticks the checkbox
export const completeTask = async (req, res) => {
  const { id } = req.params;
  const employee_id = req.user.id;

  console.log(`[CompleteTask] Request - Task ID: ${id}, Employee ID: ${employee_id}`);

  try {
    // Verify the task belongs to this employee
    const [taskCheck] = await pool.execute(
      `SELECT id FROM tasks WHERE id = ? AND assigned_to = ?`,
      [id, employee_id]
    );

    if (taskCheck.length === 0) {
      console.log("❌ Authorization failed for task", id);
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task"
      });
    }

    // ✅ Corrected SQL - No trailing comma
    const [result] = await pool.execute(`
      UPDATE tasks 
      SET 
        status = 'Completed',
        completed_at = CURRENT_TIMESTAMP,
        progress = 100
      WHERE id = ?
    `, [id]);

    console.log(`✅ Task ${id} updated successfully. Affected rows: ${result.affectedRows}`);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task marked as completed successfully"
    });

  } catch (error) {
    console.error("❌ Complete task error:", error.message);
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
    // 1. Projects assigned to this employee
    const [projectStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT p.id) AS total_projects
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.employee_id = ?
    `, [employee_id]);

    // 2. Task statistics for this employee
    const [taskStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'In Progress' OR status = 'Delayed' THEN 1 ELSE 0 END) AS active_tasks
      FROM tasks 
      WHERE assigned_to = ?
    `, [employee_id]);

    // 3. Overall Completion Percentage
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
      WHERE assigned_to = ?
    `, [employee_id]);

    const projects = projectStats[0] || {};
    const tasksData = taskStats[0] || {};
    const completion = completionStats[0] || {};

    res.json({
      success: true,
      stats: {
        totalProjects: Number(projects.total_projects) || 0,
        activeTasks: Number(tasksData.active_tasks) || 0,
        completedTasks: Number(tasksData.completed_tasks) || 0,
        overallCompletion: Number(completion.overall_completion) || 0,
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
    return res.status(400).json({ success: false, message: "projectId is required" });
  }

  try {
    // Get project details + employee's tasks only
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
      JOIN project_assignments pa ON p.id = pa.project_id
      LEFT JOIN tasks t ON p.id = t.project_id AND t.assigned_to = ?
      WHERE p.id = ? AND pa.employee_id = ?
      GROUP BY p.id, p.name, p.start_date, p.deadline
    `, [employee_id, projectId, employee_id]);

    if (projects.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const proj = projects[0];
    const start = new Date(proj.start_date);
    const deadline = new Date(proj.deadline);
    const totalDays = Math.max(1, Math.ceil((deadline - start) / (1000 * 60 * 60 * 24)));
    const numWeeks = Math.max(4, Math.ceil(totalDays / 7));

    const taskList = Array.isArray(proj.tasks) ? proj.tasks : [];
    const totalTasks = taskList.length;

    const weeklyProgress = [];
    let prevWeekEnd = new Date(start);

    for (let i = 1; i <= numWeeks; i++) {
      const weekEnd = new Date(start);
      weekEnd.setDate(weekEnd.getDate() + Math.floor((totalDays / numWeeks) * i));

      // Count ONLY this employee's tasks completed in this specific week
      const completedThisWeek = taskList.filter(task => {
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

    const progressData = {
      id: proj.id,
      name: proj.name,
      color: color,
      weeks: Array.from({ length: numWeeks }, (_, i) => `Week ${i + 1}`),
      progress: weeklyProgress
    };

    res.json({
      success: true,
      data: [progressData]
    });

  } catch (error) {
    console.error("Employee project progress error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate your progress graph" 
    });
  }
};

export default {
  getMyAssignedProjects,
  getMyTasks,
  completeTask,
  getEmployeeProjectProgress,
  getEmployeeDashboardStats
};