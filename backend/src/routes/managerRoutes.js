// backend/src/routes/managerRoutes.js
import express from 'express';
import { createProject, getMyProjects, getAllEmployees, getProjectById, addTask, getProjectTasks, getProjectEmployees, updateTaskStatus, updateTask,deleteTask, updateProject, deleteProject, getTaskInsights } from '../controllers/managerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create a new project
router.post('/projects', protect, createProject);

router.get('/projects', protect, getMyProjects);
router.put('/projects/:id', protect, updateProject);      
router.delete('/projects/:id', protect, deleteProject);

router.get('/employees', protect, getAllEmployees);

// NEW route for single project detail
router.get('/projects/:id', protect, getProjectById);

// NEW Task Routes
router.post('/projects/:id/tasks', protect, addTask);           
router.get('/projects/:id/tasks', protect, getProjectTasks);

router.get('/projects/:id/employees', protect, getProjectEmployees);

router.put('/tasks/:taskId/status', protect, updateTaskStatus);

router.put('/tasks/:taskId', protect, updateTask);       // Edit task
router.delete('/tasks/:taskId', protect, deleteTask);    // Delete task

router.get('/task-insights', protect, getTaskInsights);


export default router;