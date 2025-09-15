// src/components/MenuPage.jsx
import "./MenuPage.css"; // import css
export default function MenuPage({ onNavigate }) {
  const menuItems = [
    { title: "Upload File", icon: "📤", page: "upload" },
    { title: "My Files", icon: "📂", page: "files" },
    { title: "Activity Logs", icon: "📜", page: "logs" },
    { title: "Settings", icon: "⚙️", page: "settings" },
    { title: "Logout", icon: "🚪", page: "login" },
  ];

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Secure Cloud Dashboard</h1>
        <p>Welcome! Choose an action below.</p>
      </div>

      <div className="menu-grid">
        {menuItems.map((item, i) => (
          <div
            key={i}
            className="menu-card"
            onClick={() => onNavigate(item.page)}
          >
            <div className="menu-icon">{item.icon}</div>
            <h3>{item.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
