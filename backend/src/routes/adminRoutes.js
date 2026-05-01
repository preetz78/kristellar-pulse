// backend/src/routes/adminRoutes.js
import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser,     
  deleteUser,
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
  createDepartment,
  getAllDepartments,
  getDepartmentPeople,
  createAdminTask,
  getAdminProjectEmployees,
  updateAdminTask,
  deleteAdminTask,
  updateAdminProject,
  deleteAdminProject
} from '../controllers/adminController.js';

import { changePassword } from '../controllers/authController.js';

import upload from '../middleware/profileUpload.js'; 
import { protect } from '../middleware/auth.js'; 

const router = express.Router();

// GET all users
router.get('/users', protect, getAllUsers);

// POST create new user - with file upload support
router.post('/users', protect, upload.single('profile_picture'), createUser);   

// PUT update user - with optional file upload support
router.put('/users/:id', protect, upload.single('profile_picture'), updateUser);   

// DELETE user by ID
router.delete('/users/:id', protect, deleteUser);

router.post('/projects/create', protect, createAdminProject);
router.get('/projects', getAllProjects);
router.put('/projects/:id', protect, updateAdminProject);
router.delete('/projects/:id', protect, deleteAdminProject);
router.get('/projects/:id', protect, getAdminProjectById);
router.get('/projects/:id/tasks', protect, getAdminProjectTasks);
router.get('/projects/:id/managers', protect, getAdminProjectManagers);
router.get("/departments/:departmentId/people",protect,getDepartmentPeople);

router.get('/tasks', protect, getAllAdminTasks);

router.post('/projects/:projectId/tasks',  protect, createAdminTask);
// router.get('/projects/:projectId/tasks',  protect, getAdminProjectTasks);
router.get('/projects/:projectId/employees',  protect, getAdminProjectEmployees);
router.put('/tasks/:taskId',  protect, updateAdminTask);
router.delete('/tasks/:taskId',  protect, deleteAdminTask);
router.get('/dashboard', getDashboardStats);

router.get('/project-progress', getProjectProgress);

router.get('/profile', protect, getAdminProfile);
// router.put('/profile', protect, updateAdminProfile);
// router.post('/change-password', protect, changeAdminPassword); 

router.get('/notifications', protect, getAdminNotifications);
router.patch('/notifications/:notificationId/read', protect, markAdminNotificationAsRead);

router.put('/profile', protect, updateAdminProfile);
router.get('/dashboard-stats', protect, getAdminDashboardStats);

router.put('/change-password', protect, changePassword);

// Department Routes
router.post('/departments', protect, createDepartment);
router.get('/departments', protect, getAllDepartments);
export default router;
