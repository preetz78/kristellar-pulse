// backend/src/middleware/profileUpload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Two upload directories
const userUploadDir = 'uploads/profile_pics';
const employeeUploadDir = 'uploads/employee';

// Create directories if they don't exist
[userUploadDir, employeeUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Upload directory created: ${dir}`);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If employee_id is sent → it's an employee upload
    if (req.body.employee_id) {
      cb(null, employeeUploadDir);
    } else {
      // Regular user upload (admin, manager, reviewer)
      cb(null, userUploadDir);
    }
  },
  filename: (req, file, cb) => {
    let filename;

    if (req.body.employee_id) {
      // Employee: filename = employee_id + extension (e.g., KA001.jpg)
      const ext = path.extname(file.originalname).toLowerCase();
      filename = `${req.body.employee_id}${ext}`;
    } else {
      // Regular user: use name (your existing logic)
      const { name } = req.body;
      const cleanName = name 
        ? name.trim().replace(/[^a-zA-Z0-9]/g, '_') 
        : 'user';
      const ext = path.extname(file.originalname).toLowerCase();
      filename = `${cleanName}${ext}`;
    }

    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, etc.) are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

export default upload;