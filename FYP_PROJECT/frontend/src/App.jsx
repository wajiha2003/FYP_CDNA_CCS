// src/App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import Processing from "./components/processing";

import emailjs from "@emailjs/browser";

// ✅ EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_vknud3r";
const EMAILJS_TEMPLATE_ID = "template_sh0yps2";
const EMAILJS_PUBLIC_KEY = "z0XPnqySWvklrNwlF";

function App() {
  const [step, setStep] = useState("landing");
  const [otpSent, setOtpSent] = useState("");
  const [userEmail, setUserEmail] = useState(""); // ✅ Store user email

  // 🔹 Landing → Login
  const goToLogin = () => setStep("login");
  const goToSignup = () => setStep("login");

  // 🔹 Login handler → verify credentials and send OTP
  const handleLogin = async (credentials) => {
    try {
      // ✅ Step 1: Verify credentials with backend
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "❌ Invalid email or password");
        return;
      }

      // ✅ Step 2: Generate and send OTP via EmailJS (frontend)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpSent(generatedOtp);
      setUserEmail(credentials.email); // ✅ Store email for resend

      // ✅ Allow OtpForm to update OTP when resending
      window.updateOtp = (newOtp) => {
        setOtpSent(newOtp);
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: credentials.email,
          otp: generatedOtp,
        },
        EMAILJS_PUBLIC_KEY
      );

      alert(`✅ OTP sent to ${credentials.email}`);
      setStep("otp");
    } catch (err) {
      console.error("Error during login or OTP send:", err);
      alert("⚠️ Failed to send OTP. Please check your EmailJS setup or server.");
    }
  };

  // 🔹 OTP verification (local)
  const handleVerify = (enteredOtp) => {
    if (enteredOtp === otpSent) {
      alert("✅ OTP verified successfully!");
      setStep("dashboard");
      // Clear sensitive data
      setOtpSent("");
      setUserEmail("");
    } else {
      alert("❌ Invalid OTP. Please try again.");
    }
  };

  // 🔹 Logout
  const handleLogout = () => {
    setStep("landing");
    setOtpSent("");
    setUserEmail("");
    // Clean up global function
    if (window.updateOtp) {
      delete window.updateOtp;
    }
  };

  // 🔹 Page Routing
  return (
    <Router>
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <Routes>
          <Route
            path="/"
            element={
              step === "landing" ? (
                <Landing onLogin={goToLogin} onSignup={goToSignup} />
              ) : step === "login" ? (
                <LoginForm onLogin={handleLogin} />
              ) : step === "otp" ? (
                <OtpForm onVerify={handleVerify} userEmail={userEmail} />
              ) : (
                <Dashboard onLogout={handleLogout} />
              )
            }
          />
          <Route path="/upload" element={<Upload />} />
          <Route path="/processing" element={<Processing />} />
         
        </Routes>
      </div>
    </Router>
  );
}

export default App;