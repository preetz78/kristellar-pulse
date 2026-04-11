import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Login Controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required" 
    });
  }

  try {
    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ?', 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name,
        email: user.email, 
        role: user.role.toLowerCase() 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1)
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
};