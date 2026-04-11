// backend/src/models/managerModel.js
import pool from '../config/db.js';

const createProjectsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS projects (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      manager_id INT NOT NULL,
      project_manager_name VARCHAR(100) NOT NULL,
      deadline DATE NOT NULL,
      team_size INT DEFAULT 0,
      priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',   
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("Projects table created or already exists");
  } catch (error) {
    console.error("❌ Error creating projects table:", error.message);
  }
};

const createProjectAssignmentsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS project_assignments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      employee_id INT NOT NULL,
      assigned_by INT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
      
      UNIQUE KEY unique_project_employee (project_id, employee_id)
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("project_assignments table created or already exists");
  } catch (error) {
    console.error("❌ Error creating project_assignments table:", error.message);
  }
};

// UPDATED: Tasks table with status column
const createTasksTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to INT NOT NULL,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      status ENUM('In Progress', 'Completed', 'Delayed') DEFAULT 'In Progress',
      
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE CASCADE
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("Tasks table created or already exists with status column");
  } catch (error) {
    console.error("❌ Error creating tasks table:", error.message);
  }
};

// Initialize all tables
const initializeModels = async () => {
  await createProjectsTable();
  await createProjectAssignmentsTable();
  await createTasksTable();   
  console.log("All manager-related tables initialized successfully");
};

initializeModels();

export default {
  createProjectsTable,
  createProjectAssignmentsTable,
  createTasksTable
};