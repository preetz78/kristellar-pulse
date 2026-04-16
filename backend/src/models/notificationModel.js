// backend/src/models/notificationModel.js
import pool from '../config/db.js';

export const createNotificationsTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_type VARCHAR(20) NOT NULL,        -- 'admin', 'manager', 'reviewer', 'employee'
        recipient_id INT NOT NULL,                  -- id from users table OR employees table
        message TEXT NOT NULL,
        type VARCHAR(50) NULL,                      -- e.g., 'task', 'project', 'deadline', 'feedback', 'review', 'assignment'
        priority VARCHAR(20) DEFAULT 'medium',      -- 'high', 'medium', 'low'
        status VARCHAR(20) DEFAULT 'unread',        -- 'unread', 'read'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(query);
    console.log('Notifications table created successfully');

    // Create index for better performance
    try {
      await pool.query(`
        CREATE INDEX idx_notifications_recipient 
        ON notifications (recipient_type, recipient_id, created_at DESC);
      `);
      console.log('✅ Index idx_notifications_recipient created');
    } catch (indexErr) {
      if (indexErr.code === 'ER_DUP_KEYNAME' || indexErr.errno === 1061) {
        console.log('✅ Index idx_notifications_recipient already exists');
      } else {
        console.warn('⚠️ Warning while creating index:', indexErr.message);
      }
    }

  } catch (error) {
    console.error('❌ Error creating notifications table:', error.message);
    throw error;
  }
};