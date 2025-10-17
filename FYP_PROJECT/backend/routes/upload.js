import express from "express";
import Busboy from "busboy";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { getSha512_256Algo } from "../utils/hashAlgo.js";
import { dnaEncode, dnaDecode, generateChaoticKey, chaoticDNAEncrypt, chaoticDNADecrypt } from "../utils/dnaEncryption.js";

const router = express.Router();

const FRAG_DIR = path.join(process.cwd(), "storage", "fragments");
const MANIFEST_DIR = path.join(process.cwd(), "storage", "manifests");
const COMPRESS_DIR = path.join(process.cwd(), "storage", "compressed");
const ENCRYPTED_DIR = path.join(process.cwd(), "storage", "encrypted");
const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");

// Ensure all required directories exist
const ensureDirs = async () => {
  for (const dir of [FRAG_DIR, MANIFEST_DIR, COMPRESS_DIR, ENCRYPTED_DIR, UPLOADS_DIR]) {
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
};

// Calculate base distribution
const calculateBaseDistribution = (dna) => {
  const dist = { A: 0, T: 0, C: 0, G: 0 };
  for (let base of dna) {
    if (dist[base] !== undefined) dist[base]++;
  }
  return dist;
};

// Validate DNA sequence
const validateDNA = (dna) => {
  for (let base of dna) {
    if (!['A', 'T', 'C', 'G'].includes(base)) {
      throw new Error(`Invalid DNA base detected: ${base}`);
    }
  }
  return true;
};

router.post("/upload", (req, res) => {
  console.log("📤 Upload endpoint hit!");
  const busboy = Busboy({ headers: req.headers });

  busboy.on("file", (fieldname, file, info) => {
    (async () => {
      await ensureDirs();
      
      const filename = info.filename;
      const algo = getSha512_256Algo();
      const fileHash = crypto.createHash(algo);
      const CHUNK_SIZE = 512 * 1024;
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
          if (!fs.existsSync(fragPath)) {
            await fs.promises.writeFile(fragPath, chunk);
          }

          fragments.push({
            index: fragments.length,
            offset,
            size: chunk.length,
            chunk_hash: chunkHash
          });
          offset += chunk.length;
        }
      }

      // Handle leftover data
      if (buffer.length > 0) {
        const chunkHash = crypto.createHash(algo).update(buffer).digest("hex");
        const fragPath = path.join(FRAG_DIR, chunkHash);
        if (!fs.existsSync(fragPath)) {
          await fs.promises.writeFile(fragPath, buffer);
        }

        fragments.push({
          index: fragments.length,
          offset,
          size: buffer.length,
          chunk_hash: chunkHash
        });
        offset += buffer.length;
      }

      const finalFileHash = fileHash.digest("hex");

      // Save original uploaded file to uploads folder
      const uploadedFilePath = path.join(UPLOADS_DIR, filename);
      const uploadedFileWriteStream = fs.createWriteStream(uploadedFilePath);
      for (const frag of fragments) {
        const fragPath = path.join(FRAG_DIR, frag.chunk_hash);
        const chunk = await fs.promises.readFile(fragPath);
        uploadedFileWriteStream.write(chunk);
      }
      uploadedFileWriteStream.end();
      
      await new Promise((resolve, reject) => {
        uploadedFileWriteStream.on("finish", resolve);
        uploadedFileWriteStream.on("error", reject);
      });
      console.log(`✅ Original file saved to: ${uploadedFilePath}`);

      // Create manifest
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

      // Reconstruct file
      const originalFilePath = path.join(COMPRESS_DIR, filename);
      const compressedPath = originalFilePath + ".deflate";

      const writeStream = fs.createWriteStream(originalFilePath);
      for (const frag of fragments) {
        const fragPath = path.join(FRAG_DIR, frag.chunk_hash);
        const chunk = await fs.promises.readFile(fragPath);
        writeStream.write(chunk);
      }

      writeStream.end();

      writeStream.on("finish", async () => {
        try {
          const inp = fs.createReadStream(originalFilePath);
          const out = fs.createWriteStream(compressedPath);
          const deflate = zlib.createDeflate();

          inp.pipe(deflate).pipe(out).on("finish", async () => {
            try {
              const originalSize = manifest.file_size;
              const compressedSize = (await fs.promises.stat(compressedPath)).size;
              const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

              // === 🧬 CHAOTIC-DNA HYBRID ENCRYPTION ===
              const startEncrypt = Date.now();

              // Read compressed data
              const compressedData = await fs.promises.readFile(compressedPath);

              // Step 1: DNA Encoding
              const dnaSequence = dnaEncode(compressedData);
              validateDNA(dnaSequence);

              // Step 2: Generate Chaotic Key
              const x0 = Math.random();
              const r = 3.99;
              const chaoticKey = generateChaoticKey(dnaSequence.length, x0, r);

              // Step 3: Encrypt DNA sequence
              const encryptedDNA = chaoticDNAEncrypt(dnaSequence, chaoticKey);
              validateDNA(encryptedDNA);

              const encryptTime = Date.now() - startEncrypt;

              // Save encrypted DNA
              const encryptedPath = path.join(ENCRYPTED_DIR, `${filename}.dna`);
              await fs.promises.writeFile(encryptedPath, encryptedDNA, "utf8");

              // Store encryption metadata (CRITICAL for decryption)
              const encryptionMetadataPath = path.join(ENCRYPTED_DIR, `${filename}.meta.json`);
              const encryptionMetadata = {
                filename,
                file_hash: finalFileHash,
                compressed_hash: crypto.createHash(algo).update(compressedData).digest("hex"),
                dna_sequence_length: dnaSequence.length,
                original_dna_distribution: calculateBaseDistribution(dnaSequence),
                encrypted_dna_distribution: calculateBaseDistribution(encryptedDNA),
                chaotic_parameters: {
                  x0,
                  r,
                  iterations: dnaSequence.length,
                },
                created_at: new Date().toISOString(),
                compressed_original_size: compressedSize,
              };
              await fs.promises.writeFile(encryptionMetadataPath, JSON.stringify(encryptionMetadata, null, 2));

              const encryptedSize = Buffer.byteLength(encryptedDNA, 'utf8');

              // === Return all results ===
              res.json({
                ok: true,
                file_hash: finalFileHash,
                uploaded_path: uploadedFilePath,
                manifest_path: manifestPath,
                fragments: manifest.fragments,
                chunk_size_bytes: manifest.chunk_size_bytes,
                created_at: manifest.created_at,

                compression: {
                  original_size: originalSize,
                  compressed_size: compressedSize,
                  ratio,
                  compressed_path: compressedPath,
                },

                encryption: {
                  algorithm: "Chaotic-DNA Hybrid",
                  method: "Logistic Map + DNA Base Substitution",
                  chaotic_system: {
                    type: "Logistic Map",
                    equation: "x(n+1) = r × x(n) × (1 - x(n))",
                    parameter_r: r,
                    initial_condition_x0: x0,
                    iterations: dnaSequence.length,
                  },
                  dna_encoding: {
                    mapping: "00→A, 01→T, 10→C, 11→G",
                    original_sequence_length: dnaSequence.length,
                    original_distribution: calculateBaseDistribution(dnaSequence),
                    sample_original: dnaSequence.substring(0, 100) + "...",
                  },
                  encrypted_dna: {
                    sequence_length: encryptedDNA.length,
                    encrypted_distribution: calculateBaseDistribution(encryptedDNA),
                    sample_encrypted: encryptedDNA.substring(0, 100) + "...",
                  },
                  encrypted_path: encryptedPath,
                  encryption_metadata_path: encryptionMetadataPath,
                  encrypted_size: encryptedSize,
                  encryption_time_ms: encryptTime,
                  security_notes: {
                    key_space: `4^${dnaSequence.length} possible combinations`,
                    entropy: "High - Chaotic system provides unpredictable key stream",
                    reversible: "Yes - Requires exact x0 and r parameters stored in metadata",
                    warning: "NOT for production cryptography - use only for obfuscation",
                  }
                },
              });

            } catch (err) {
              console.error("Encryption error:", err);
              res.status(500).json({ ok: false, error: err.message });
            }
          });

          inp.on("error", (err) => {
            console.error("Read stream error:", err);
            res.status(500).json({ ok: false, error: "Failed to compress file" });
          });

          out.on("error", (err) => {
            console.error("Write stream error:", err);
            res.status(500).json({ ok: false, error: "Failed to write compressed file" });
          });

        } catch (err) {
          console.error("Compression setup error:", err);
          res.status(500).json({ ok: false, error: err.message });
        }
      });

      writeStream.on("error", (err) => {
        console.error("Write stream error:", err);
        res.status(500).json({ ok: false, error: "Failed to write file" });
      });

    })().catch((err) => {
      console.error("Upload error:", err);
      res.status(500).json({ ok: false, error: err.message });
    });
  });

  req.pipe(busboy);
});

export default router;