// backend/src/routes/managerRoutes.js
import express from 'express';
import upload from '../middleware/profileUpload.js';
import { 
  createProject, 
  getMyProjects, 
  getProjectById, 
  addTask, 
  getProjectTasks, 
  getProjectEmployees, 
  updateTask,          // Keep for editing task details
  deleteTask, 
  updateProject, 
  deleteProject, 
  getTaskInsights, 
  createEmployee,
  getTeamEmployees, 
  updateEmployee,    
  deleteEmployee ,
  getManagerDashboardStats,
  getManagerProjectProgress
} from '../controllers/managerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ====================== PROJECT ROUTES ======================
router.post('/projects', protect, createProject);
router.get('/projects', protect, getMyProjects);
router.put('/projects/:id', protect, updateProject);      
router.delete('/projects/:id', protect, deleteProject);

// Single project detail
router.get('/projects/:id', protect, getProjectById);

// ====================== TASK ROUTES ======================
// Create new task
router.post('/projects/:id/tasks', protect, addTask);           

// Get all tasks for a project
router.get('/projects/:id/tasks', protect, getProjectTasks);

// Get employees assigned to a project (for dropdown)
router.get('/projects/:id/employees', protect, getProjectEmployees);

// Edit task (title, description, assignee, due date)
router.put('/tasks/:taskId', protect, updateTask);       

// Delete task
router.delete('/tasks/:taskId', protect, deleteTask);    

// ====================== TASK INSIGHTS ======================
router.get('/task-insights', protect, getTaskInsights);

// EMPLOYEE MANAGEMENT ======================
router.post('/employees', protect, upload.single('profile_picture'), createEmployee);
router.get('/employees', protect, getTeamEmployees);   
router.put('/employees/:id', protect, upload.single('profile_picture'), updateEmployee);
router.delete('/employees/:id', protect, deleteEmployee);

router.get('/dashboard', protect, getManagerDashboardStats);
router.get('/project-progress', protect, getManagerProjectProgress);


export default router;