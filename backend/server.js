import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./src/config/db.js";

import "./src/models/adminModel.js"; 
import "./src/models/managerModel.js";
import "./src/models/employeemodel.js";

import adminRoutes from "./src/routes/adminRoutes.js";  
import authRoutes from "./src/routes/authRoutes.js";  
import managerRoutes from "./src/routes/managerRoutes.js";  

import path from "path";  

const app = express();

// Load environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// SERVE UPLOADS 
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Test DB connection
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1");
    res.send("MySQL Connected ✅");
  } catch (error) {
    console.error(error);
    res.status(500).send("DB Connection Failed ❌");
  }
});

// Basic Routes
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API working fine" });
});

//  ROUTES 

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);    

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});