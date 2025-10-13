import express from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import { chaoticDNADecrypt, generateChaoticKey, dnaDecode } from "../utils/dnaEncryption.js";
import { getSha512_256Algo } from "../utils/hashAlgo.js";

const router = express.Router();

router.get("/retrieve/:fileHash", async (req, res) => {
  try {
    const { fileHash } = req.params;

    // 1️⃣ Load manifest
    const manifestPath = path.join(process.cwd(), "storage", "manifests", `${fileHash}.json`);
    if (!fs.existsSync(manifestPath)) {
      return res.status(404).json({ error: "Manifest not found for given hash." });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const { filename, file_hash: originalFileHash } = manifest;
    console.log(`📋 Loaded manifest for: ${filename}`);
    console.log(`📝 Original file hash: ${originalFileHash}`);

    // 2️⃣ Load encryption metadata (CRITICAL - contains x0 and r parameters)
    const encryptionMetadataPath = path.join(
      process.cwd(),
      "storage",
      "encrypted",
      `${filename}.meta.json`
    );

    if (!fs.existsSync(encryptionMetadataPath)) {
      return res.status(404).json({
        error: "Encryption metadata not found. Cannot retrieve x0 and r parameters for decryption."
      });
    }

    const encryptionMetadata = JSON.parse(
      fs.readFileSync(encryptionMetadataPath, "utf8")
    );
    const { x0, r } = encryptionMetadata.chaotic_parameters;

    console.log(`🔐 Loaded encryption metadata:`);
    console.log(`   x0 = ${x0}`);
    console.log(`   r = ${r}`);

    // 3️⃣ Locate and read encrypted DNA file
    const encryptedFilePath = path.join(
      process.cwd(),
      "storage",
      "encrypted",
      `${filename}.dna`
    );

    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ error: "Encrypted DNA file not found." });
    }

    console.log("🔒 Reading encrypted DNA...");
    const encryptedDNA = fs.readFileSync(encryptedFilePath, "utf8");
    console.log(`   Length: ${encryptedDNA.length} characters`);
    console.log(`   First 100 chars: ${encryptedDNA.substring(0, 100)}`);

    // 4️⃣ Validate encrypted DNA format
    const validBases = /^[ATCG]+$/.test(encryptedDNA);
    if (!validBases) {
      return res.status(500).json({
        error: "Invalid encrypted DNA format - contains non-DNA characters"
      });
    }

    // 5️⃣ Regenerate chaotic key using stored parameters
    console.log("🔓 Regenerating chaotic key...");
    const chaoticKey = generateChaoticKey(encryptedDNA.length, x0, r);
    console.log(`   Key length: ${chaoticKey.length}`);
    console.log(`   First 20 key values: ${chaoticKey.slice(0, 20).join(",")}`);

    // 6️⃣ Decrypt DNA sequence
    console.log("🔐 Decrypting DNA sequence...");
    let decryptedDNA;
    try {
      decryptedDNA = chaoticDNADecrypt(encryptedDNA, chaoticKey);
      console.log(`   Decrypted length: ${decryptedDNA.length}`);
      console.log(`   First 100 bases: ${decryptedDNA.substring(0, 100)}`);
    } catch (err) {
      console.error("❌ Decryption failed:", err.message);
      return res.status(500).json({
        error: "DNA decryption failed",
        details: err.message
      });
    }

    // 7️⃣ Verify decrypted DNA matches original distribution (sanity check)
    const calculateDist = (dna) => {
      const dist = { A: 0, T: 0, C: 0, G: 0 };
      for (let base of dna) {
        if (dist[base] !== undefined) dist[base]++;
      }
      return dist;
    };

    const decryptedDist = calculateDist(decryptedDNA);
    const originalDist = encryptionMetadata.original_dna_distribution;

    console.log("📊 DNA Distribution Check:");
    console.log(`   Original: ${JSON.stringify(originalDist)}`);
    console.log(`   Decrypted: ${JSON.stringify(decryptedDist)}`);

    if (JSON.stringify(decryptedDist) !== JSON.stringify(originalDist)) {
      console.warn("⚠️ WARNING: Decrypted DNA distribution differs from original!");
      console.warn("   This may indicate an error in decryption or key mismatch.");
    }

    // 8️⃣ Convert decrypted DNA → binary buffer
    console.log("🔁 Converting DNA → Binary...");
    let binaryData;
    try {
      binaryData = dnaDecode(decryptedDNA);
      console.log(`   Binary length: ${binaryData.length} bytes`);
      console.log(`   First 20 bytes (hex): ${binaryData.slice(0, 20).toString("hex")}`);
    } catch (err) {
      console.error("❌ DNA decoding failed:", err.message);
      return res.status(500).json({
        error: "DNA decoding failed",
        details: err.message
      });
    }

    // 9️⃣ Decompress data
    console.log("💨 Decompressing data...");
    let decompressedBuffer;

    try {
      // createDeflate() uses zlib format (with header), so use inflateSync()
      decompressedBuffer = zlib.inflateSync(binaryData);
      console.log(`✅ Decompression successful (zlib format)`);
      console.log(`   Decompressed size: ${decompressedBuffer.length} bytes`);
    } catch (err) {
      console.error("❌ zlib decompression failed:", err.message);

      // Fallback: Try raw deflate format
      console.log("   Trying raw deflate format...");
      try {
        decompressedBuffer = zlib.inflateRawSync(binaryData);
        console.log(`✅ Decompression successful (raw deflate format)`);
        console.log(`   Decompressed size: ${decompressedBuffer.length} bytes`);
      } catch (err2) {
        console.error("❌ Raw deflate also failed:", err2.message);

        // Final check: data might already be uncompressed
        console.log("⚠️ Both decompression methods failed.");
        console.log(`   DNA length: ${encryptedDNA.length}`);
        console.log(`   Binary length: ${binaryData.length}`);

        return res.status(500).json({
          error: "Decompression failed. Possible encoding/decoding mismatch.",
          details: {
            dna_length: encryptedDNA.length,
            binary_length: binaryData.length,
            first_bytes_hex: binaryData.slice(0, 20).toString("hex"),
            error_message: err.message
          }
        });
      }
    }

    // 🔟 Write decrypted file with "decrypted_" prefix
    console.log("🧩 Writing decrypted file...");
    const outputDir = path.join(process.cwd(), "storage", "decrypted");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const decryptedFilename = `decrypted_${filename}`;
    const outputPath = path.join(outputDir, decryptedFilename);
    fs.writeFileSync(outputPath, decompressedBuffer);
    console.log(`✅ File written: ${outputPath}`);
    console.log(`   Size: ${decompressedBuffer.length} bytes`);

    // 1️⃣1️⃣ Verify against ORIGINAL FILE HASH (before compression)
    // CRITICAL FIX: Use the SAME hash algorithm as upload (sha512/256)
    const algo = getSha512_256Algo();
    const recoveredHash = crypto
      .createHash(algo)
      .update(decompressedBuffer)
      .digest("hex");

    console.log("🔍 Integrity verification:");
    console.log(`   Hash algorithm: ${algo}`);
    console.log(`   Original file hash (from manifest): ${originalFileHash}`);
    console.log(`   Recovered file hash (after decrypt): ${recoveredHash}`);

    if (recoveredHash === originalFileHash) {
      console.log("✅ HASH MATCH - File successfully recovered with 100% integrity!");
    } else {
      console.warn("⚠️ WARNING: Hash mismatch detected!");
      console.warn("   File may be corrupted or decryption keys were incorrect.");
      console.warn("   However, the file has been decrypted and decompressed successfully.");
      console.warn("   You should manually verify the file content.");
    }

    // 1️⃣2️⃣ Deliver file to user
    console.log("📦 Sending file to client...");
    res.download(outputPath, decryptedFilename, (err) => {
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
      message: err.message
    });
  }
});

export default router;