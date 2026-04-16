// backend/src/routes/adminRoutes.js
import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser,     
  deleteUser,
  getAllProjects,
  getAllAdminTasks,
  getDashboardStats,
  getProjectProgress,
  getAdminProfile,
  getAdminNotifications,
  markAdminNotificationAsRead 
} from '../controllers/adminController.js';

import upload from '../middleware/profileUpload.js'; 
import { protect } from '../middleware/auth.js'; 

const router = express.Router();

// GET all users
router.get('/users', getAllUsers);

// POST create new user - with file upload support
router.post('/users', upload.single('profile_picture'), createUser);   

// PUT update user - with optional file upload support
router.put('/users/:id', upload.single('profile_picture'), updateUser);   

// DELETE user by ID
router.delete('/users/:id', deleteUser);

router.get('/projects', getAllProjects);

router.get('/tasks', getAllAdminTasks);

router.get('/dashboard', getDashboardStats);

router.get('/project-progress', getProjectProgress);

router.get('/profile', protect, getAdminProfile);
// router.put('/profile', protect, updateAdminProfile);
// router.post('/change-password', protect, changeAdminPassword); 

router.get('/notifications', protect, getAdminNotifications);
router.patch('/notifications/:notificationId/read', protect, markAdminNotificationAsRead);

export default router;
