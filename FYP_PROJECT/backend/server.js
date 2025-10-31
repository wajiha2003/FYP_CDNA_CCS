// server.js
import express from "express";
import cors from "cors";
import mkdirp from "mkdirp";
import path from "path";
import pool from "./db.js";

// Routes
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import retrieveRoutes from "./routes/retrieve.js";
const app = express();
app.use(cors());
app.use(express.json());

// ======================= Storage paths =======================
const FRAG_DIR = path.join(process.cwd(), "storage", "fragments");
const MANIFEST_DIR = path.join(process.cwd(), "storage", "manifests");
const COMPRESS_DIR = path.join(process.cwd(), "storage", "compressed");
const ENCRYPTED_DIR = path.join(process.cwd(), "storage", "encrypted");
mkdirp.sync(ENCRYPTED_DIR);
mkdirp.sync(FRAG_DIR);
mkdirp.sync(MANIFEST_DIR);
mkdirp.sync(COMPRESS_DIR);
// ======================= Serve static storage files =======================
app.use("/storage", express.static(path.join(process.cwd(), "storage")));

// ======================= Mount routes =======================
app.use("/api/auth", authRoutes);     // ✅ Now /api/auth/login will work
app.use("/api", uploadRoutes);         // /api/upload

app.use("/api", retrieveRoutes);   // ✅ Adds /api/retrieve/:fileHash


// ======================= Test DB Endpoint =======================
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// ======================= Start Server =======================
app.listen(5000, () => 
  console.log("🚀 Backend running")
);