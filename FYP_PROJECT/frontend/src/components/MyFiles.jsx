import { useState, useEffect } from "react";
import "./MyFiles.css";
import downloadIcon from "../assets/download.png";
import deleteIcon from "../assets/delete.png";

export default function MyFiles() {
  const [files, setFiles] = useState([]);
  const [downloading, setDownloading] = useState(null);

  // ✅ Load only files that have a fileHash
  useEffect(() => {
    const storedFiles = JSON.parse(localStorage.getItem("myFiles")) || [];
    const validFiles = storedFiles.filter((file) => file.fileHash); // only keep entries with hash
    setFiles(validFiles);
  }, []);

  const handleDownload = async (file) => {
    try {
      setDownloading(file.id);

      console.log("=====================================");
      console.log("📁 File Name:", file.name);
      console.log("🔢 File Hash:", file.fileHash);
      console.log("=====================================");

      console.log(`🔓 Starting decryption for: ${file.name} (${file.fileHash})`);

      const response = await fetch(
        `http://localhost:5000/api/retrieve/${file.fileHash}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Decryption failed:", error);
        alert(`Decryption failed: ${error.error || response.statusText}`);
        setDownloading(null);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `decrypted_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log(`✅ File decrypted and downloaded: decrypted_${file.name}`);
    } catch (err) {
      console.error("🔥 Error during decryption download:", err);
      alert("Something went wrong during decryption.");
    } finally {
      setDownloading(null);
    }
  };

  // ✅ Delete handler
  const handleDelete = (id) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    localStorage.setItem("myFiles", JSON.stringify(updatedFiles));
  };

  return (
    <div className="myfiles-page">
      <h1>My Files</h1>

      {files.length === 0 ? (
        <p className="no-files-text">No files with a valid hash available.</p>
      ) : (
        <table className="myfiles-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.name}</td>
                <td>{file.type}</td>
                <td>{file.size}</td>
                <td>
                  {downloading === file.id ? (
                    <span className="status decrypting">Decrypting...</span>
                  ) : (
                    <span className="status ready">Encrypted</span>
                  )}
                </td>
                <td className="action-icons">
                  <img
                    src={downloadIcon}
                    alt="Download"
                    className={`icon-btn ${downloading === file.id ? "disabled" : ""}`}
                    onClick={() => handleDownload(file)}
                    title="Download (Decrypt)"
                  />
                  <img
                    src={deleteIcon}
                    alt="Delete"
                    className="icon-btn delete"
                    onClick={() => handleDelete(file.id)}
                    title="Delete File"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
