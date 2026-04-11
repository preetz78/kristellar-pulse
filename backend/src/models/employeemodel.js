// backend/src/models/employeemodel.js
import pool from '../config/db.js';

const createEmployeeTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(20) UNIQUE NOT NULL,           -- e.g., KA002, EMP001
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      number VARCHAR(15) NOT NULL,
      designation VARCHAR(100) NOT NULL,
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

// Initialize the table when this model is loaded
const initializeEmployeeTable = async () => {
  await createEmployeeTable();
};

initializeEmployeeTable();

export default {
  createEmployeeTable
};