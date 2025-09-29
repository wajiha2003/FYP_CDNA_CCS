// src/App.jsx
import { useState } from "react";
import Landing from "./components/Landing";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import Dashboard from "./components/Dashboard";
import emailjs from "@emailjs/browser"; // ✅ EmailJS import

// ✅ Replace with your EmailJS info
const EMAILJS_USER_ID = "z0XPnqySWvklrNwlF";
const EMAILJS_SERVICE_ID = "service_vknud3r";
const EMAILJS_TEMPLATE_ID = "template_sh0yps2";

function App() {
  const [step, setStep] = useState("landing"); // start from landing page
  const [email, setEmail] = useState(""); // store email for OTP
  const [otpSent, setOtpSent] = useState(""); // store generated OTP

  // Landing → Login
  const goToLogin = () => setStep("login");

  // Landing → Signup
  const goToSignup = () => {
    setStep("login");
  };

  // Login handler → send OTP
  const handleLogin = async (credentials) => {
    setEmail(credentials.email);

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpSent(generatedOtp);

    try {
      // Send OTP via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { to_email: credentials.email, otp: generatedOtp },
        EMAILJS_USER_ID
      );

      alert(`OTP sent to ${credentials.email}`);
      setStep("otp"); // move to OTP form
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Failed to send OTP. Please check your EmailJS setup.");
    }
  };

  // OTP handler → verify OTP
  const handleVerify = async (enteredOtp) => {
    if (enteredOtp === otpSent) {
      setStep("dashboard"); // ✅ OTP verified
    } else {
      alert("Invalid OTP!");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setStep("landing"); // after logout → back to landing
    setEmail("");
    setOtpSent("");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      {step === "landing" && (
        <Landing onLogin={goToLogin} onSignup={goToSignup} />
      )}
      {step === "login" && <LoginForm onLogin={handleLogin} />}
      {step === "otp" && <OtpForm onVerify={handleVerify} />}
      {step === "dashboard" && <Dashboard onLogout={handleLogout} />}
    </div>
  );
}

export default App;
