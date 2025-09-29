import React from "react";
import "./Landing.css";
import logo from "../assets/logo2.png"; // adjust path if needed

export default function Landing({ onLogin}) {
  return (
    <div className="landing-page">

      {/* 🔝 Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-brand">
         
        </div>
        <div className="navbar-buttons">
         
          <button onClick={onLogin} className="nav-btn nav-login">Sign In</button>
        </div>
      </nav> 

      {/* 🎯 Hero Section */}
      <div className="landing-hero">
       <div className="hero-text animate-text">
  <h1>CRYPGEN</h1>
 <p className="hero-sub">Advanced AI-Powered Security for Your Digital Assets</p>

</div>

        <div className="hero-logo">
          <img src={logo} alt="Crypgen Logo" />
        </div>
      </div>
      
    </div>
    
  );
}
