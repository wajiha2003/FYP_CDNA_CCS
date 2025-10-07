import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./processing.css";

export default function Processing() {
  const location = useLocation();
  const files = location.state?.files || [];

  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("file", files[0]);

    axios
      .post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            const now = Date.now();
            const elapsedSec = (now - startTime) / 1000;
            const uploadedMB = e.loaded / (1024 * 1024);
            setSpeed(uploadedMB / elapsedSec);
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((res) => setResult(res.data))
      .catch((err) => {
        console.error("Upload error:", err);
        setResult({ ok: false, error: "Upload failed!" });
      });
  }, [files, startTime]);

  const file = files[0];

  return (
    <div className="processing-page">
      <h2>Processing File...</h2>

      {/* File Details */}
      {file && (
        <div className="file-details">
          <h3>📄 File Details</h3>
          <p><b>Name:</b> {file.name}</p>
          <p><b>Size:</b> {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p><b>Type:</b> {file.type || "N/A"}</p>
        </div>
      )}

      {/* Upload Progress */}
      {!result && (
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>{progress}% completed</p>
          <p><b>Upload Speed:</b> {speed.toFixed(2)} MB/s</p>
          <p>
            <b>Estimated Time Remaining:</b>{" "}
            {file
              ? (
                  ((file.size / (1024 * 1024)) - 
                   (progress / 100) * (file.size / (1024 * 1024))) / speed
                ).toFixed(1)
              : 0}{" "}
            sec
          </p>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="result-box">
          {result.ok ? (
            <>
              <h3>✅ Processing Complete</h3>

              <div className="result-columns">
                {/* Left Column */}
                <div className="left-column">
                  {/* File Processing Details */}
                  <div className="processing-details">
                    <h4>🔹 File Processing</h4>
                    <p><b>Final Hash:</b> {result.file_hash}</p>
                    <p><b>Total Chunks:</b> {result.fragments?.length}</p>
                    <p><b>Chunk Size:</b> {(result.chunk_size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
                    <p><b>Manifest Path:</b> {result.manifest_path}</p>
                    <p><b>Processed At:</b> {new Date(result.created_at).toLocaleString()}</p>
                  </div>

                  {/* Compression Info */}
                  {result.compression && (
                    <div className="compression-details">
                      <h4>🔹 Compression</h4>
                      <p><b>Original Size:</b> {(result.compression.original_size / (1024 * 1024)).toFixed(2)} MB</p>
                      <p><b>Compressed Size:</b> {(result.compression.compressed_size / (1024 * 1024)).toFixed(2)} MB</p>
                      <p><b>Compression Ratio:</b> {result.compression.ratio}%</p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="right-column">
                  {/* Encryption Info */}
                  {result.encryption && (
                    <div className="encryption-details">
                      <h4>🔹 Chaotic-DNA Encryption</h4>
                      <p><b>Algorithm:</b> {result.encryption.algorithm}</p>
                      <p><b>Method:</b> {result.encryption.method}</p>

                      <div className="chaotic-params">
                        <h5>🧮 Chaotic System</h5>
                        <p><b>Type:</b> {result.encryption.chaotic_system.type}</p>
                        <p><b>Equation:</b> {result.encryption.chaotic_system.equation}</p>
                      <p>
                        <b>r:</b> {result.encryption.chaotic_system.parameter_r} &nbsp; | &nbsp; 
                        <b>x₀:</b> {result.encryption.chaotic_system.initial_condition_x0.toFixed(5)} &nbsp; | &nbsp; 
                        <b>Iterations:</b> {result.encryption.chaotic_system.iterations}
                      </p>

                      </div>

                      <div className="dna-details">
                        <h5>🧬 DNA Encoding</h5>
                     <p>
                      <b>Mapping:</b> {result.encryption.dna_encoding.mapping} &nbsp; | &nbsp;
                      <b>Length:</b> {result.encryption.dna_encoding.original_sequence_length}
                    </p>

                      </div>

                      <div className="encrypted-dna">
                        <h5>🔐 Encrypted DNA</h5>
                        <p><b>Length:</b> {result.encryption.encrypted_dna.sequence_length}</p>
                        <p><b>Encrypted Path:</b> {result.encryption.encrypted_path}</p>
                        <p><b>Size:</b> {(result.encryption.encrypted_size / 1024).toFixed(2)} KB</p>
                        <p><b>Time:</b> {result.encryption.encryption_time_ms} ms</p>
                    
                      </div>

                      <div className="security-notes">
                        <h5>🔒 Security Notes</h5>
                        <p><b>Key Space:</b> {result.encryption.security_notes.key_space}</p>
                        <p><b>Entropy:</b> {result.encryption.security_notes.entropy}</p>
                        <p><b>Reversible:</b> {result.encryption.security_notes.reversible}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="error">❌ Processing Failed</h3>
              <p>{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
