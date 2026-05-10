// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Access token required. Please login first." 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      role: (decoded.role || '').toLowerCase()   // Safe fallback
    };

    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};

export const protectInternal = (req, res, next) => {

    try {

        // Read API key from headers
        const apiKey = req.headers["x-internal-api-key"];

        // Validate key
        if (
            !apiKey ||
            apiKey !== process.env.PULSE_SYNC_API_KEY
        ) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        next();

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal authentication error"
        });
    }
};