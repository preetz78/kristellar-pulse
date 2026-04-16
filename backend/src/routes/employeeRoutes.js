// backend/src/routes/employeeRoutes.js
import express from 'express';
import { 
  getMyAssignedProjects, 
  getMyTasks, 
  completeTask,
  getEmployeeDashboardStats ,
  getEmployeeProjectProgress,
  getEmployeeNotifications,
  markEmployeeNotificationAsRead   
} from '../controllers/employeeController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// Employee can only see their own assigned projects
router.get('/projects', protect, getMyAssignedProjects);

// Employee routes - only sees their own data
router.get('/tasks', protect, getMyTasks);

// NEW ROUTE: Mark a task as Completed when employee ticks checkbox
router.patch('/tasks/:id/complete', protect, completeTask);

router.get('/dashboard', protect, getEmployeeDashboardStats);

router.get('/project-progress', protect, getEmployeeProjectProgress);

router.get('/notifications', protect, getEmployeeNotifications);
router.patch('/notifications/:notificationId/read', protect, markEmployeeNotificationAsRead);

export default router;