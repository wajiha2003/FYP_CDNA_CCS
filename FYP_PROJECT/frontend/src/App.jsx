// src/App.jsx
import { useState } from "react";
import Landing from "./components/Landing";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import Dashboard from "./components/Dashboard";

function App() {
  const [step, setStep] = useState("landing"); // start from landing page

  // Landing → Login
  const goToLogin = () => setStep("login");

  // Landing → Signup
  const goToSignup = () => {
    // if you have a Signup component, navigate to it
    // for now, let's just go to login after signup
    setStep("login");
  };

  // Login handler
  const handleLogin = async (credentials) => {
    console.log("Login request:", credentials);
    // TODO: call backend -> send OTP
    setStep("otp");
  };

  // OTP handler
  const handleVerify = async (otp) => {
    if (otp === "123456") {
      setStep("dashboard"); // ✅ OTP passed → go to dashboard
    } else {
      alert("Invalid OTP!");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setStep("landing"); // after logout → back to landing
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
