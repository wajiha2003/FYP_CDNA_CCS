// =============================================================
// 🧬 DNA Conversion Utility
// Converts DNA sequences (A/T/C/G) ↔ Binary Buffers
// =============================================================

// Convert DNA sequence → Binary Buffer
export function dnaToBinary(dnaSequence) {
  const mapping = { A: "00", T: "01", C: "10", G: "11" };
  let bits = "";

  for (const base of dnaSequence) {
    if (!mapping[base]) throw new Error(`Invalid DNA base: ${base}`);
    bits += mapping[base];
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

// Convert Binary Buffer → DNA sequence (optional)
export function binaryToDNA(buffer) {
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
