// src/components/Dashboard.jsx
import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("home");

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">My Dashboard</h2>
        <ul className="menu-list">
          <li
            className={activePage === "home" ? "active" : ""}
            onClick={() => setActivePage("home")}
          >
            Home
          </li>
          <li
            className={activePage === "profile" ? "active" : ""}
            onClick={() => setActivePage("profile")}
          >
            Profile
          </li>
          <li
            className={activePage === "settings" ? "active" : ""}
            onClick={() => setActivePage("settings")}
          >
            Settings
          </li>
        </ul>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activePage === "home" && (
          <div className="home-options">
  <h1 className="welcome-title"> Welcome to <span>Crypgen</span> </h1>
  <p className="welcome-subtitle"> Secure. Compress. Encrypt. Retrieve.</p>
  <p className="welcome-subtitle2">Select an option to get started </p>

  <div className="options-grid">
    <div className="option-card" onClick={() => setActivePage("upload")}>
       Upload File
    </div>
    <div className="option-card" onClick={() => setActivePage("files")}>
       My Files
    </div>
    <div className="option-card" onClick={() => setActivePage("logs")}>
       Activity Logs
    </div>
  </div>
</div>
        )}

        {activePage === "upload" && <h1>Upload File Page</h1>}
        {activePage === "files" && <h1>My Files Page</h1>}
        {activePage === "logs" && <h1>Activity Logs Page</h1>}
        {activePage === "profile" && <h1>Your Profile</h1>}
        {activePage === "settings" && <h1>Settings</h1>}
      </main>
    </div>
  );
}