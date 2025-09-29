// server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";   // ✅ use the shared pool from db.js
import sgMail from "@sendgrid/mail"; // ✅ add SendGrid

const app = express();
app.use(cors());
app.use(express.json());

// ======================= 🔹 OTP SETUP 🔹 =======================
sgMail.setApiKey("YOUR_SENDGRID_API_KEY"); // 🔴 replace

// Temporary in-memory OTP store (for demo; for production, store in DB with expiry)
let otpStore = {};

// ======================= 🔹 Login API 🔹 =======================
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

// ======================= 🔹 Test DB route 🔹 =======================
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// ======================= 🔹 OTP ROUTES 🔹 =======================

// Send OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = otp; // store OTP in memory

  const msg = {
    to: email,                       // recipient email
    from: "verified_sender@example.com", // 🔴 must be a verified sender in SendGrid
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  try {
    await sgMail.send(msg);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email]; // clear OTP after success
    return res.json({ success: true, message: "✅ OTP verified" });
  }

  res.json({ success: false, message: "❌ Invalid OTP" });
});

// ======================= 🔹 Start Server 🔹 =======================
app.listen(5000, () =>
  console.log("🚀 Backend running on http://localhost:5000")
);
