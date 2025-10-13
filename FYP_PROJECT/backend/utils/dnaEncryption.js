// utils/dnaEncryption.js
// =============================================================
// 🧬 Chaotic-DNA Hybrid Encryption Utility
// Combines DNA encoding (binary → A/T/C/G) with chaotic map-based key generation.
// Provides reversible encryption and decryption functions.
// =============================================================

// === DNA Encoding: Maps binary pairs to DNA bases (00→A, 01→T, 10→C, 11→G) ===
// === DNA Encoding: Converts raw Buffer → DNA string (safe byte handling) ===
export function dnaEncode(buffer) {
  const map = { "00": "A", "01": "T", "10": "C", "11": "G" };
  let dna = "";

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i].toString(2).padStart(8, "0");
    for (let j = 0; j < 8; j += 2) {
      dna += map[byte.slice(j, j + 2)];
    }
  }

  return dna;
}

// === DNA Decoding: Converts DNA string → raw Buffer (safe) ===
export function dnaDecode(dna) {
  const reverseMap = { A: "00", T: "01", C: "10", G: "11" };
  let bits = "";

  for (let base of dna) {
    const b = reverseMap[base];
    if (b === undefined) throw new Error(`Invalid DNA base: ${base}`);
    bits += b;
  }

  const byteArray = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length === 8) {
      byteArray.push(parseInt(byte, 2));
    }
  }

  return Buffer.from(byteArray);
}

// === Chaotic Key Generation using Logistic Map ===
// x(n+1) = r × x(n) × (1 - x(n))
export function generateChaoticKey(length, x0 = 0.7, r = 3.99) {
  // Ensure x0 is in valid range (0,1)
  x0 = Math.min(Math.max(x0, 0.0001), 0.9999);

  const key = new Array(length);
  let x = x0;

  for (let i = 0; i < length; i++) {
    x = r * x * (1 - x);
    key[i] = Math.floor(x * 4); // Map to 0–3 for A,T,C,G
  }

  return key;
}

// === Chaotic DNA Encryption (XOR-like base substitution) ===
export function chaoticDNAEncrypt(dna, key) {
  const bases = ["A", "T", "C", "G"];
  let encrypted = "";

  for (let i = 0; i < dna.length; i++) {
    const baseIndex = bases.indexOf(dna[i]);
    if (baseIndex === -1) continue;
    const newIndex = (baseIndex + key[i]) % 4;
    encrypted += bases[newIndex];
  }

  return encrypted;
}

// === Chaotic DNA Decryption (inverse operation of above) ===
export function chaoticDNADecrypt(encryptedDNA, key) {
  const bases = ["A", "T", "C", "G"];
  let decrypted = "";

  for (let i = 0; i < encryptedDNA.length; i++) {
    const baseIndex = bases.indexOf(encryptedDNA[i]);
    if (baseIndex === -1) continue;
    const newIndex = (baseIndex - key[i] + 4) % 4;
    decrypted += bases[newIndex];
  }

  return decrypted;
}

// === Utility: Calculate base distribution for analysis/visualization ===
export function calculateBaseDistribution(dna) {
  const dist = { A: 0, T: 0, C: 0, G: 0 };
  for (let base of dna) {
    if (dist[base] !== undefined) dist[base]++;
  }
  return dist;
}
