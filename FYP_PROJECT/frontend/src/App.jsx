// src/App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import Processing from "./components/Processing";
import emailjs from "@emailjs/browser";

// ✅ Replace with your EmailJS info
const EMAILJS_USER_ID = "z0XPnqySWvklrNwlF";
const EMAILJS_SERVICE_ID = "service_vknud3r";
const EMAILJS_TEMPLATE_ID = "template_sh0yps2";

function App() {
  const [step, setStep] = useState("landing"); 
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState("");

  // Landing → Login
  const goToLogin = () => setStep("login");

  // Landing → Signup
  const goToSignup = () => setStep("login");

  // Login handler → send OTP
  const handleLogin = async (credentials) => {
    setEmail(credentials.email);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpSent(generatedOtp);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { to_email: credentials.email, otp: generatedOtp },
        EMAILJS_USER_ID
      );

      alert(`OTP sent to ${credentials.email}`);
      setStep("otp");
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Failed to send OTP. Please check your EmailJS setup.");
    }
  };

  // OTP handler → verify OTP
  const handleVerify = (enteredOtp) => {
    if (enteredOtp === otpSent) {
      setStep("dashboard");
    } else {
      alert("Invalid OTP!");
    }
  };

  const handleLogout = () => {
    setStep("landing");
    setEmail("");
    setOtpSent("");
  };

  return (
    <Router>
      <div className="flex h-screen items-center justify-center bg-black">
        <Routes>
          {/* 🔹 Authentication Flow */}
          <Route
            path="/"
            element={
              step === "landing" ? (
                <Landing onLogin={goToLogin} onSignup={goToSignup} />
              ) : step === "login" ? (
                <LoginForm onLogin={handleLogin} />
              ) : step === "otp" ? (
                <OtpForm onVerify={handleVerify} />
              ) : (
                <Dashboard onLogout={handleLogout} />
              )
            }
          />

          {/* 🔹 File Processing Flow */}
          <Route path="/upload" element={<Upload />} />
          <Route path="/processing" element={<Processing />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
