// backend/src/models/employeemodel.js
import pool from '../config/db.js';

const createEmployeesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(50) UNIQUE NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('employee') NOT NULL DEFAULT 'employee',
      phone VARCHAR(20) NULL DEFAULT NULL,
      designation VARCHAR(100) NULL DEFAULT NULL,
      location VARCHAR(100) NULL DEFAULT NULL,
      bio TEXT NULL DEFAULT NULL,
      profile_picture VARCHAR(500) NULL,
      department_id INT NULL,
      created_by INT NULL,                    -- Who created this employee (admin or manager id)
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("Employees table created or already exists");
  } catch (error) {
    console.error("❌ Error creating employees table:", error.message);
  }
};

// Initialize function
const initializeEmployeeTable = async () => {
  await createEmployeesTable();
};

export default {
  createEmployeesTable,
  initializeEmployeeTable
};