// backend/src/routes/reviewerRoutes.js
import express from 'express';
import { 
    getAllProjectsForReviewer,
    getAllTasksForReviewer,
    getTaskComments,
    addTaskComment
 } from '../controllers/reviewerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Reviewer can see all projects
router.get('/projects', protect, getAllProjectsForReviewer);
// NEW route for tasks
router.get('/tasks', protect, getAllTasksForReviewer);

router.get('/tasks/:taskId/comments', protect, getTaskComments);
router.post('/tasks/:taskId/comments', protect, addTaskComment);

export default router;