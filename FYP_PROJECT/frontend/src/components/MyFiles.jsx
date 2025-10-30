import { useState, useEffect } from "react";
import "./MyFiles.css";
import downloadIcon from "../assets/download.png";
import deleteIcon from "../assets/delete.png";
import viewIcon from "../assets/eye.png"; // 👁️ icon for viewing encrypted file


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
const handleViewEncrypted = async (file) => {
  try {
    const response = await fetch(`http://localhost:5000/api/encrypted/${file.fileHash}`);
    if (!response.ok) {
      const error = await response.json();
      alert(`Failed to fetch encrypted file: ${error.error || response.statusText}`);
      return;
    }

    const encryptedText = await response.text();

    // ✅ Option 1: Show encrypted text in new tab
    const blob = new Blob([encryptedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    // ✅ Option 2 (optional): If you want to allow download instead
    // const link = document.createElement("a");
    // link.href = url;
    // link.download = `encrypted_${file.name}.dna`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    // URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Error viewing encrypted file:", err);
    alert("Something went wrong while fetching encrypted file.");
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
    src={viewIcon}
    alt="View Encrypted"
    className="icon-btn view"
    onClick={() => handleViewEncrypted(file)}
    title="View Encrypted File"
  />
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
