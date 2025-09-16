import React from "react";
import "./Landing.css";
import logo from "../assets/logo2.png"; // adjust path if needed

export default function Landing({ onLogin, onSignup }) {
  return (
    <div className="landing-page">

      {/* 🔝 Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-brand">
         
        </div>
        <div className="navbar-buttons">
          <button onClick={onSignup} className="nav-btn">Sign Up</button>
          <button onClick={onLogin} className="nav-btn nav-login">Login</button>
        </div>
      </nav> 

      {/* 🎯 Hero Section */}
      <div className="landing-hero">
       <div className="hero-text animate-text">
  <h1>CRYPGEN</h1>
  <p className="hero-sub">AI-Assisted Adaptive Encryption</p>
</div>

        <div className="hero-logo">
          <img src={logo} alt="Crypgen Logo" />
        </div>
      </div>
    </div>
  );
}
