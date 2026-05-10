// backend/src/models/managerModel.js
import pool from '../config/db.js';

const createProjectsTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        department VARCHAR(150) NULL,
        manager_id INT DEFAULT NULL,
        project_manager_name VARCHAR(100) DEFAULT NULL,
        created_by INT NOT NULL,
        start_date DATE,
        deadline DATE NOT NULL,
        team_size INT DEFAULT 0,
        priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        
        FOREIGN KEY (manager_id) REFERENCES pulse_employees(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES pulse_employees(id) ON DELETE CASCADE
      )
    `);

    console.log("Projects table created or already exists");

  } catch (error) {
    console.error("❌ Error creating projects table:", error.message);
  }
};

const createProjectAssignmentsTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS project_assignments (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        employee_id INT NOT NULL,
        assigned_by INT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES pulse_employees(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES pulse_employees(id) ON DELETE SET NULL,
        UNIQUE KEY unique_project_employee (project_id, employee_id)
      )
    `);
    console.log("project_assignments table created or already exists");
  } catch (error) {
    console.error("❌ Error creating project_assignments table:", error.message);
  }
};

const createTasksTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date DATE,
        status ENUM('In Progress','Pending Review','Completed','Delayed') DEFAULT 'In Progress',
        completed_at TIMESTAMP NULL,
        reviewed_by INT NULL,
        reviewed_at TIMESTAMP NULL,
        progress INT DEFAULT 0,

        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES pulse_employees(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES pulse_employees(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES pulse_employees(id) ON DELETE SET NULL
      )
    `);

    console.log("Tasks table created or already exists");

  } catch (error) {
    console.error("❌ Error creating tasks table:", error.message);
  }
};

const initializeModels = async () => {
  await createProjectsTable();
  await createProjectAssignmentsTable();
  await createTasksTable();
};

export default {
  createProjectsTable,
  createProjectAssignmentsTable,
  createTasksTable,
  initializeModels
};