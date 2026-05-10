// backend/src/models/employeemodel.js
import pool from '../config/db.js';

const createPulseEmployeesTable = async () => {

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS pulse_employees (

      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      firstname VARCHAR(255) NOT NULL,
      lastname VARCHAR(255) NOT NULL,
      email_id VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NULL,
      office_role VARCHAR(150) NULL,
      work_phone VARCHAR(20) NULL,
      designation VARCHAR(150) NULL,
      department VARCHAR(150) NULL,
      profile_picture TEXT NULL,
      location VARCHAR(150) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP

    );
  `;

  try {

    await pool.execute(createTableQuery);

    console.log(
      "✅ pulse_employees table created or already exists"
    );

    // ALTER TABLE
    try {

      await pool.execute(`
        ALTER TABLE pulse_employees
        ADD COLUMN bio TEXT NULL
      `);

      console.log("Bio column added");

    } catch (error) {

      if (
        error.message.includes("Duplicate column")
      ) {

        console.log(
          "bio column already exists"
        );

      } else {

        console.error(
          "❌ Error adding bio column:",
          error.message
        );
      }
    }

  } catch (error) {

    console.error(
      "❌ Error creating pulse_employees table:",
      error.message
    );
  }
};

// Initialize function
const initializeEmployeeTable = async () => {
  // await createEmployeesTable();
  await createPulseEmployeesTable();
};

export default {
  // createEmployeesTable,
  initializeEmployeeTable
};