import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Get token helper
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

// ✅ Decode JWT helper
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// Toast component
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium animate-slide-in ${type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-pink-500"
    }`}>
    <span>{type === "success" ? "✓" : "✕"}</span>
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg">×</button>
  </div>
);

// Delete reasons
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
    password: "",
    confirmPassword: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(user?.image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Delete account states
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
    if (form.password && form.password.length < 6) e.password = "At least 6 characters";
    if (form.password && form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      if (form.password) formData.append("password", form.password);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/users/me", {
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

  // ✅ Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      showToast('Please type "DELETE" to confirm', "error");
      return;
    }
    if (!deleteReason) {
      showToast("Please select a reason", "error");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account");

      // ✅ Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // ✅ Show goodbye screen
      setDeleteSuccess(true);

      // ✅ Redirect to home after 4 seconds
      setTimeout(() => {
        navigate("/");
      }, 4000);

    } catch (err) {
      showToast(err.message, "error");
      setIsDeleting(false);
    }
  };

  const profileImageSrc = imagePreview ||
    (currentImage && currentImage !== "/images/default-profile.png"
      ? `http://localhost:5000${currentImage}`
      : null);

  // ✅ Goodbye / success screen after deletion
  if (deleteSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020e1f] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {/* Ocean emoji */}
          <div className="text-7xl mb-6 animate-bounce">🌊</div>

          <h1 className="text-3xl font-black text-white mb-3">
            Goodbye, {user?.firstName}
          </h1>

          <p className="text-white/50 text-base leading-relaxed mb-6">
            Your account has been permanently deleted. Thank you for being part of the AquaShield community and helping protect our oceans. 🐠
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-6">
            <p className="text-cyan-400/80 text-sm italic">
              "The ocean does not care about your absence, but the creatures within it remember every guardian."
            </p>
          </div>

          <p className="text-white/25 text-sm">Redirecting you to home in a few seconds...</p>

          {/* Loading dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-cyan-400/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Delete confirmation screen
  if (showDeleteConfirm) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
        
          <div className="relative w-full max-w-md bg-[#0a1628]/95 backdrop-blur-2xl border border-rose-500/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-modal-in my-6">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-orange-500/5 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-7 pt-7 pb-5 border-b border-white/8">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-xl font-black text-white">Delete Account</h2>
              </div>
              <p className="text-white/30 text-xs">This action is permanent and cannot be undone</p>
            </div>

            {/* Body */}
            <div className="relative z-10 px-7 py-6 flex flex-col gap-5">

              {/* Warning box */}
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                <p className="text-rose-300 text-sm leading-relaxed">
                  Deleting your account will permanently remove all your reports, data and profile information. <strong>This cannot be reversed.</strong>
                </p>
              </div>

              {/* Reason selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/50">Why are you leaving?</label>
                <div className="flex flex-col gap-2">
                  {DELETE_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDeleteReason(reason)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm border transition-all duration-200 ${deleteReason === reason
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                        : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:border-white/15"
                        }`}
                    >
                      {deleteReason === reason ? "● " : "○ "}{reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/50">Additional feedback (optional)</label>
                <textarea
                  value={deleteNote}
                  onChange={(e) => setDeleteNote(e.target.value)}
                  placeholder="Tell us how we could have done better..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/15 text-sm focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Type DELETE to confirm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Type <span className="text-rose-400 font-mono">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className={`w-full bg-white/5 border ${deleteConfirmText === "DELETE" ? "border-rose-500/50" : "border-white/10"
                    } rounded-xl px-4 py-3 text-white placeholder-white/15 text-sm focus:outline-none transition-all font-mono`}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white font-medium rounded-xl text-sm transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete My Account</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes modal-in {
            from { transform: scale(0.95) translateY(10px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
          .animate-modal-in { animation: modal-in 0.25s ease-out; }
        `}</style>
      </>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── MODAL BACKDROP ── */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>

        {/* ── MODAL CARD ── */}
        <div
          className="relative w-full max-w-lg bg-[#0a1628]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none" />

          {/* ── HEADER ── */}
          <div className="relative z-10 flex items-center justify-between px-7 pt-7 pb-5 border-b border-white/8">
            <div>
              <h2 className="text-xl font-black text-white">Edit Profile</h2>
              <p className="text-white/30 text-xs mt-0.5">Update your personal information</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white flex items-center justify-center transition-all">✕</button>
          </div>

          {/* ── BODY ── */}
          <div className="relative z-10 px-7 py-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* ── PROFILE PICTURE ── */}
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

              {/* ── NAME ROW ── */}
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

              {/* ── EMAIL ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Email Address</label>
                <input type="email" value={form.email} onChange={handleChange("email")} placeholder="you@example.com"
                  className={`w-full bg-white/5 border ${errors.email ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                {errors.email && <p className="text-rose-400 text-xs">{errors.email}</p>}
              </div>

              {/* ── PASSWORD ── */}
              <div className="pt-4 border-t border-white/8">
                <p className="text-white/30 text-xs mb-4">Leave password blank to keep it unchanged</p>
                <div className="flex flex-col gap-1.5 mb-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange("password")} placeholder="Min. 6 characters"
                      className={`w-full bg-white/5 border ${errors.password ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs font-medium transition-colors">
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  {errors.password && <p className="text-rose-400 text-xs">{errors.password}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={handleChange("confirmPassword")} placeholder="Repeat new password"
                      className={`w-full bg-white/5 border ${errors.confirmPassword ? "border-rose-400/60" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs font-medium transition-colors">
                      {showConfirm ? "HIDE" : "SHOW"}
                    </button>
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">✓</span>
                    )}
                  </div>
                  {errors.confirmPassword && <p className="text-rose-400 text-xs">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* ── UID ── */}
              <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <span className="text-white/25 text-xs uppercase tracking-wider font-semibold">User ID</span>
                <span className="text-cyan-400/60 text-xs font-mono">{user?.uid || "—"}</span>
                <span className="ml-auto text-white/15 text-xs">Read only</span>
              </div>

              {/* ── SUBMIT BUTTONS ── */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white font-medium rounded-xl text-sm transition-all hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes →</span>
                  )}
                </button>
              </div>

              {/* ── DELETE ACCOUNT LINK ── */}
              <div className="pt-2 border-t border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-400/50 hover:text-rose-400 text-xs transition-colors underline underline-offset-2"
                >
                  Delete my account
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modal-in {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-modal-in { animation: modal-in 0.25s ease-out; }
      `}</style>
    </>
  );
}