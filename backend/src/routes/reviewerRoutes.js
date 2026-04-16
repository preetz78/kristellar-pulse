// backend/src/routes/reviewerRoutes.js
import express from 'express';
import { 
    getAllProjectsForReviewer,
    getAllTasksForReviewer,
    getTaskComments,
    addTaskComment,
    getReviewerNotifications,
    markReviewerNotificationAsRead
 } from '../controllers/reviewerController.js';

import { 
  getDashboardStats,
  getProjectProgress 
} from '../controllers/adminController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// Reviewer can see all projects
router.get('/projects', protect, getAllProjectsForReviewer);
// NEW route for tasks
router.get('/tasks', protect, getAllTasksForReviewer);

router.get('/tasks/:taskId/comments', protect, getTaskComments);
router.post('/tasks/:taskId/comments', protect, addTaskComment);

router.get('/dashboard', protect, getDashboardStats);
router.get('/project-progress', protect, getProjectProgress);

router.get('/notifications', protect, getReviewerNotifications);
router.patch('/notifications/:notificationId/read', protect, markReviewerNotificationAsRead);

export default router;