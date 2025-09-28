// server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";   // ✅ use the shared pool from db.js

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({
      message: "✅ Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Test DB route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Start server
app.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);
