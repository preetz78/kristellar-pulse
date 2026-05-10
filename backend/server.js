// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import pool from "./src/config/db.js";

// Routes
import adminRoutes from "./src/routes/adminRoutes.js";  
import authRoutes from "./src/routes/authRoutes.js";  
import managerRoutes from "./src/routes/managerRoutes.js";
import reviewerRoutes from "./src/routes/reviewerRoutes.js";  
import employeeRoutes from './src/routes/employeeRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Test Routes
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1");
    res.send("MySQL Connected ✅");
  } catch (error) {
    res.status(500).send("DB Connection Failed ❌");
  }
});

app.get("/", (req, res) => res.send("Backend is running 🚀"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/reviewer", reviewerRoutes);
app.use("/api/employees", employeeRoutes);

// ====================== DATABASE INITIALIZATION ======================
const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database tables...");

    // 2. Employees Table
    const employeeModule = await import("./src/models/employeemodel.js");
    const employeeModel = employeeModule.default;
    await employeeModel.initializeEmployeeTable();

    const notificationModule = await import("./src/models/notificationModel.js");
    await notificationModule.createNotificationsTable();

    const managerModule = await import("./src/models/managerModel.js");
    const managerModel = managerModule.default;
    await managerModel.initializeModels();

    const reviewerModule = await import("./src/models/reviewerModel.js");
    await reviewerModule.createReviewerTables();

    console.log("✅ All database tables initialized successfully");

  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
};

initDatabase();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT} (accessible from your LAN)`);
});