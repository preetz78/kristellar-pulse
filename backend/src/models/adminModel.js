// backend/src/models/adminModel.js
import pool from '../config/db.js';

const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'manager', 'reviewer') NOT NULL,
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

    // Check if admin already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', 
      [adminEmail]
    );

    if (existing.length > 0) {
      // Silent - no log when already exists (as you wanted)
      return;
    }

    // Hash password
    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Insert admin user
    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, profile_picture) 
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [adminId, adminName, adminEmail, hashedPassword, adminRole]
    );

    console.log(`🎉 Admin user seeded successfully: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
  }
};

// Run table creation first, then seed (with small delay for safety)
const initializeDatabase = async () => {
  await createUsersTable();
  setTimeout(seedAdminUser, 800);   // Small delay
};


export default {
  createUsersTable,
  seedAdminUser
};