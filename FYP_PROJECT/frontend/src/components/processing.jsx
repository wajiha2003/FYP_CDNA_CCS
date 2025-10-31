import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./processing.css";
import API from "../api/apiconfig";


export default function Processing() {
  const location = useLocation();
  const navigate = useNavigate();
  const files = location.state?.files || [];

  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());
  const hasUploaded = useRef(false); // ✅ Prevents double-triggering

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (files.length === 0 || hasUploaded.current) return; // ✅ guard
    hasUploaded.current = true; // ✅ ensures only 1 upload

    const formData = new FormData();
    formData.append("file", files[0]);

    axios.post(API.FILES.UPLOAD, formData,{
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
      .then((res) => {
        // Save uploaded file to MyFiles
      const uploadedFile = {
        id: Date.now(),
        name: files[0].name,
        type: files[0].type || "Unknown",
        size: `${(files[0].size / (1024 * 1024)).toFixed(2)} MB`,
        url: res.data.uploaded_path
          ? `${API.STORAGE_BASE_URL}/${res.data.uploaded_path}`
          : URL.createObjectURL(files[0]),
      };

        const existingFiles = JSON.parse(localStorage.getItem("myFiles")) || [];
        localStorage.setItem("myFiles", JSON.stringify([...existingFiles, uploadedFile]));

        setResult(res.data);
        navigate("/result", { state: { result: res.data } });
      })
      .catch((err) => {
        console.error("Upload error:", err);
        setResult({ ok: false, error: "Upload failed!" });
        navigate("/result", { state: { result: { ok: false, error: "Upload failed!" } } });
      });
  }, [files, startTime, navigate]);

  const file = files[0];

  return (
    <div className="processing-page">
      <h2>Processing File...</h2>
      {file && (
        <div className="file-details">
          <h3>File Details</h3>
          <p><b>Name:</b> {file.name}</p>
          <p><b>Size:</b> {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p><b>Type:</b> {file.type || "N/A"}</p>
        </div>
      )}
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
    </div>
  );
}
