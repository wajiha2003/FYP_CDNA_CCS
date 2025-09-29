// src/components/OtpForm.jsx
import { useState, useRef } from "react";
import "./OtpForm.css";

export default function OtpForm({ onVerify }) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

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
    const enteredOtp = otp.join("");
    onVerify(enteredOtp); // synchronous verification
    setOtp(Array(6).fill("")); // clear after submission
  };

  return (
    <div className="otp-page">
      <form className="otp-box" onSubmit={handleSubmit}>
        <h2 className="otp-title">Enter OTP</h2>

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
              required
            />
          ))}
        </div>

        <button type="submit" className="otp-btn">Verify</button>
      </form>
    </div>
  );
}
