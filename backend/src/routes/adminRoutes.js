// backend/src/routes/adminRoutes.js
import express from 'express';
import { 
  getAllUsers, 
  createAdminProject,
  getAllProjects,
  getAdminProjectById,
  getAdminProjectTasks,
  getAdminProjectManagers,
  getAllAdminTasks,
  getDashboardStats,
  getProjectProgress,
  getAdminProfile,
  getAdminNotifications,
  markAdminNotificationAsRead ,
  updateAdminProfile,
  getAdminDashboardStats,
  getDepartmentPeople,
  createAdminTask,
  getAdminProjectEmployees,
  updateAdminTask,
  deleteAdminTask,
  updateAdminProject,
  deleteAdminProject,
  getDepartments
} from '../controllers/adminController.js';

import { changePassword } from '../controllers/authController.js';

// import upload from '../middleware/profileUpload.js'; 
import { protect } from '../middleware/auth.js'; 

const router = express.Router();

// GET all users
router.get('/users', protect, getAllUsers);    

router.post('/projects/create', protect, createAdminProject);
router.get('/projects', getAllProjects);
router.put('/projects/:id', protect, updateAdminProject);
router.delete('/projects/:id', protect, deleteAdminProject);
router.get('/projects/:id', protect, getAdminProjectById);
router.get('/projects/:id/tasks', protect, getAdminProjectTasks);
router.get('/projects/:id/managers', protect, getAdminProjectManagers);
router.get("/departments/:department/people",protect,getDepartmentPeople);
router.get("/departments",protect,getDepartments);

router.get('/tasks', protect, getAllAdminTasks);

router.post('/projects/:projectId/tasks',  protect, createAdminTask);
router.get('/projects/:projectId/employees',  protect, getAdminProjectEmployees);
router.put('/tasks/:taskId',  protect, updateAdminTask);
router.delete('/tasks/:taskId',  protect, deleteAdminTask);
router.get('/dashboard', getDashboardStats);

router.get('/project-progress', getProjectProgress);

router.get('/profile', protect, getAdminProfile);

router.get('/notifications', protect, getAdminNotifications);
router.patch('/notifications/:notificationId/read', protect, markAdminNotificationAsRead);

router.put('/profile', protect, updateAdminProfile);
router.get('/dashboard-stats', protect, getAdminDashboardStats);

router.put('/change-password', protect, changePassword);

export default router;
