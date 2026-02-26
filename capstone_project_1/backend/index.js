import "dotenv/config";  
import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * POST /students
 * Add a new student
 */
app.post("/api/students", async (req, res) => {
  const { name, email, age } = req.body;

  if (!name || !email || !age) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO students (name, email, age) VALUES ($1, $2, $3) RETURNING id",
      [name, email, age]
    );

    res.status(201).json({
      message: "Student added successfully",
      studentId: result.rows[0].id,
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /students
 * Fetch all students
 */
app.get("/api/students", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM students ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});