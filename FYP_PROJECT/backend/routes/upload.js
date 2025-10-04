import express from "express";
import Busboy from "busboy";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { getSha512_256Algo } from "../utils/hashAlgo.js";

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

      // process chunks
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

      // final file hash
      const finalFileHash = fileHash.digest("hex");

      // manifest
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

      // reconstruct + compress
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
              ratio,
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

export default router;
