import { useState } from "react";
import { InputField, LoadingSpinner } from "./AuthPage";

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});


  const [step, setStep] = useState("login");
  const [fpEmail, setFpEmail] = useState("");
  const [fpEmailError, setFpEmailError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [fpLoading, setFpLoading] = useState(false);


  const validate = () => {
    const e = {};
    if (!formData.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email format";
    if (!formData.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!fpEmail || !/\S+@\S+\.\S+/.test(fpEmail)) {
      setFpEmailError("Please enter a valid email address");
      return;
    }
    setFpEmailError("");
    setFpLoading(true);
    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setStep("otp");
    } catch (err) {
      setFpEmailError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError("");
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setOtp(next);
  };

  
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.join("").length < 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }
    setOtpError("");
    setStep("reset");
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPassword) errs.newPassword = "Password is required";
    else if (newPassword.length < 6) errs.newPassword = "At least 6 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setResetErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setFpLoading(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: otp.join(""), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");
      setStep("success");
    } catch (err) {
      setResetErrors({ general: err.message });
    } finally {
      setFpLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("login");
    setFpEmail("");
    setFpEmailError("");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setNewPassword("");
    setConfirmPassword("");
    setResetErrors({});
  };

  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "Weak", color: "bg-rose-500" },
      { score: 2, label: "Fair", color: "bg-orange-400" },
      { score: 3, label: "Good", color: "bg-yellow-400" },
      { score: 4, label: "Strong", color: "bg-emerald-400" },
      { score: 5, label: "Very Strong", color: "bg-cyan-400" },
    ];
    return levels[Math.min(score, 5)];
  };

  const strength = getStrength(newPassword);


  if (step === "forgot") {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={resetFlow} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors w-fit">
          Back to Sign In
        </button>

        <div>
          <h3 className="text-white font-bold text-base mb-1">Forgot Password?</h3>
          <p className="text-white/30 text-xs leading-relaxed">
            Enter your email address and we'll send a 6-digit OTP to reset your password.
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <InputField
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={fpEmail}
            onChange={(e) => { setFpEmail(e.target.value); setFpEmailError(""); }}
            error={fpEmailError}
          />

          <button
            type="submit"
            disabled={fpLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {fpLoading ? <><LoadingSpinner /><span>Sending OTP...</span></> : <span>Send OTP →</span>}
          </button>
        </form>
      </div>
    );
  }

  
  if (step === "otp") {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => setStep("forgot")} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors w-fit">
          ← Back
        </button>

        <div>
          <h3 className="text-white font-bold text-base mb-1">Check Your Email</h3>
          <p className="text-white/30 text-xs leading-relaxed">
            We sent a 6-digit OTP to <span className="text-cyan-400/80">{fpEmail}</span>. Enter it below.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
          {/* OTP boxes */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/80">Enter OTP</label>
            <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`w-11 h-12 text-center text-white text-lg font-bold rounded-xl border ${digit ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-white/5"
                    } focus:outline-none focus:border-cyan-400/80 transition-all`}
                />
              ))}
            </div>
            {otpError && <p className="text-rose-400 text-xs">{otpError}</p>}
          </div>

          {/* Resend */}
          <div className="flex items-center justify-between">
            <p className="text-white/25 text-xs">Didn't receive it?</p>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={fpLoading}
              className="text-cyan-400/70 hover:text-cyan-400 text-xs transition-colors disabled:opacity-40"
            >
              Resend OTP
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            Verify OTP →
          </button>
        </form>
      </div>
    );
  }


  if (step === "reset") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-white font-bold text-base mb-1">Set New Password</h3>
          <p className="text-white/30 text-xs">OTP verified ✓ — Now choose a new password.</p>
        </div>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/80">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setResetErrors({}); }}
                placeholder="Min. 6 characters"
                className={`w-full bg-white/5 border ${resetErrors.newPassword ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs">
                {showNew ? "HIDE" : "SHOW"}
              </button>
            </div>
            {/* Strength bar */}
            {newPassword && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-white/10"}`} />
                  ))}
                </div>
                <span className={`text-xs font-medium ${strength.color.replace("bg-", "text-")}`}>{strength.label}</span>
              </div>
            )}
            {resetErrors.newPassword && <p className="text-rose-400 text-xs">{resetErrors.newPassword}</p>}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/80">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setResetErrors({}); }}
                placeholder="Repeat new password"
                className={`w-full bg-white/5 border ${resetErrors.confirmPassword ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs">
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
              {confirmPassword && newPassword === confirmPassword && (
                <span className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">✓</span>
              )}
            </div>
            {resetErrors.confirmPassword && <p className="text-rose-400 text-xs">{resetErrors.confirmPassword}</p>}
          </div>

          {resetErrors.general && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-xs">
              {resetErrors.general}
            </div>
          )}

          <button
            type="submit"
            disabled={fpLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {fpLoading ? <><LoadingSpinner /><span>Resetting...</span></> : <span>Reset Password →</span>}
          </button>
        </form>
      </div>
    );
  }


  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl">
          ✓
        </div>
        <div>
          <h3 className="text-white font-bold text-base mb-1">Password Reset!</h3>
          <p className="text-white/40 text-xs leading-relaxed">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>
        <button
          type="button"
          onClick={resetFlow}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-xl text-sm"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

 
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <InputField
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange("email")}
        error={errors.email}
      />

      <InputField
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange("password")}
        error={errors.password}
      >
        <button type="button" onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-xs">
          {showPassword ? "HIDE" : "SHOW"}
        </button>
      </InputField>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? "bg-cyan-500 border-cyan-500" : "border-white/20 bg-white/5"}`}
          >
            {rememberMe && <span className="text-white text-[10px]">✓</span>}
          </div>
          <span className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Remember me</span>
        </label>
        {/* ✅ Forgot password triggers the flow */}
        <button
          type="button"
          onClick={() => setStep("forgot")}
          className="text-cyan-400/70 text-xs hover:text-cyan-400 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 mt-1 flex items-center justify-center gap-2"
      >
        {isLoading ? <><LoadingSpinner /><span>Signing in...</span></> : <span>Sign In </span>}
      </button>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-white/20 text-xs">or continue with</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => window.location.href = "http://localhost:5000/api/auth/google"}
          className="w-full flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-medium py-2.5 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </form>
  );
}