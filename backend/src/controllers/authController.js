// controllers/authController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';


// Login Controller - Fixed to include profile_picture for all roles
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required" 
    });
  }

  try {
    // ==================== FIRST: Try in users table (Admin, Manager, Reviewer) ====================
    let [users] = await pool.execute(
      `SELECT 
        id, 
        name, 
        email, 
        password, 
        role,
        profile_picture,     
        phone,
        designation,
        location,
        bio 
       FROM users 
       WHERE email = ?`, 
      [email]
    );

    if (users.length > 0) {
      const user = users[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role.toLowerCase() 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          profile_picture: user.profile_picture,     
          phone: user.phone,
          designation: user.designation,
          location: user.location,
          bio: user.bio
        }
      });
    }

    // ==================== SECOND: Try in employees table ====================
    let [employees] = await pool.execute(
      `SELECT 
        id, 
        employee_id,
        name, 
        email, 
        password, 
        designation,
        profile_picture,      
        phone,
        location,
        bio 
       FROM employees 
       WHERE email = ?`, 
      [email]
    );

    if (employees.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const employee = employees[0];

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const token = jwt.sign(
      { 
        id: employee.id, 
        role: "employee" 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        role: "Employee",
        designation: employee.designation || "Employee",
        profile_picture: employee.profile_picture,   // ← Already correct
        phone: employee.phone,
        location: employee.location,
        bio: employee.bio
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

export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required"
    });
  }

  // ✅ NEW: Strong password validation (regex)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    });
  }

  try {
    let tableName = 'users';
    let roleCondition = '';

    if (userRole === 'employee') {
      tableName = 'employees';
    } else {
      roleCondition = `AND role = '${userRole}'`;
    }

    const [user] = await pool.execute(
      `SELECT password FROM ${tableName} 
       WHERE id = ? ${roleCondition}`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const bcrypt = (await import('bcryptjs')).default;

    // ✅ Check current password
    const isMatch = await bcrypt.compare(currentPassword, user[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // ✅ NEW: Prevent using same password again (secure way)
    const isSamePassword = await bcrypt.compare(newPassword, user[0].password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as current password"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.execute(
      `UPDATE ${tableName} 
       SET password = ? 
       WHERE id = ? ${roleCondition}`,
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: "Password changed successfully. Please login again with the new password."
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};