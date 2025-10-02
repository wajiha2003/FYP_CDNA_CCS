// src/components/Processing.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function Processing() {
  const location = useLocation();
  const files = location.state?.files || [];

  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("file", files[0]);

    axios.post("http://localhost:5000/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total) {
          const now = Date.now();
          const elapsedSec = (now - startTime) / 1000;
          const uploadedMB = e.loaded / (1024 * 1024);
          setSpeed(uploadedMB / elapsedSec); // MB/s
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
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>{progress}% completed</p>
          <p><b>Upload Speed:</b> {speed.toFixed(2)} MB/s</p>
          <p>
            <b>Estimated Time Remaining:</b>{" "}
            {file
              ? (
                  ((file.size / (1024 * 1024)) -
                    (progress / 100) * (file.size / (1024 * 1024))) /
                  speed
                ).toFixed(1)
              : 0}{" "}
            sec
          </p>
        </div>
      )}

      {/* Result / Processing Details */}
      {result && (
        <div className="result-box">
          {result.ok ? (
            <>
              <h3>✅ Processing Complete</h3>

              {/* Processing Details */}
              <div className="processing-details">
                <h4>🔹 Processing Details</h4>
                <p><b>Final Hash:</b> {result.file_hash}</p>
                <p><b>Total Chunks:</b> {result.fragments?.length || "N/A"}</p>
                <p>
                  <b>Chunk Size:</b>{" "}
                  {(result.chunk_size_bytes / (1024 * 1024)).toFixed(2)} MB
                </p>
                <p><b>Manifest Path:</b> {result.manifest_path}</p>
                <p>
                  <b>Processed At:</b>{" "}
                  {new Date(result.created_at).toLocaleString()}
                </p>
              </div>

              {/* 🔹 Deflate Compression Details */}
              {result.compression && (
                <div className="compression-details">
                  <h4>🔹 Deflate Compression</h4>
                  <p>
                    <b>Original Size:</b>{" "}
                    {(result.compression.original_size / (1024 * 1024)).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>
                  <p>
                    <b>Compressed Size:</b>{" "}
                    {(result.compression.compressed_size / (1024 * 1024)).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>
                  <p>
                    <b>Compression Ratio:</b> {result.compression.ratio}%
                  </p>
                  <p>
                    <b>Compressed File:</b>{" "}
                    {result.compression.compressed_path}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h3>❌ Processing Failed</h3>
              <p>{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
