// src/components/Upload.jsx
import { useState } from "react";
import "./Upload.css";
import cloudIcon from "../assets/upload-svgrepo-com.svg";   // your cloud upload icon
import deleteIcon from "../assets/delete.png";        // your delete icon

export default function Upload() {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-page">
      <div
        className="upload-box"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <img src={cloudIcon} alt="Upload" className="upload-icon" />
        <h3>Drag & Drop</h3>
        <p>or select files from device</p>
        <small className="upload-hint">max. 50MB</small>

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

      <div className="file-list">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <span className="file-icon">📄</span>
            <span className="file-name">{file.name}</span>
            <span className="file-status">Uploaded ✔️</span>
            <img
              src={deleteIcon}
              alt="Delete"
              className="delete-btn"
              onClick={() => handleDelete(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
