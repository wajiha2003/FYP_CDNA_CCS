import express from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import {
  chaoticDNADecrypt,
  generateChaoticKey,
  dnaDecode,
} from "../utils/dnaEncryption.js";
import { getSha512_256Algo } from "../utils/hashAlgo.js";

const router = express.Router();

const DECRYPTED_DIR = path.join(process.cwd(), "storage", "decrypted");

// Ensure decrypted directory exists
const ensureDecryptedDir = () => {
  if (!fs.existsSync(DECRYPTED_DIR)) {
    fs.mkdirSync(DECRYPTED_DIR, { recursive: true });
  }
};

router.get("/retrieve/:fileHash", async (req, res) => {
  try {
    const { fileHash } = req.params;

    // 1️⃣ Load manifest
    const manifestPath = path.join(
      process.cwd(),
      "storage",
      "manifests",
      `${fileHash}.json`
    );

    if (!fs.existsSync(manifestPath)) {
      res.status(404).json({ error: "Manifest not found for given hash." });
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const { filename, file_hash: originalFileHash } = manifest;

    console.log(`📋 Loaded manifest for: ${filename}`);
    console.log(`📝 Original file hash: ${originalFileHash}`);

    // 2️⃣ Load encryption metadata
    const encryptionMetadataPath = path.join(
      process.cwd(),
      "storage",
      "encrypted",
      `${filename}.meta.json`
    );

    if (!fs.existsSync(encryptionMetadataPath)) {
      res.status(404).json({
        error:
          "Encryption metadata not found. Cannot retrieve x0 and r parameters for decryption.",
      });
      return;
    }

    const encryptionMetadata = JSON.parse(
      fs.readFileSync(encryptionMetadataPath, "utf8")
    );
    const { x0, r } = encryptionMetadata.chaotic_parameters;

    console.log(`🔐 Loaded encryption metadata: x0=${x0}, r=${r}`);

    // 3️⃣ Load encrypted DNA file
    const encryptedFilePath = path.join(
      process.cwd(),
      "storage",
      "encrypted",
      `${filename}.dna`
    );

    if (!fs.existsSync(encryptedFilePath)) {
      res.status(404).json({ error: "Encrypted DNA file not found." });
      return;
    }

    const encryptedDNA = fs.readFileSync(encryptedFilePath, "utf8");

    console.log(`🔒 Encrypted DNA length: ${encryptedDNA.length}`);

    // 4️⃣ Validate format
    const validBases = /^[ATCG]+$/.test(encryptedDNA);
    if (!validBases) {
      res
        .status(500)
        .json({ error: "Invalid encrypted DNA format - contains non-DNA characters" });
      return;
    }

    // 5️⃣ Regenerate chaotic key
    console.log("🔓 Regenerating chaotic key...");
    const chaoticKey = generateChaoticKey(encryptedDNA.length, x0, r);

    // 6️⃣ Decrypt DNA
    let decryptedDNA;
    try {
      decryptedDNA = chaoticDNADecrypt(encryptedDNA, chaoticKey);
    } catch (err) {
      console.error("❌ Decryption failed:", err.message);
      res.status(500).json({ error: "DNA decryption failed", details: err.message });
      return;
    }

    // 7️⃣ Convert decrypted DNA → binary
    let binaryData;
    try {
      binaryData = dnaDecode(decryptedDNA);
    } catch (err) {
      console.error("❌ DNA decoding failed:", err.message);
      res.status(500).json({ error: "DNA decoding failed", details: err.message });
      return;
    }

    // 8️⃣ Decompress
    let decompressedBuffer;
    try {
      decompressedBuffer = zlib.inflateSync(binaryData);
      console.log("✅ Decompression (zlib) succeeded.");
    } catch (err) {
      console.warn("❌ zlib inflate failed:", err.message);
      console.log("   Trying raw deflate format...");

      try {
        decompressedBuffer = zlib.inflateRawSync(binaryData);
        console.log("✅ Decompression (raw deflate) succeeded.");
      } catch (err2) {
        console.error("❌ Both decompression methods failed:", err2.message);
        res.status(500).json({
          error: "Decompression failed.",
          details: err2.message,
        });
        return;
      }
    }

    // 9️⃣ Write decrypted file
    ensureDecryptedDir();

    const decryptedFilename = `decrypted_${filename}`;
    const outputPath = path.join(DECRYPTED_DIR, decryptedFilename);

    fs.writeFileSync(outputPath, decompressedBuffer);

    console.log(`✅ Decrypted file saved at: ${outputPath}`);

    // 🔟 Verify hash integrity
    const algo = getSha512_256Algo();
    const recoveredHash = crypto
      .createHash(algo)
      .update(decompressedBuffer)
      .digest("hex");

    console.log("🔍 Integrity check:");
    console.log(`   Original:  ${originalFileHash}`);
    console.log(`   Recovered: ${recoveredHash}`);

    if (recoveredHash === originalFileHash) {
      console.log("✅ HASH MATCH - File recovered successfully!");
    } else {
      console.warn("⚠️ HASH MISMATCH - File may be corrupted or keys incorrect.");
    }

    // 1️⃣1️⃣ Send file to client
    if (!fs.existsSync(outputPath)) {
      res.status(500).json({ error: "Decrypted file missing before download." });
      return;
    }

    // ✅ Safer for both browsers & API clients
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${decryptedFilename}"`
    );
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error("❌ Error delivering file:", err);
      } else {
        console.log(`✅ File delivered successfully: ${decryptedFilename}`);
      }
    });
  } catch (err) {
    console.error("🔥 Unexpected error during retrieval:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

export default router;
