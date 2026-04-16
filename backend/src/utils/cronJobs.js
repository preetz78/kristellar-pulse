// backend/src/utils/cronJobs.js
import cron from 'node-cron';
import pool from '../config/db.js';
import { addNotificationForEmployee } from '../controllers/employeeController.js';

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log("Running daily deadline notification job...");

  try {
    // Task Deadline - 2 days before
    const [tasks] = await pool.query(`
      SELECT t.id, t.title, t.due_date, t.assigned_to 
      FROM tasks t
      WHERE t.status != 'Completed' 
        AND t.due_date IS NOT NULL 
        AND DATEDIFF(t.due_date, CURDATE()) BETWEEN 1 AND 2
    `);

    for (const task of tasks) {
      await addNotificationForEmployee(
        `Deadline approaching for "${task.title}" (2 days left)`,
        'deadline',
        'high',
        task.assigned_to
      );
    }

    // Project Deadline - 5 days before
    const [projects] = await pool.query(`
      SELECT p.id, p.name, p.deadline, pa.employee_id 
      FROM projects p
      JOIN project_assignments pa ON p.id = pa.project_id
      WHERE p.deadline IS NOT NULL 
        AND DATEDIFF(p.deadline, CURDATE()) BETWEEN 1 AND 5
    `);

    for (const proj of projects) {
      await addNotificationForEmployee(
        `Project "${proj.name}" deadline is approaching (5 days left)`,
        'project',
        'high',
        proj.employee_id
      );
    }

  } catch (err) {
    console.error("Cron job error:", err);
  }
});

console.log("Cron jobs for deadline notifications initialized");