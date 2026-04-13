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

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Test DB
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1");
    res.send("MySQL Connected ✅");
  } catch (error) {
    console.error(error);
    res.status(500).send("DB Connection Failed ❌");
  }
});

app.get("/", (req, res) => res.send("Backend is running 🚀"));
app.get("/api/test", (req, res) => res.json({ message: "API working fine" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/reviewer", reviewerRoutes);
app.use('/api/employee', employeeRoutes);

// ====================== PROPER TABLE INITIALIZATION ======================
const initDatabase = async () => {
  try {
    console.log("🔄 Starting database table initialization...");

    // 1. Employees Table (Parent)
    const employeeModule = await import("./src/models/employeemodel.js");
    const employeeModel = employeeModule.default ?? employeeModule;
    await employeeModel.createEmployeeTables?.();

    // 2. Users Table + Admin Seeding
    const adminModule = await import("./src/models/adminModel.js");
    const adminModel = adminModule.default ?? adminModule;
    await adminModel.createUsersTable?.();

    // 3. Manager Tables
    const managerModule = await import("./src/models/managerModel.js");
    const managerModel = managerModule.default ?? managerModule;
    await managerModel.createProjectsTable?.();
    await managerModel.createProjectAssignmentsTable?.();
    await managerModel.createTasksTable?.();

    // 4. Reviewer Tables (Comments)
    const reviewerModule = await import("./src/models/reviewerModel.js");
    const reviewerModel = reviewerModule.default ?? reviewerModule;
    await reviewerModel.createReviewerTables?.();

    // Final Success Message
    console.log("✅ All database tables initialized successfully");

  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
};

// Run initialization
initDatabase();

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});