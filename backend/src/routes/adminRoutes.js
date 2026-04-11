// backend/src/routes/adminRoutes.js
import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser,     
  deleteUser 
} from '../controllers/adminController.js';

import upload from '../middleware/profileUpload.js';  

const router = express.Router();

// GET all users
router.get('/users', getAllUsers);

// POST create new user - with file upload support
router.post('/users', upload.single('profile_picture'), createUser);   

// PUT update user - with optional file upload support
router.put('/users/:id', upload.single('profile_picture'), updateUser);   

// DELETE user by ID
router.delete('/users/:id', deleteUser);

export default router;