// src/components/Upload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./Upload.css";
import cloudIcon from "../assets/upload-svgrepo-com.svg";
import deleteIcon from "../assets/delete.png";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate(); 

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    newFiles.forEach((file) => {
      if (!file.name.endsWith(".txt")) {
        alert("Only .txt files are allowed!");
        return;
      }
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert("File size must not exceed 5GB!");
        return;
      }
      setFiles((prev) => [...prev, file]);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);

    droppedFiles.forEach((file) => {
      if (!file.name.endsWith(".txt")) {
        alert("Only .txt files are allowed!");
        return;
      }
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert("File size must not exceed 5GB!");
        return;
      }
      setFiles((prev) => [...prev, file]);
    });
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDelete = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  // 👉 Navigate only when user clicks Continue
  const handleContinue = () => {
    if (files.length === 0) {
      alert("Please select a file first!");
      return;
    }
    navigate("/processing", { state: { files } });
  };

  return (
    <div className="upload-page">
      {/* Upload Box */}
      <div
        className="upload-box"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <img src={cloudIcon} alt="Upload" className="upload-icon" />
        <h3>Drag & Drop</h3>
        <p>or select files from device</p>
        <small className="upload-hint">max. 5GB</small>

        <label className="file-label">
          Select Files
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="file-input"
          />
        </label>
      </div>

      {/* File List */}
      <div className="file-list">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <span className="file-icon"></span>
            <span className="file-name">{file.name}</span>
            <img
              src={deleteIcon}
              alt="Delete"
              className="delete-btn"
              onClick={() => handleDelete(index)}
            />
          </div>
        ))}
      </div>

      {/* Continue Button */}
      {files.length > 0 && (
        <button className="continue-btn" onClick={handleContinue}>
          Continue 
        </button>
      )}
    </div>
  );
}
