// backend/src/models/employeemodel.js
import pool from '../config/db.js';

export const createEmployeeTables = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        designation VARCHAR(100),
        profile_picture VARCHAR(255),
        created_by_manager_id INT NULL,                    
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (created_by_manager_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log("Employees table created or already exists");
  } catch (error) {
    console.error("Error creating employees table:", error.message);
  }
};

export default { createEmployeeTables };