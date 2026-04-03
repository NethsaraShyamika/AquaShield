import { useState, useEffect } from "react"; // ✅ ADDED useEffect
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LoginForm from "./Login";
import SignupForm from "./Signup";

// Toast Notification Component
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium animate-slide-in ${type === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-pink-500"
    }`}>
    <span>{type === "success" ? "✓" : "✕"}</span>
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
  </div>
);

// Loading Spinner
export const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// Reusable Input
export const InputField = ({ label, type = "text", placeholder, value, onChange, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/80">{label}</label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-white/5 border ${error ? "border-rose-400/60" : "border-white/10"
          } rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/50 transition-all duration-200`}
      />
      {children}
    </div>
    {error && <p className="text-rose-400 text-xs mt-0.5">{error}</p>}
  </div>
);

// Ocean Background
const OceanBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Base ocean gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#020e1f] via-[#041828] to-[#061e35]" />

    {/* Bioluminescent glow */}
    <div className="absolute top-20 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />

    {/* Underwater light rays */}
    <div className="absolute top-0 left-[25%] w-px h-3/4 bg-gradient-to-b from-cyan-300/12 to-transparent" />
    <div className="absolute top-0 left-[45%] w-0.5 h-2/3 bg-gradient-to-b from-blue-300/8 to-transparent" />
    <div className="absolute top-0 left-[65%] w-px h-1/2 bg-gradient-to-b from-cyan-300/6 to-transparent" />
    <div className="absolute top-0 right-[20%] w-px h-3/5 bg-gradient-to-b from-teal-300/8 to-transparent" />

    {/* Subtle grid */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

    {/* Seaweed silhouettes - far left */}
    <svg className="absolute bottom-0 left-0 w-56 opacity-50" viewBox="0 0 220 500" preserveAspectRatio="xMinYMax meet">
      <g fill="#040f1e">
        <ellipse cx="30" cy="500" rx="7" ry="200" />
        <ellipse cx="30" cy="310" rx="28" ry="13" transform="rotate(-22 30 310)" />
        <ellipse cx="30" cy="250" rx="22" ry="11" transform="rotate(16 30 250)" />
        <ellipse cx="30" cy="200" rx="18" ry="9" transform="rotate(-10 30 200)" />
        <ellipse cx="75" cy="500" rx="6" ry="170" />
        <ellipse cx="75" cy="350" rx="20" ry="10" transform="rotate(28 75 350)" />
        <ellipse cx="75" cy="290" rx="16" ry="8" transform="rotate(-18 75 290)" />
        <ellipse cx="120" cy="500" rx="8" ry="220" />
        <ellipse cx="120" cy="290" rx="26" ry="12" transform="rotate(-20 120 290)" />
        <ellipse cx="120" cy="230" rx="20" ry="10" transform="rotate(12 120 230)" />
        <path d="M160,500 L150,380 L145,320 Q140,285 158,275 Q176,265 170,295 L175,360 L180,500 Z" />
        <ellipse cx="80" cy="500" rx="120" ry="22" />
      </g>
    </svg>

    {/* Seaweed silhouettes - far right */}
    <svg className="absolute bottom-0 right-0 w-56 opacity-50" viewBox="0 0 220 500" preserveAspectRatio="xMaxYMax meet">
      <g fill="#040f1e">
        <ellipse cx="190" cy="500" rx="7" ry="200" />
        <ellipse cx="190" cy="310" rx="28" ry="13" transform="rotate(22 190 310)" />
        <ellipse cx="190" cy="250" rx="22" ry="11" transform="rotate(-16 190 250)" />
        <ellipse cx="145" cy="500" rx="6" ry="170" />
        <ellipse cx="145" cy="350" rx="20" ry="10" transform="rotate(-28 145 350)" />
        <ellipse cx="100" cy="500" rx="8" ry="220" />
        <ellipse cx="100" cy="290" rx="26" ry="12" transform="rotate(20 100 290)" />
        <path d="M60,500 L70,380 L75,320 Q80,285 62,275 Q44,265 50,295 L45,360 L40,500 Z" />
        <ellipse cx="140" cy="500" rx="120" ry="22" />
      </g>
    </svg>

    {/* Animated bottom waves */}
    <div className="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 100" className="w-full opacity-20" preserveAspectRatio="none">
        <path fill="#0ea5e9" d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z">
          <animate attributeName="d" dur="7s" repeatCount="indefinite"
            values="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z;
                    M0,70 C240,20 480,90 720,40 C960,10 1200,80 1440,40 L1440,100 L0,100 Z;
                    M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z"/>
        </path>
      </svg>
    </div>

    {/* Floating bubbles */}
    {[...Array(18)].map((_, i) => (
      <div key={i} className="absolute rounded-full bg-cyan-300/15 animate-bubble"
        style={{
          width: `${2 + (i * 3) % 7}px`,
          height: `${2 + (i * 3) % 7}px`,
          left: `${(i * 7 + 3) % 100}%`,
          bottom: `${10 + (i * 11) % 50}%`,
          animationDelay: `${(i * 0.6) % 7}s`,
          animationDuration: `${4 + (i * 0.4) % 5}s`,
        }}
      />
    ))}
  </div>
);

export default function AuthPage() {
  const [activePage, setActivePage] = useState("Home");
  const [activeForm, setActiveForm] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      
      // ✅ Store token if backend returns one
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // ✅ Store user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      showToast("Welcome back! Login successful 🌊", "success");
      
      // ✅ Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (formData) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      
      // ✅ Store token after signup
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      showToast("Account created! Welcome to AquaShield 🌊", "success");
      
      // ✅ Redirect to dashboard after signup
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const navLinks = ["Home", "About", "Services", "Contact"];

  // Left side content changes based on form
  const leftContent = {
    login: {
      greeting: "Welcome Back",
      title: "Dive Back In",
      subtitle: "The ocean needs its guardians. Sign in to continue protecting our marine ecosystems and report illegal fishing activities.",
      cta: "New here?",
      ctaAction: "Create an account →",
    },
    signup: {
      greeting: "Join Us Today",
      title: "Become a Guardian",
      subtitle: "Every report makes a difference. Join thousands of ocean guardians fighting illegal fishing and protecting endangered marine species.",
      cta: "Already a member?",
      ctaAction: "Sign in instead →",
    },
  };

  const content = leftContent[activeForm];

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Ocean Background */}
      <OceanBackground />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── NAVBAR ── */}
      <nav className="relative z-30 flex items-center justify-between px-8 py-5">
        {/* Logo - Wrapped with Link to go home */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-cyan-500/40">
            🌊
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Aqua<span className="text-cyan-400">Shield</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            if (link === "Home") {
              return (
                <button
                  key={link}
                  onClick={() => {
                    navigate("/");
                    setActivePage(link);
                  }}
                  className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}
                >
                  {link}
                  <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
                </button>
              );
            } else if (link === "About") {
              return (
                <Link
                  key={link}
                  to="/about"
                  onClick={() => setActivePage(link)}
                  className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}
                >
                  {link}
                  <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              );
            } else if (link === "Services") {
              return (
                <Link
                  key={link}
                  to="/services"
                  onClick={() => setActivePage(link)}
                  className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}
                >
                  {link}
                  <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              );
            } else if (link === "Contact") {
              return (
                <Link
                  key={link}
                  to="/contact"
                  onClick={() => setActivePage(link)}
                  className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}
                >
                  {link}
                  <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              );
            } else {
              return (
                <button
                  key={link}
                  onClick={() => setActivePage(link)}
                  className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}
                >
                  {link}
                  <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
                </button>
              );
            }
          })}
        </div>

        {/* Toggle login/signup in navbar */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          <button onClick={() => { setActiveForm("login"); setError(""); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeForm === "login" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md" : "text-white/40 hover:text-white/70"
              }`}>
            Sign In
          </button>
          <button onClick={() => { setActiveForm("signup"); setError(""); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeForm === "signup" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md" : "text-white/40 hover:text-white/70"
              }`}>
            Sign Up
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white/60 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="relative z-30 md:hidden bg-[#041020]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => {
            if (link === "Home") {
              return (
                <button
                  key={link}
                  onClick={() => {
                    navigate("/");
                    setMenuOpen(false);
                  }}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}
                >
                  {link}
                </button>
              );
            } else if (link === "About") {
              return (
                <Link
                  key={link}
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}
                >
                  {link}
                </Link>
              );
            } else if (link === "Services") {
              return (
                <Link
                  key={link}
                  to="/services"
                  onClick={() => setMenuOpen(false)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}
                >
                  {link}
                </Link>
              );
            } else if (link === "Contact") {
              return (
                <Link
                  key={link}
                  to="/contact"
                  onClick={() => setMenuOpen(false)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}
                >
                  {link}
                </Link>
              );
            } else {
              return (
                <button
                  key={link}
                  onClick={() => {
                    setActivePage(link);
                    setMenuOpen(false);
                  }}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}
                >
                  {link}
                </button>
              );
            }
          })}
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <button onClick={() => { setActiveForm("login"); setError(""); setMenuOpen(false); }}
              className={`flex-1 py-2 text-sm rounded-xl transition-all ${activeForm === "login" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "border border-white/20 text-white/60"}`}>
              Sign In
            </button>
            <button onClick={() => { setActiveForm("signup"); setError(""); setMenuOpen(false); }}
              className={`flex-1 py-2 text-sm rounded-xl transition-all ${activeForm === "signup" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "border border-white/20 text-white/60"}`}>
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN SPLIT LAYOUT ── */}
      <div className="relative z-10 flex items-center min-h-[calc(100vh-80px)] px-6 md:px-16 pb-16">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* ── LEFT SIDE — Transparent text ── */}
          <div className="flex flex-col justify-center animate-fade-left">
            {/* Greeting badge */}
            <div className="inline-flex items-center gap-2 mb-6 w-fit">
              <div className="w-8 h-px bg-cyan-400/50" />
              <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">
                {content.greeting}
              </span>
            </div>

            {/* Big title */}
            <h1 className="text-5xl md:text-6xl font-black text-white/90 leading-[1.1] mb-5 tracking-tight">
              {content.title.split(" ").map((word, i) => (
                <span key={i}>
                  {i === content.title.split(" ").length - 1
                    ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{word}</span>
                    : <span>{word} </span>
                  }
                </span>
              ))}
            </h1>

            {/* Description */}
            <p className="text-white/35 text-base leading-relaxed mb-8 max-w-sm">
              {content.subtitle}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8">
              {[
                { num: "2.4K+", label: "Reports Filed" },
                { num: "180+", label: "Species Protected" },
                { num: "50+", label: "Countries" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-cyan-400 font-bold text-xl">{stat.num}</span>
                  <span className="text-white/25 text-xs tracking-wide">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Switch form CTA */}
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-sm">{content.cta}</span>
              <button
                onClick={() => { setActiveForm(activeForm === "login" ? "signup" : "login"); setError(""); }}
                className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
              >
                {content.ctaAction}
              </button>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/5">
              {["🐦", "📘", "📸", "▶️"].map((icon, i) => (
                <button key={i} className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-sm transition-all hover:-translate-y-0.5">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT SIDE — Form ── */}
          <div className="flex justify-center md:justify-end animate-fade-right">
            <div className="w-full max-w-sm">
              {/* Form card */}
              <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-black/50 relative overflow-hidden">
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/4 via-transparent to-blue-600/4 pointer-events-none rounded-3xl" />

                {/* Form title */}
                <div className="mb-6 relative z-10">
                  <h2 className="text-xl font-bold text-white">
                    {activeForm === "login" ? "Sign In" : "Create Account"}
                  </h2>
                  <p className="text-white/30 text-xs mt-1">
                    {activeForm === "login" ? "Enter your credentials to continue" : "Fill in your details to get started"}
                  </p>
                </div>

                {/* Form */}
                <div className="relative z-10">
                  {activeForm === "login" ? (
                    <LoginForm
                      onSubmit={handleLogin}
                      isLoading={isLoading}
                      error={error}
                      onForgotPassword={() => showToast("OTP sent to your email!", "success")}
                    />
                  ) : (
                    <SignupForm
                      onSubmit={handleSignup}
                      isLoading={isLoading}
                      error={error}
                    />
                  )}
                </div>
              </div>

              {/* Terms */}
              <p className="text-center text-white/15 text-xs mt-4 leading-relaxed">
                By continuing you agree to our{" "}
                <span className="text-white/30 hover:text-white/50 cursor-pointer transition-colors">Terms of Service</span>
                {" "}and{" "}
                <span className="text-white/30 hover:text-white/50 cursor-pointer transition-colors">Privacy Policy</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-left {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-right {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bubble {
          0% { transform: translateY(0); opacity: 0.4; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-left { animation: fade-left 0.5s ease-out; }
        .animate-fade-right { animation: fade-right 0.5s ease-out 0.1s both; }
        .animate-bubble { animation: bubble linear infinite; }
      `}</style>
    </div>
  );
}