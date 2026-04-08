// backend/config/db.js
import mysql from "mysql2/promise";
import "dotenv/config";

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Handle unexpected errors
pool.on("error", (err) => {
  console.error("Unexpected MySQL error:", err);
  process.exit(1);
});

// Test connection on startup (same style as your PG file)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully! ✅");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

export default pool;