import { useState } from "react";
import "./OtpForm.css"; // import css

export default function OtpForm({ onVerify }) {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(otp);
  };

  return (
    <div className="otp-page">
      <form onSubmit={handleSubmit} className="otp-box">
        <h2 className="otp-title">Enter OTP</h2>
        <input
          type="text"
          maxLength={6}
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="otp-input"
          required
        />
        <button type="submit" className="otp-btn">
          Verify
        </button>
      </form>
    </div>
  );
}
