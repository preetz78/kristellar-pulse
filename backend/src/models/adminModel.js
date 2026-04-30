// backend/src/models/adminModel.js
import pool from '../config/db.js';

const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) UNIQUE NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'manager', 'reviewer') NOT NULL,
      phone VARCHAR(20) NULL DEFAULT NULL,
      designation VARCHAR(100) NULL DEFAULT NULL,
      location VARCHAR(100) NULL DEFAULT NULL,
      bio TEXT NULL DEFAULT NULL,
      department_id INT NULL,
      profile_picture VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("Users table created or already exists");
  } catch (error) {
    console.error("❌ Error creating users table:", error.message);
  }
};

const createDepartmentsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS departments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT NULL,
      created_by INT NULL,                    -- Admin who created this department
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("Departments table created or already exists");
  } catch (error) {
    console.error("❌ Error creating departments table:", error.message);
  }
};

// Auto Seed Admin User
const seedAdminUser = async () => {
  try {
    const adminId = parseInt(process.env.ADMIN_ID) || 1;
    const adminName = process.env.ADMIN_NAME || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminRole = process.env.ADMIN_ROLE || "admin";

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ Admin credentials not found in .env. Skipping auto-seed.");
      return;
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', 
      [adminEmail]
    );

    if (existing.length > 0) {
      return; // already exists
    }

    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await pool.execute(
      `INSERT INTO users (id, user_id, name, email, password, role, department_id, profile_picture) 
       VALUES (?, NULL, ?, ?, ?, ?, NULL, NULL)`,
      [adminId, adminName, adminEmail, hashedPassword, adminRole]
    );

    console.log(`🎉 Admin user seeded successfully: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
  }
};

// Initialize Database
const initializeDatabase = async () => {
  await createUsersTable();
  await createDepartmentsTable();     
  setTimeout(seedAdminUser, 800);
};

export default {
  createUsersTable,
  createDepartmentsTable,
  seedAdminUser,
  initializeDatabase
};