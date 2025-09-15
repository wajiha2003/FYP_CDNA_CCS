// src/App.jsx
import { useState } from "react";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import Dashboard from "./components/Dashboard"; // replace MenuPage

function App() {
  const [step, setStep] = useState("login");

  // Login handler
  const handleLogin = async (credentials) => {
    console.log("Login request:", credentials);
    // TODO: call backend -> send OTP
    setStep("otp");
  };

  // OTP handler
  const handleVerify = async (otp) => {
    if (otp === "123456") {
      // fake OTP validation
      setStep("dashboard"); // go to dashboard after success
    } else {
      alert("Invalid OTP!");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setStep("login"); // back to login page
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      {step === "login" && <LoginForm onLogin={handleLogin} />}
      {step === "otp" && <OtpForm onVerify={handleVerify} />}
      {step === "dashboard" && <Dashboard onLogout={handleLogout} />}
    </div>
  );
}

export default App;
