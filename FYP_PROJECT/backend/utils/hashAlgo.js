import crypto from "crypto";

export function getSha512_256Algo() {
  const hashes = crypto.getHashes().map((h) => h.toLowerCase());
  if (hashes.includes("sha512-256")) return "sha512-256";
  if (hashes.includes("sha512256")) return "sha512256";
  throw new Error("sha512/256 not supported in this Node build.");
}
