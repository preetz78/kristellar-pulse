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

    // ==================== LOGIN FROM pulse_employees TABLE ====================

    let [employees] = await pool.execute(
      `SELECT 
        id,
        employee_id,
        firstname,
        lastname,
        email_id,
        password,
        office_role,
        designation,
        profile_picture,
        work_phone,
        location
       FROM pulse_employees
       WHERE email_id = ?`,
      [email]
    );

    if (employees.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const employee = employees[0];

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(
      password,
      employee.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: employee.id,
        role: employee.office_role.toLowerCase()
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,

      user: {
        id: employee.id,
        employee_id: employee.employee_id,

        name: `${employee.firstname} ${employee.lastname}`,

        email: employee.email_id,

        role:
          employee.office_role.charAt(0).toUpperCase() +
          employee.office_role.slice(1),

        designation:
          employee.designation || employee.office_role,

        profile_picture: employee.profile_picture,

        phone: employee.work_phone,

        location: employee.location
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    return res.status(500).json({
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

    const [user] = await pool.execute(
      `SELECT password
      FROM pulse_employees
      WHERE id = ?`,
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
      `UPDATE pulse_employees
      SET password = ?
      WHERE id = ?`,
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