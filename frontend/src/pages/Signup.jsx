import { useState } from "react";
import { InputField, LoadingSpinner } from "./AuthPage";

/**
 * SignupForm Component
 * Props:
 * - onSubmit: function(formData) - handles signup submission
 * - isLoading: boolean - shows loading state
 * - error: string - error message from parent
 */
export default function SignupForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "Weak", color: "bg-rose-500" },
      { score: 2, label: "Fair", color: "bg-orange-400" },
      { score: 3, label: "Good", color: "bg-yellow-400" },
      { score: 4, label: "Strong", color: "bg-emerald-400" },
      { score: 5, label: "Very Strong", color: "bg-cyan-400" },
    ];
    return levels[score] || levels[levels.length - 1];
  };

  const strength = getPasswordStrength(formData.password);

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    else if (formData.firstName.length < 2) newErrors.firstName = "At least 2 characters";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    else if (formData.lastName.length < 2) newErrors.lastName = "At least 2 characters";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "At least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const { confirmPassword, ...submitData } = formData;
      onSubmit(submitData);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* First & Last Name Row */}
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="First Name"
          placeholder="John"
          value={formData.firstName}
          onChange={handleChange("firstName")}
          error={errors.firstName}
        />
        <InputField
          label="Last Name"
          placeholder="Doe"
          value={formData.lastName}
          onChange={handleChange("lastName")}
          error={errors.lastName}
        />
      </div>

      {/* Email */}
      <InputField
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange("email")}
        error={errors.email}
      />

      {/* Password with strength indicator */}
      <div className="flex flex-col gap-1.5">
        <InputField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Min. 6 characters"
          value={formData.password}
          onChange={handleChange("password")}
          error={errors.password}
        >
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-xs font-medium"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </InputField>

        {/* Strength bar */}
        {formData.password && (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score ? strength.color : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-medium ${strength.color.replace("bg-", "text-")}`}>
              {strength.label}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <InputField
        label="Confirm Password"
        type={showConfirm ? "text" : "password"}
        placeholder="Repeat your password"
        value={formData.confirmPassword}
        onChange={handleChange("confirmPassword")}
        error={errors.confirmPassword}
      >
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-xs font-medium"
        >
          {showConfirm ? "HIDE" : "SHOW"}
        </button>
        {/* Match checkmark */}
        {formData.confirmPassword && formData.password === formData.confirmPassword && (
          <span className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">✓</span>
        )}
      </InputField>

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
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 active:translate-y-0 mt-1 flex items-center justify-center gap-2 text-sm"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account →</span>
        )}
      </button>

    </form>
  );
}