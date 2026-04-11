// backend/src/middleware/profileUpload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/profile_pics';

// Automatically create the folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Profile upload directory created: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { name } = req.body;
    
    // Clean the name: "John Doe" → "John_Doe"
    const cleanName = name 
      ? name.trim().replace(/[^a-zA-Z0-9]/g, '_') 
      : 'user';

    const ext = path.extname(file.originalname).toLowerCase();
    
    // Final filename: John_Doe.jpg (as you wanted - no random numbers)
    const filename = `${cleanName}${ext}`;

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
  limits: { fileSize: 2 * 1024 * 1024 } // Max 2MB
});

export default upload;