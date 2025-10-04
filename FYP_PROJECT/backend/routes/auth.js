// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = express.Router();

// 🔹 LOGIN route - Verify credentials only
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "❌ Email and password are required" });
    }

    // Check if user exists
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "❌ User not found" });
    }

    const user = result.rows[0];

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "❌ Invalid password" });
    }

    // ✅ Credentials are valid
    console.log(`✅ User ${email} authenticated successfully`);
    res.json({ 
      success: true, 
      message: "Credentials verified", 
      email: user.email,
      userId: user.id // Optional: return user ID if needed
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "⚠️ Server error" });
  }
});

// 🔹 RESEND OTP route - Verify user exists before frontend sends new OTP
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    // Validate input
    if (!email) {
      return res.status(400).json({ error: "❌ Email is required" });
    }

    // Verify user exists
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "❌ User not found" });
    }

    // ✅ User exists, frontend can send new OTP
    console.log(`✅ Resend OTP authorized for ${email}`);
    res.json({ 
      success: true, 
      message: "Ready to send new OTP",
      email: email
    });
  } catch (err) {
    console.error("❌ Resend OTP Error:", err);
    res.status(500).json({ error: "⚠️ Server error" });
  }
});

// 🔹 OPTIONAL: Verify OTP route (if you want backend verification in the future)
// Currently OTP verification is done on frontend, but you can use this for extra security
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ Email and OTP are required" 
      });
    }

    // Here you would verify the OTP
    // Since OTP is currently handled on frontend, this is just a placeholder
    // You could store OTPs in database or Redis for backend verification

    console.log(`✅ OTP verification attempted for ${email}`);
    res.json({ 
      success: true, 
      message: "✅ OTP verified successfully" 
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err);
    res.status(500).json({ 
      success: false, 
      error: "⚠️ Server error" 
    });
  }
});

// 🔹 SIGNUP route (Optional - if you want users to register)
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "❌ Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "❌ User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name",
      [email, hashedPassword, name || null]
    );

    console.log(`✅ New user registered: ${email}`);
    res.status(201).json({ 
      success: true, 
      message: "✅ User registered successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "⚠️ Server error" });
  }
});

// 🔹 GET USER route (Optional - fetch user details)
router.get("/user/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, email, name, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "❌ User not found" });
    }

    res.json({ 
      success: true, 
      user: result.rows[0] 
    });
  } catch (err) {
    console.error("❌ Get User Error:", err);
    res.status(500).json({ error: "⚠️ Server error" });
  }
});

// 🔹 TEST route - Check if auth routes are working
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "✅ Auth routes are working!",
    timestamp: new Date().toISOString()
  });
});

export default router;