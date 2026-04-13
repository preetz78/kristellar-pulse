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

// Get employee's assigned tasks with dynamic status calculation
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

    // Dynamically compute progress and status for each task
    const processedTasks = tasks.map(task => {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let computedStatus = "In Progress";
      let computedProgress = 0;

      if (task.status === "Completed") {
        computedStatus = "Completed";
        computedProgress = 100;
      } else if (dueDate && dueDate < today) {
        computedStatus = "Delayed";
        computedProgress = 0;
      } else {
        computedStatus = "In Progress";
        computedProgress = 50;
      }

      const dueDateString = dueDate ? dueDate.toISOString().split('T')[0] : null;

      return {
        ...task,
        status: computedStatus,
        due_date: dueDateString,
        progress: computedProgress
      };
    });

    res.json({
      success: true,
      data: processedTasks
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

  try {
    // Verify the task belongs to this employee
    const [taskCheck] = await pool.execute(
      `SELECT id FROM tasks WHERE id = ? AND assigned_to = ?`,
      [id, employee_id]
    );

    if (taskCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task"
      });
    }

    // ✅ Update ONLY status (no progress column update)
    await pool.execute(`
      UPDATE tasks 
      SET status = 'Completed'
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: "Task marked as completed successfully"
    });

  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete task"
    });
  }
};

export default {
  getMyAssignedProjects,
  getMyTasks,
  completeTask
};