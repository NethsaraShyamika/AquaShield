import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InputField, LoadingSpinner } from "./AuthPage";

/**
 * LoginForm Component
 * Props:
 * - onSubmit: function(formData) - handles login submission
 * - isLoading: boolean - shows loading state
 * - error: string - error message from parent
 * - onForgotPassword: function - handles forgot password click
 */
export function LoginForm({ onSubmit, isLoading, error, onForgotPassword }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Email */}
      <InputField
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange("email")}
        error={errors.email}
      />

      {/* Password */}
      <InputField
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange("password")}
        error={errors.password}
      >
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-xs"
        >
          {showPassword ? "HIDE" : "SHOW"}
        </button>
      </InputField>

      {/* Remember me & Forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
              rememberMe
                ? "bg-cyan-500 border-cyan-500"
                : "border-white/20 bg-white/5"
            }`}
          >
            {rememberMe && <span className="text-white text-[10px]">✓</span>}
          </div>
          <span className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Remember me</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-cyan-400/70 text-xs hover:text-cyan-400 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Error from parent */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0 mt-1 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In →</span>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-white/20 text-xs">or continue with</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        {["Google", "GitHub"].map((provider) => (
          <button
            key={provider}
            type="button"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 text-xs font-medium py-2.5 rounded-xl transition-all duration-200"
          >
            {provider}
          </button>
        ))}
      </div>
    </form>
  );
}

const getToken = () => localStorage.getItem("token");
const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    const user = decodeToken(token);
    if (user) {
      navigate(user.isAdmin ? "/admin/dashboard" : "/user-dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      const user = decodeToken(data.token);
      navigate(user?.isAdmin ? "/admin/dashboard" : "/user-dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/contact");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-2xl rounded-4xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">AquaShield</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Log in to your portal</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Access your dashboard, review reports, and continue protecting marine wildlife.
          </p>
        </div>

        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
          onForgotPassword={handleForgotPassword}
        />
      </div>
    </div>
  );
}