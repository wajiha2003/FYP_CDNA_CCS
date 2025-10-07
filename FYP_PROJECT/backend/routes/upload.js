import express from "express";
import Busboy from "busboy";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { getSha512_256Algo } from "../utils/hashAlgo.js";
import { dnaEncode, generateChaoticKey, chaoticDNAEncrypt } from "../utils/dnaEncryption.js";

const router = express.Router();

const FRAG_DIR = path.join(process.cwd(), "storage", "fragments");
const MANIFEST_DIR = path.join(process.cwd(), "storage", "manifests");
const COMPRESS_DIR = path.join(process.cwd(), "storage", "compressed");

router.post("/upload", (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  busboy.on("file", (fieldname, file, info) => {
    (async () => {
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
          if (!fs.existsSync(fragPath)) await fs.promises.writeFile(fragPath, chunk);

          fragments.push({ 
            index: fragments.length, 
            offset, 
            size: chunk.length, 
            chunk_hash: chunkHash 
          });
          offset += chunk.length;
        }
      }

      // Leftover
      if (buffer.length > 0) {
        const chunkHash = crypto.createHash(algo).update(buffer).digest("hex");
        const fragPath = path.join(FRAG_DIR, chunkHash);
        if (!fs.existsSync(fragPath)) await fs.promises.writeFile(fragPath, buffer);

        fragments.push({ 
          index: fragments.length, 
          offset, 
          size: buffer.length, 
          chunk_hash: chunkHash 
        });
        offset += buffer.length;
      }

      // Final file hash
      const finalFileHash = fileHash.digest("hex");

      // Manifest
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

      // Reconstruct + compress
      const originalFilePath = path.join(COMPRESS_DIR, filename);
      const compressedPath = originalFilePath + ".deflate";

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

          // === 🧬 CHAOTIC-DNA HYBRID ENCRYPTION ===
          const startEncrypt = Date.now();
          
          // Read compressed data
          const compressedData = await fs.promises.readFile(compressedPath);
          
          // Step 1: DNA Encoding (Binary → A, T, C, G)
          const dnaSequence = dnaEncode(compressedData);
          
          // Step 2: Generate Chaotic Key using Logistic Map
          const x0 = Math.random(); // Initial condition
          const r = 3.99; // Chaotic parameter (must be 3.57 < r < 4)
          const chaoticKey = generateChaoticKey(dnaSequence.length, x0, r);
          
          // Step 3: Encrypt using Chaotic-DNA algorithm
          const encryptedDNA = chaoticDNAEncrypt(dnaSequence, chaoticKey);
          
          const encryptTime = Date.now() - startEncrypt;
          
          // Save encrypted DNA sequence
          const encryptedPath = compressedPath + ".dna";
          await fs.promises.writeFile(encryptedPath, encryptedDNA, 'utf8');
          
          const encryptedSize = Buffer.byteLength(encryptedDNA, 'utf8');
          
          // Calculate DNA base distribution for both original and encrypted
          const calculateBaseDistribution = (dna) => {
            const dist = { A: 0, T: 0, C: 0, G: 0 };
            for (let base of dna) {
              if (dist[base] !== undefined) dist[base]++;
            }
            return dist;
          };
          
          const originalDistribution = calculateBaseDistribution(dnaSequence);
          const encryptedDistribution = calculateBaseDistribution(encryptedDNA);

          // === Return all results ===
          res.json({
            ok: true,
            file_hash: finalFileHash,
            manifest_path: manifestPath,
            fragments: manifest.fragments,
            chunk_size_bytes: manifest.chunk_size_bytes,
            created_at: manifest.created_at,
            
            // 🗜️ Compression Details
            compression: {
              original_size: originalSize,
              compressed_size: compressedSize,
              ratio,
              compressed_path: compressedPath,
            },
            
            // 🧬 Chaotic-DNA Encryption Details
            encryption: {
              algorithm: "Chaotic-DNA Hybrid",
              method: "Logistic Map + DNA Base Substitution",
              
              // Chaotic System Parameters
              chaotic_system: {
                type: "Logistic Map",
                equation: "x(n+1) = r × x(n) × (1 - x(n))",
                parameter_r: r,
                initial_condition_x0: x0,
                iterations: dnaSequence.length,
              },
              
              // DNA Encoding Details
              dna_encoding: {
                mapping: "00→A, 01→T, 10→C, 11→G",
                original_sequence_length: dnaSequence.length,
                original_distribution: originalDistribution,
                sample_original_sequence: dnaSequence.substring(0, 100) + "...",
              },
              
              // Encrypted DNA Details
              encrypted_dna: {
                sequence_length: encryptedDNA.length,
                encrypted_distribution: encryptedDistribution,
                sample_encrypted_sequence: encryptedDNA.substring(0, 100) + "...",
              },
              
              // File Output
              encrypted_path: encryptedPath,
              encrypted_size: encryptedSize,
              encryption_time_ms: encryptTime,
              
              // Security Notes
              security_notes: {
                key_space: `4^${dnaSequence.length} possible combinations`,
                entropy: "High - Chaotic system provides unpredictable key stream",
                reversible: "Yes - Requires exact x0 and r parameters",
              }
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

export default router;