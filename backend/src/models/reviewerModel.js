// backend/src/models/reviewerModel.js
import pool from '../config/db.js';

export const createReviewerTables = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        reviewer_name VARCHAR(255) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Comments table created or already exists");
  } catch (error) {
    console.error("Error creating comments table:", error.message);
  }
};

const initializeReviewerTables = async () => {
  await createReviewerTables();
};

// initializeReviewerTables();

export default {
  createReviewerTables
};

