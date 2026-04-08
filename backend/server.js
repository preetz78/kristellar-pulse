import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

const app = express();

// Load environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Test DB connection ONLY
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

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});