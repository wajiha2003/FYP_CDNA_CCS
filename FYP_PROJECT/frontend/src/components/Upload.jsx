// src/components/Upload.jsx
import { useState } from "react";
import "./Upload.css";
import cloudIcon from "../assets/upload-svgrepo-com.svg";   // your cloud upload icon
import deleteIcon from "../assets/delete.png";             // your delete icon

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showBasicLevels, setShowBasicLevels] = useState(false);

  // --- File selection handler ---
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // validate each file
    newFiles.forEach((file) => {
      if (!file.name.endsWith(".txt")) {
        alert("Only .txt files are allowed!");
        return;
      }
      if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB in bytes
        alert("File size must not exceed 5GB!");
        return;
      }

      // If validation passes -> add file and show popup
      setFiles((prev) => [...prev, file]);
      setSelectedFile(file);
      setShowPopup(true);
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
      setSelectedFile(file);
      setShowPopup(true);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Encryption Popup Logic ---
  const handleEncryptionChoice = (choice) => {
    if (choice === "basic") {
      setShowBasicLevels(true);
    } else {
      alert("AI Adapted Encryption selected!");
      setShowPopup(false);
    }
  };

  const handleBasicLevel = (level) => {
    alert(`Basic Encryption (${level}) selected!`);
    setShowPopup(false);
    setShowBasicLevels(false);
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

      {/* Popup for Encryption Options */}
      {showPopup && selectedFile && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Choose Encryption for {selectedFile.name}</h3>
            {!showBasicLevels ? (
              <>
                <button onClick={() => handleEncryptionChoice("basic")}>
                  Basic Encryption
                </button>
                <button onClick={() => handleEncryptionChoice("ai")}>
                  AI Adapted Encryption
                </button>
              </>
            ) : (
              <div className="basic-levels">
                <h4>Select Basic Encryption Level</h4>
                <button onClick={() => handleBasicLevel("Low")}>Low</button>
                <button onClick={() => handleBasicLevel("Medium")}>Medium</button>
                <button onClick={() => handleBasicLevel("High")}>High</button>
              </div>
            )}
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
