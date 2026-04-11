import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, getBackendOrigin } from "../config/api";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium animate-slide-in ${
    type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-pink-500"
  }`}>
    <span>{type === "success" ? "✓" : "✕"}</span>
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg">×</button>
  </div>
);

const DELETE_REASONS = [
  "I no longer need this account",
  "I have a duplicate account",
  "I have privacy concerns",
  "The app is not useful for me",
  "I found a better alternative",
  "Other",
];

export default function EditProfile({ onClose, onUpdated }) {
  const token = getToken();
  const user = decodeToken(token);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  
  const [pwStep, setPwStep] = useState("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [pwErrors, setPwErrors] = useState({});
  const [otpLoading, setOtpLoading] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage] = useState(user?.image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteNote, setDeleteNote] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { showToast("Only JPEG, PNG and WebP images are allowed", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB", "error"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = "First name is required";
    else if (form.firstName.length < 2) e.firstName = "At least 2 characters";
    if (!form.lastName) e.lastName = "Last name is required";
    else if (form.lastName.length < 2) e.lastName = "At least 2 characters";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

 
  const handleRequestPasswordOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await fetch(apiUrl("/users/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setPwStep("otp");
      showToast(`OTP sent to ${user?.email} 📧`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setOtpLoading(false);
    }
  };

  
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError("");
    if (value && index < 5) {
      document.getElementById(`pw-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`pw-otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setOtp(next);
  };

  const handleVerifyOtp = async () => {
    if (otp.join("").length < 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    try {
      
      setOtpError("");
      setPwStep("verified");
      showToast("OTP verified! Now set your new password ✓", "success");
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
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

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

   
    if (pwStep === "verified") {
      const errs = {};
      if (!newPassword) errs.newPassword = "Password is required";
      else if (newPassword.length < 6) errs.newPassword = "At least 6 characters";
      if (!confirmPassword) errs.confirmPassword = "Please confirm password";
      else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
      setPwErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }

    setIsLoading(true);
    try {
      // If password change with OTP — use reset-password endpoint first
      if (pwStep === "verified" && newPassword) {
        const resetRes = await fetch(apiUrl("/users/reset-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            otp: otp.join(""),
            newPassword,
          }),
        });
        const resetData = await resetRes.json();
        if (!resetRes.ok) throw new Error(resetData.message || "Password reset failed — OTP may have expired");
      }

      
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(apiUrl("/users/me"), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      if (data.token) localStorage.setItem("token", data.token);
      showToast("Profile updated successfully! ✅", "success");
      setTimeout(() => {
        if (onUpdated) onUpdated(data.user);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") { showToast('Please type "DELETE" to confirm', "error"); return; }
    if (!deleteReason) { showToast("Please select a reason", "error"); return; }
    setIsDeleting(true);
    try {
      const res = await fetch(apiUrl("/users/me"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account");
      localStorage.clear();
      sessionStorage.clear();
      setDeleteSuccess(true);
      setTimeout(() => navigate("/"), 4000);
    } catch (err) {
      showToast(err.message, "error");
      setIsDeleting(false);
    }
  };

  const profileImageSrc = imagePreview ||
    (currentImage && currentImage !== "/images/default-profile.png"
      ? `${getBackendOrigin()}${currentImage}`
      : null);

 
  if (deleteSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020e1f] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6 animate-bounce">🌊</div>
          <h1 className="text-3xl font-black text-white mb-3">Goodbye, {user?.firstName}</h1>
          <p className="text-white/50 text-base leading-relaxed mb-6">
            Your account has been permanently deleted. Thank you for being part of the AquaShield community and helping protect our oceans. 🐠
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-6">
            <p className="text-cyan-400/80 text-sm italic">
              "The ocean does not care about your absence, but the creatures within it remember every guardian."
            </p>
          </div>
          <p className="text-white/25 text-sm">Redirecting you to home in a few seconds...</p>
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-cyan-400/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  if (showDeleteConfirm) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0a1628]/95 backdrop-blur-2xl border border-rose-500/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-modal-in my-6">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-orange-500/5 pointer-events-none" />
            <div className="relative z-10 px-7 pt-7 pb-5 border-b border-white/8">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-xl font-black text-white">Delete Account</h2>
              </div>
              <p className="text-white/30 text-xs">This action is permanent and cannot be undone</p>
            </div>
            <div className="relative z-10 px-7 py-6 flex flex-col gap-5">
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                <p className="text-rose-300 text-sm leading-relaxed">
                  Deleting your account will permanently remove all your reports, data and profile information. <strong>This cannot be reversed.</strong>
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/50">Why are you leaving?</label>
                <div className="flex flex-col gap-2">
                  {DELETE_REASONS.map((reason) => (
                    <button key={reason} type="button" onClick={() => setDeleteReason(reason)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${deleteReason === reason ? "bg-rose-500/15 border-rose-500/40 text-rose-300" : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:border-white/15"}`}>
                      {deleteReason === reason ? "● " : "○ "}{reason}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/50">Additional feedback (optional)</label>
                <textarea value={deleteNote} onChange={(e) => setDeleteNote(e.target.value)}
                  placeholder="Tell us how we could have done better..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/15 text-sm focus:outline-none focus:border-white/20 transition-all resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Type <span className="text-rose-400 font-mono">DELETE</span> to confirm
                </label>
                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className={`w-full bg-white/5 border ${deleteConfirmText === "DELETE" ? "border-rose-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/15 text-sm focus:outline-none transition-all font-mono`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white font-medium rounded-xl text-sm transition-all hover:bg-white/10">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                  {isDeleting ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span>Deleting...</span></>
                  ) : <span>Delete My Account</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes modal-in { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } } .animate-modal-in { animation: modal-in 0.25s ease-out; }`}</style>
      </>
    );
  }

 
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative w-full max-w-lg bg-[#0a1628]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-modal-in"
          onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-7 pt-7 pb-5 border-b border-white/8">
            <div>
              <h2 className="text-xl font-black text-white">Edit Profile</h2>
              <p className="text-white/30 text-xs mt-0.5">Update your personal information</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white flex items-center justify-center transition-all">✕</button>
          </div>

          {/* Body */}
          <div className="relative z-10 px-7 py-6 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Profile picture */}
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-white/8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl shadow-black/40">
                    {profileImageSrc ? (
                      <img src={profileImageSrc} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black">
                        {form.firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">📷 Change</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 text-xs font-medium rounded-xl transition-all">
                  {imageFile ? `✓ ${imageFile.name.substring(0, 20)}...` : "Upload Photo"}
                </button>
                <p className="text-white/20 text-xs">JPEG, PNG or WebP · Max 5MB</p>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">First Name</label>
                  <input type="text" value={form.firstName} onChange={handleChange("firstName")} placeholder="John"
                    className={`w-full bg-white/5 border ${errors.firstName ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                  {errors.firstName && <p className="text-rose-400 text-xs">{errors.firstName}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Last Name</label>
                  <input type="text" value={form.lastName} onChange={handleChange("lastName")} placeholder="Doe"
                    className={`w-full bg-white/5 border ${errors.lastName ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                  {errors.lastName && <p className="text-rose-400 text-xs">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Email Address</label>
                <input type="email" value={form.email} onChange={handleChange("email")} placeholder="you@example.com"
                  className={`w-full bg-white/5 border ${errors.email ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                {errors.email && <p className="text-rose-400 text-xs">{errors.email}</p>}
              </div>

              {/* ── PASSWORD CHANGE SECTION ── */}
              <div className="pt-4 border-t border-white/8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-semibold">Change Password</p>
                    <p className="text-white/25 text-xs mt-0.5">Requires OTP verification via email</p>
                  </div>
                  {pwStep === "idle" && (
                    <button type="button" onClick={handleRequestPasswordOtp} disabled={otpLoading}
                      className="px-4 py-2 bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-white/50 hover:text-cyan-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-40">
                      {otpLoading ? "Sending..." : "Send OTP →"}
                    </button>
                  )}
                  {(pwStep === "otp" || pwStep === "verified") && (
                    <button type="button" onClick={() => { setPwStep("idle"); setOtp(["","","","","",""]); setNewPassword(""); setConfirmPassword(""); setPwErrors({}); }}
                      className="text-white/30 hover:text-white/60 text-xs transition-colors">
                      Cancel
                    </button>
                  )}
                </div>

                {/* OTP input */}
                {pwStep === "otp" && (
                  <div className="flex flex-col gap-3 bg-white/3 border border-white/8 rounded-2xl p-4">
                    <p className="text-white/50 text-xs">Enter the 6-digit OTP sent to <span className="text-cyan-400/80">{user?.email}</span></p>
                    <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input key={i} id={`pw-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className={`w-10 h-11 text-center text-white text-lg font-bold rounded-xl border ${digit ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-white/5"} focus:outline-none focus:border-cyan-400/80 transition-all`} />
                      ))}
                    </div>
                    {otpError && <p className="text-rose-400 text-xs">{otpError}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={handleRequestPasswordOtp} disabled={otpLoading}
                        className="text-cyan-400/60 hover:text-cyan-400 text-xs transition-colors disabled:opacity-40">
                        Resend OTP
                      </button>
                      <span className="text-white/15 text-xs">·</span>
                      <button type="button" onClick={handleVerifyOtp} disabled={otpLoading || otp.join("").length < 6}
                        className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all ml-auto">
                        {otpLoading ? "Verifying..." : "Verify OTP ✓"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Password fields — only shown after OTP verified */}
                {pwStep === "verified" && (
                  <div className="flex flex-col gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-emerald-400 text-sm">✓</span>
                      <p className="text-emerald-400/80 text-xs font-semibold">OTP Verified — Set your new password</p>
                    </div>

                    {/* New password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">New Password</label>
                      <div className="relative">
                        <input type={showNew ? "text" : "password"} value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setPwErrors({}); }}
                          placeholder="Min. 6 characters"
                          className={`w-full bg-white/5 border ${pwErrors.newPassword ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs">
                          {showNew ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
                            {[1,2,3,4,5].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-white/10"}`} />
                            ))}
                          </div>
                          <span className={`text-xs font-medium ${strength.color.replace("bg-", "text-")}`}>{strength.label}</span>
                        </div>
                      )}
                      {pwErrors.newPassword && <p className="text-rose-400 text-xs">{pwErrors.newPassword}</p>}
                    </div>

                    {/* Confirm password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Confirm Password</label>
                      <div className="relative">
                        <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setPwErrors({}); }}
                          placeholder="Repeat new password"
                          className={`w-full bg-white/5 border ${pwErrors.confirmPassword ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs">
                          {showConfirm ? "HIDE" : "SHOW"}
                        </button>
                        {confirmPassword && newPassword === confirmPassword && (
                          <span className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">✓</span>
                        )}
                      </div>
                      {pwErrors.confirmPassword && <p className="text-rose-400 text-xs">{pwErrors.confirmPassword}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* UID */}
              <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <span className="text-white/25 text-xs uppercase tracking-wider font-semibold">User ID</span>
                <span className="text-cyan-400/60 text-xs font-mono">{user?.uid || "—"}</span>
                <span className="ml-auto text-white/15 text-xs">Read only</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white font-medium rounded-xl text-sm transition-all hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span>Saving...</span></>
                  ) : <span>Save Changes →</span>}
                </button>
              </div>

              {/* Delete link */}
              <div className="pt-2 border-t border-white/5 text-center">
                <button type="button" onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-400/50 hover:text-rose-400 text-xs transition-colors underline underline-offset-2">
                  Delete my account
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modal-in { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-modal-in { animation: modal-in 0.25s ease-out; }
      `}</style>
    </>
  );
}