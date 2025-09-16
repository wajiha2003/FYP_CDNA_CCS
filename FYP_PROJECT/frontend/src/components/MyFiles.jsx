import { useState } from "react";
import "./MyFiles.css";
import downloadIcon from "../assets/download.png"; // your download icon
import deleteIcon from "../assets/delete.png";     // your delete icon

export default function MyFiles() {
  const [files, setFiles] = useState([
    { id: 1, name: "📄 Report.pdf", type: "PDF", size: "1.2 MB", url: "/dummy/Report.pdf" },
    { id: 2, name: "📄 Notes.txt", type: "Text", size: "350 KB", url: "/dummy/Notes.txt" },
    { id: 3, name: "📄 Image.png", type: "Image", size: "2.1 MB", url: "/dummy/Image.png" },
  ]);

  const handleDownload = (file) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleDelete = (id) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  return (
    <div className="myfiles-page">
      <h1>My Files</h1>

      {files.length === 0 ? (
        <p className="no-files-text">No files available.</p>
      ) : (
        <table className="myfiles-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.name}</td>
                <td>{file.type}</td>
                <td>{file.size}</td>
                <td className="action-icons">
                  <img
                    src={downloadIcon}
                    alt="Download"
                    className="icon-btn"
                    onClick={() => handleDownload(file)}
                  />
                  <img
                    src={deleteIcon}
                    alt="Delete"
                    className="icon-btn delete"
                    onClick={() => handleDelete(file.id)}
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
