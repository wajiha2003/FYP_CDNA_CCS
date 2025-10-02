// server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";
import sgMail from "@sendgrid/mail";
import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import crypto from "crypto";
import Busboy from "busboy";
import zlib from "zlib";   // ✅ Added

const app = express();
app.use(cors());
app.use(express.json());

// ======================= 🔹 Login API 🔹 =======================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    res.json({ message: "✅ Login successful", user: { id: user.id, email: user.email } });
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
const otpStore = {};
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  const msg = {
    to: email,
    from: "verified_sender@example.com",
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

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] === otp) {
    delete otpStore[email];
    return res.json({ success: true, message: "✅ OTP verified" });
  }
  res.json({ success: false, message: "❌ Invalid OTP" });
});

// ======================= 🔹 Storage paths 🔹 =======================
const FRAG_DIR = path.join(process.cwd(), "storage", "fragments");
const MANIFEST_DIR = path.join(process.cwd(), "storage", "manifests");
const COMPRESS_DIR = path.join(process.cwd(), "storage", "compressed"); // ✅ New
mkdirp.sync(FRAG_DIR);
mkdirp.sync(MANIFEST_DIR);
mkdirp.sync(COMPRESS_DIR);

// Pick correct SHA-512/256 algorithm name
function getSha512_256Algo() {
  const hashes = crypto.getHashes().map((h) => h.toLowerCase());
  if (hashes.includes("sha512-256")) return "sha512-256";
  if (hashes.includes("sha512256")) return "sha512256";
  throw new Error("sha512/256 not supported in this Node build.");
}

// ======================= 🔹 Upload Route with Deflate 🔹 =======================
app.post("/upload", (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  busboy.on("file", (fieldname, file, info) => {
    (async () => {
      const filename = info.filename;
      const algo = getSha512_256Algo();
      const fileHash = crypto.createHash(algo);
      const CHUNK_SIZE = 512 * 1024; // 512 KB
      let buffer = Buffer.alloc(0);
      let offset = 0;
      const fragments = [];

      // Process chunks
      for await (const data of file) {
        fileHash.update(data);
        buffer = Buffer.concat([buffer, data]);

        while (buffer.length >= CHUNK_SIZE) {
          const chunk = buffer.slice(0, CHUNK_SIZE);
          buffer = buffer.slice(CHUNK_SIZE);

          const chunkHash = crypto.createHash(algo).update(chunk).digest("hex");
          const fragPath = path.join(FRAG_DIR, chunkHash);
          if (!fs.existsSync(fragPath)) await fs.promises.writeFile(fragPath, chunk);

          fragments.push({ index: fragments.length, offset, size: chunk.length, chunk_hash: chunkHash });
          offset += chunk.length;
        }
      }

      // leftover
      if (buffer.length > 0) {
        const chunkHash = crypto.createHash(algo).update(buffer).digest("hex");
        const fragPath = path.join(FRAG_DIR, chunkHash);
        if (!fs.existsSync(fragPath)) await fs.promises.writeFile(fragPath, buffer);

        fragments.push({ index: fragments.length, offset, size: buffer.length, chunk_hash: chunkHash });
        offset += buffer.length;
      }

      // Final file hash
      const finalFileHash = fileHash.digest("hex");

      // Save manifest
      const manifest = {
        filename,
        file_size: offset,
        file_hash: finalFileHash,
        chunk_size_bytes: CHUNK_SIZE,
        fragments,
        created_at: new Date().toISOString(),
      };
      const manifestPath = path.join(MANIFEST_DIR, finalFileHash + ".json");
      await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // ✅ Deflate Compression
      const originalFilePath = path.join(COMPRESS_DIR, filename);
      const compressedPath = originalFilePath + ".deflate";

      // reconstruct original file from fragments
      const writeStream = fs.createWriteStream(originalFilePath);
      for (const frag of fragments) {
        const fragPath = path.join(FRAG_DIR, frag.chunk_hash);
        const chunk = await fs.promises.readFile(fragPath);
        writeStream.write(chunk);
      }
      writeStream.end();

      writeStream.on("finish", () => {
        const inp = fs.createReadStream(originalFilePath);
        const out = fs.createWriteStream(compressedPath);
        const deflate = zlib.createDeflate();

        inp.pipe(deflate).pipe(out).on("finish", async () => {
          const originalSize = manifest.file_size;
          const compressedSize = (await fs.promises.stat(compressedPath)).size;
          const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

          res.json({
            ok: true,
            file_hash: finalFileHash,
            manifest_path: manifestPath,
            fragments: manifest.fragments,
            chunk_size_bytes: manifest.chunk_size_bytes,
            created_at: manifest.created_at,
            compression: {
              original_size: originalSize,
              compressed_size: compressedSize,
              ratio: ratio,
              compressed_path: compressedPath,
            },
          });
        });
      });
    })().catch((err) => {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message });
    });
  });

  req.pipe(busboy);
});

// ======================= 🔹 Start Server 🔹 =======================
app.listen(5000, () => console.log("🚀 Backend running on http://localhost:5000"));
