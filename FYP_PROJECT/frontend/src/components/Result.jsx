import { useState } from "react";
import { useLocation } from "react-router-dom";
import "./Result.css";

export default function Result() {
  const location = useLocation();
  const result = location.state?.result;

  const [showPre, setShowPre] = useState(false);
  const [showComp, setShowComp] = useState(false);
  const [showEnc, setShowEnc] = useState(false);

  if (!result) {
    return (
      <div className="processing-page">
        <h3>No result data found</h3>
      </div>
    );
  }

  return (
    <div className="result-section">
      {result.ok ? (
        <>
          <h3 className="result-title"> Processing Summary</h3>

          <div className="card-grid">
            {/* 🧩 Stage 1 — Preprocessing */}
            <div className="stage-card">
              <div className="card-header">
                <h4> Preprocessing</h4>
                <span className="status"> Complete</span>
              </div>
              <button
                className="view-button"
                onClick={() => setShowPre(!showPre)}
              >
                {showPre ? "Hide Details" : "View Details"}
              </button>

              {showPre && (
                <div className="card-details">
                  <p><b>Final Hash:</b> {result.file_hash}</p>
                  <p><b>Total Chunks:</b> {result.fragments?.length}</p>
                  <p><b>Chunk Size:</b> {(result.chunk_size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
                  <p><b>Manifest Path:</b> {result.manifest_path}</p>
                  <p><b>Processed At:</b> {new Date(result.created_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* 🗜️ Stage 2 — Compression */}
            <div className="stage-card">
              <div className="card-header">
                <h4> Compression</h4>
                <span className="status">
                  {result.compression ? " Complete" : "⏭ Skipped"}
                </span>
              </div>
              <button
                className="view-button"
                onClick={() => setShowComp(!showComp)}
              >
                {showComp ? "Hide Details" : "View Details"}
              </button>

              {showComp && result.compression && (
                <div className="card-details">
                  <p><b>Original Size:</b> {(result.compression.original_size / (1024 * 1024)).toFixed(2)} MB</p>
                      <p><b>Compressed Size:</b> {(result.compression.compressed_size / (1024 * 1024)).toFixed(2)} MB</p>
                      <p><b>Compression Ratio:</b> {result.compression.ratio}%</p>
                </div>
              )}
            </div>

            {/* 🔒 Stage 3 — Encryption */}
            <div className="stage-card">
              <div className="card-header">
                <h4> Chaotic-DNA Encryption</h4>
                <span className="status">
                  {result.encryption ? " Complete" : "⏭ Skipped"}
                </span>
              </div>
              <button
                className="view-button"
                onClick={() => setShowEnc(!showEnc)}
              >
                {showEnc ? "Hide Details" : "View Details"}
              </button>

              {showEnc && result.encryption && (
                <div className="card-details">
                  <p><b>Algorithm:</b> {result.encryption.algorithm}</p>
                  <p><b>Method:</b> {result.encryption.method}</p>

                  <div className="chaotic-params">
                    <h5> Chaotic System</h5>
                    <p><b>Type:</b> {result.encryption.chaotic_system.type}</p>
                    <p><b>Equation:</b> {result.encryption.chaotic_system.equation}</p>
                    <p>
                      <b>r:</b> {result.encryption.chaotic_system.parameter_r} &nbsp; | &nbsp;
                      <b>x₀:</b> {result.encryption.chaotic_system.initial_condition_x0.toFixed(5)} &nbsp; | &nbsp;
                      <b>Iterations:</b> {result.encryption.chaotic_system.iterations}
                    </p>
                  </div>

                  <div className="dna-details">
                    <h5> DNA Encoding</h5>
                    <p>
                      <b>Mapping:</b> {result.encryption.dna_encoding.mapping} &nbsp; | &nbsp;
                      <b>Length:</b> {result.encryption.dna_encoding.original_sequence_length}
                    </p>
                  </div>

                  <div className="encrypted-dna">
                    <h5> Encrypted DNA</h5>
                    <p><b>Length:</b> {result.encryption.encrypted_dna.sequence_length}</p>
                    <p><b>Encrypted Path:</b> {result.encryption.encrypted_path}</p>
                    <p><b>Size:</b> {(result.encryption.encrypted_size / 1024).toFixed(2)} KB</p>
                    <p><b>Time:</b> {result.encryption.encryption_time_ms} ms</p>
                  </div>

                  <div className="security-notes">
                    <h5> Security Notes</h5>
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
  );
}
