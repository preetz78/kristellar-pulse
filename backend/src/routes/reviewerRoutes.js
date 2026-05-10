// backend/src/routes/reviewerRoutes.js
import express from 'express';
import { 
    getAllProjectsForReviewer,
    getAllTasksForReviewer,
    getTaskComments,
    addTaskComment,
    getReviewerNotifications,
    markReviewerNotificationAsRead,
    getReviewerProfile,
    updateReviewerProfile,
    approveTask,
    reopenTask,
    getReviewerTaskStats
 } from '../controllers/reviewerController.js';

import { 
  getDashboardStats,
  getProjectProgress 
} from '../controllers/adminController.js';

import { changePassword } from '../controllers/authController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// Reviewer can see all projects
router.get('/projects', protect, getAllProjectsForReviewer);
// NEW route for tasks
router.get('/tasks', protect, getAllTasksForReviewer);

router.get('/tasks/:taskId/comments', protect, getTaskComments);
router.post('/tasks/:taskId/comments', protect, addTaskComment);
router.patch('/tasks/:taskId/approve', protect, approveTask);
router.patch('/tasks/:taskId/reopen', protect, reopenTask);
router.get('/task-stats', protect, getReviewerTaskStats);

router.get('/dashboard', protect, getDashboardStats);
router.get('/project-progress', protect, getProjectProgress);

router.get('/notifications', protect, getReviewerNotifications);
router.patch('/notifications/:notificationId/read', protect, markReviewerNotificationAsRead);

router.get('/profile', protect, getReviewerProfile);
router.put('/profile', protect, updateReviewerProfile);

router.put('/change-password', protect, changePassword);

export default router;