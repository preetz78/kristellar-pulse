// backend/src/controllers/adminController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get all users (for Team Management page)
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, role, profile_picture, created_at 
       FROM users 
       ORDER BY id ASC`
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Create new user (with profile picture support) - FIXED
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const profilePicPath = req.file ? `/uploads/profile_pics/${req.file.filename}` : null;

  // Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email, password and role are required" 
    });
  }

  try {
    // Check if email already exists
    const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, role, profile_picture) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role.toLowerCase(), profilePicPath]   // Store role in lowercase
    );

    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create user. Please check server logs." 
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Update user (name, email, role, password, profile picture)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  const profilePicPath = req.file ? `/uploads/profile_pics/${req.file.filename}` : null;

  if (!name || !email || !role) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email and role are required" 
    });
  }

  try {
    // Check if email already exists for another user
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?', 
      [email, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Build dynamic update query
    let query = `
      UPDATE users 
      SET name = ?, email = ?, role = ?
    `;
    const params = [name, email, role.toLowerCase()];

    // If password is provided, hash and update it
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += `, password = ?`;
      params.push(hashedPassword);
    }

    // If new profile picture is uploaded, update it
    if (profilePicPath) {
      query += `, profile_picture = ?`;
      params.push(profilePicPath);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      message: "User updated successfully" 
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update user. Please check server logs." 
    });
  }
};