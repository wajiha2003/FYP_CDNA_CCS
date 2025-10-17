import React from "react";
import "./Landing.css";
import logo from "../assets/logo2.png"; // adjust path if needed

export default function Landing({ onLogin, onSignup }) {
  return (
    <div className="landing-page">
      {/* 🔝 Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-brand">
          {/* Optionally add a small text or mini logo here */}
        </div>
        <div className="navbar-buttons">
          <button onClick={onLogin} className="nav-btn nav-login">Sign In</button>
          <button onClick={onSignup} className="nav-btn nav-signup">Sign Up</button>
        </div>
      </nav>

      {/* 🎯 Hero Section */}
      <div className="landing-hero">
        <div className="hero-text animate-text">
          <h1 className="hero-title">CRYPGEN</h1>
          <p className="hero-sub">Advanced AI-Powered Security for Your Digital Assets</p>
          <div className="hero-buttons">
            <button className="cta-btn primary-btn" onClick={onSignup}>Get Started</button>
            <button className="cta-btn secondary-btn" onClick={onLogin}>Learn More</button>
          </div>
        </div>

        <div className="hero-logo">
          <img src={logo} alt="Crypgen Logo" />
        </div>
        <div className="navbar-brand">
          {/* This can be empty but needs to exist */}
        </div>
      </div>
    </div>
  );
}
