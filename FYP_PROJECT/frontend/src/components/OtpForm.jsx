// src/components/OtpForm.jsx
import { useState, useRef, useEffect } from "react";
import "./OtpForm.css";
import emailjs from "@emailjs/browser";
import API from "../api/apiconfig";


const EMAILJS_SERVICE_ID = "service_vknud3r";
const EMAILJS_TEMPLATE_ID = "template_sh0yps2";
const EMAILJS_PUBLIC_KEY = "z0XPnqySWvklrNwlF";

export default function OtpForm({ onVerify, userEmail }) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [isExpired, setIsExpired] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputsRef = useRef([]);

  // ⏱️ Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isExpired) {
      alert("⏰ OTP has expired. Please request a new one.");
      return;
    }

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      alert("❌ Please enter all 6 digits");
      return;
    }

    onVerify(enteredOtp);
    setOtp(Array(6).fill(""));
  };

  // 🔄 Resend OTP
  const handleResendOtp = async () => {
    if (isResending) return;

    setIsResending(true);

    try {
      // Step 1: Verify user credentials again with backend
    const res = await fetch(API.AUTH.RESEND_OTP, {
 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "❌ Failed to resend OTP");
        setIsResending(false);
        return;
      }

      // Step 2: Generate new OTP and send via EmailJS
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: userEmail,
          otp: newOtp,
        },
        EMAILJS_PUBLIC_KEY
      );

      // Step 3: Notify parent component about new OTP
      if (window.updateOtp) {
        window.updateOtp(newOtp);
      }

      // Step 4: Reset timer and state
      setTimeLeft(300);
      setIsExpired(false);
      setOtp(Array(6).fill(""));
      alert(`✅ New OTP sent to ${userEmail}`);

      // Focus first input
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus();
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      alert("⚠️ Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="otp-page">
      <form className="otp-box" onSubmit={handleSubmit}>
        <h2 className="otp-title">Enter OTP</h2>
        <p className="otp-subtitle">Code sent to {userEmail}</p>

        {/* ⏱️ Timer Display */}
        <div className={`timer ${timeLeft <= 60 ? "timer-warning" : ""} ${isExpired ? "timer-expired" : ""}`}>
          {isExpired ? (
            <span>⏰ OTP Expired</span>
          ) : (
            <span>Time remaining: {formatTime(timeLeft)}</span>
          )}
        </div>

        <div className="otp-inputs">
          {otp.map((value, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputsRef.current[index] = el)}
              className="otp-single-input"
              disabled={isExpired}
              required
            />
          ))}
        </div>

        <button type="submit" className="otp-btn" disabled={isExpired}>
          Verify
        </button>

        {/* 🔄 Resend OTP Button */}
        <button
          type="button"
          className="resend-btn"
          onClick={handleResendOtp}
          disabled={isResending || (!isExpired && timeLeft > 240)} // Can resend after 1 min or if expired
        >
          {isResending ? "Sending..." : "🔄 Resend OTP"}
        </button>

        {!isExpired && timeLeft > 240 && (
          <p className="resend-hint">
            You can resend OTP after {formatTime(timeLeft - 240)}
          </p>
        )}
      </form>
    </div>
  );
}