import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Fish, Shield, FileText } from "lucide-react";
const navLinks = ["Home", "About", "Services", "Contact"];
import { motion } from "framer-motion";

// Navbar - with working Sign In/Sign Up buttons and navigation
const Navbar = ({ activePage, setActivePage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/', { state: { activeForm: 'login' } });
  };

  const handleSignUp = () => {
    navigate('/', { state: { activeForm: 'signup' } });
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#020e1f]/80 to-transparent backdrop-blur-md">
      <div className="mx-auto px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={handleHomeClick} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-cyan-500/40">🌊</div>
            <span className="text-xl font-bold text-white tracking-tight">Aqua<span className="text-cyan-400">Shield</span></span>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button key="Home" onClick={handleHomeClick}
            className={`text-sm font-medium transition-all duration-200 relative group ${activePage === "Home" ? "text-white" : "text-white/45 hover:text-white/80"}`}>
            Home
            <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === "Home" ? "w-full" : "w-0 group-hover:w-full"}`} />
          </button>
          <Link key="About" to="/about" onClick={() => setActivePage("About")}
            className={`text-sm font-medium transition-all duration-200 relative group ${activePage === "About" ? "text-white" : "text-white/45 hover:text-white/80"}`}>
            About
            <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === "About" ? "w-full" : "w-0 group-hover:w-full"}`} />
          </Link>
          <Link key="Services" to="/services" onClick={() => setActivePage("Services")}
            className={`text-sm font-medium transition-all duration-200 relative group ${activePage === "Services" ? "text-white" : "text-white/45 hover:text-white/80"}`}>
            Services
            <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === "Services" ? "w-full" : "w-0 group-hover:w-full"}`} />
          </Link>
          <button key="Contact" onClick={() => setActivePage("Contact")}
            className={`text-sm font-medium transition-all duration-200 relative group ${activePage === "Contact" ? "text-white" : "text-white/45 hover:text-white/80"}`}>
            Contact
            <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === "Contact" ? "w-full" : "w-0 group-hover:w-full"}`} />
          </button>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          <button onClick={handleSignIn}
            className="px-4 py-1.5 text-sm font-medium rounded-lg text-white/40 hover:text-white/70 transition-all">
            Sign In
          </button>
          <button onClick={handleSignUp}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md">
            Sign Up
          </button>
        </div>
        <button className="md:hidden text-white/60 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#041020]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-3">
          <button key="Home" onClick={() => { handleHomeClick(); setMenuOpen(false); }}
            className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === "Home" ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
            Home
          </button>
          <Link key="About" to="/about" onClick={() => setMenuOpen(false)}
            className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === "About" ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
            About
          </Link>
          <Link key="Services" to="/services" onClick={() => setMenuOpen(false)}
            className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === "Services" ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
            Services
          </Link>
          <button key="Contact" onClick={() => { setActivePage("Contact"); setMenuOpen(false); }}
            className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === "Contact" ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
            Contact
          </button>
          {/* Mobile menu sign in/sign up buttons */}
          <div className="flex gap-2 pt-2 mt-2 border-t border-white/10">
            <button onClick={handleSignIn}
              className="flex-1 py-2 text-sm rounded-xl border border-white/20 text-white/60 hover:text-white transition-all">
              Sign In
            </button>
            <button onClick={handleSignUp}
              className="flex-1 py-2 text-sm rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md">
              Sign Up
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// Ocean background
const OceanBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-b from-[#020e1f] via-[#041828] to-[#061e35]" />
    <div className="absolute top-24 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl animate-pulse" style={{animationDelay:'2s'}} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
    <div className="absolute top-0 left-[28%] w-px h-3/4 bg-gradient-to-b from-cyan-300/10 to-transparent" />
    <div className="absolute top-0 left-[62%] w-px h-2/3 bg-gradient-to-b from-blue-300/6 to-transparent" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
    {/* Floating bubbles */}
    {[...Array(14)].map((_, i) => (
      <div key={i} className="absolute rounded-full bg-cyan-300/10 animate-bubble"
        style={{
          width: `${2 + (i * 3) % 7}px`,
          height: `${2 + (i * 3) % 7}px`,
          left: `${(i * 8 + 5) % 100}%`,
          bottom: `${10 + (i * 9) % 55}%`,
          animationDelay: `${(i * 0.7) % 8}s`,
          animationDuration: `${4 + (i * 0.5) % 5}s`,
        }}
      />
    ))}
    {/* Bottom wave */}
    <div className="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 80" className="w-full opacity-15" preserveAspectRatio="none">
        <path fill="#0ea5e9" d="M0,40 C360,70 720,10 1080,40 C1260,55 1380,25 1440,40 L1440,80 L0,80 Z">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
            values="M0,40 C360,70 720,10 1080,40 C1260,55 1380,25 1440,40 L1440,80 L0,80 Z;
                    M0,55 C360,15 720,65 1080,30 C1260,10 1380,60 1440,35 L1440,80 L0,80 Z;
                    M0,40 C360,70 720,10 1080,40 C1260,55 1380,25 1440,40 L1440,80 L0,80 Z"/>
        </path>
      </svg>
    </div>
  </div>
);

// Contact info cards
const contactInfo = [
  {
    icon: "📧",
    title: "Email Us",
    value: "aquashield@gmail.com",
    sub: "We reply within 24 hours",
    color: "from-cyan-500/20 to-blue-600/20",
    border: "hover:border-cyan-500/30",
  },
  {
    icon: "📞",
    title: "Call Us",
    value: "+94 11 234 5678",
    sub: "Mon–Fri, 9am–6pm IST",
    color: "from-teal-500/20 to-cyan-600/20",
    border: "hover:border-teal-500/30",
  },
  {
    icon: "📍",
    title: "Find Us",
    value: "Colombo, Sri Lanka",
    sub: "Indian Ocean Region HQ",
    color: "from-blue-500/20 to-indigo-600/20",
    border: "hover:border-blue-500/30",
  },
  {
    icon: "🕐",
    title: "Working Hours",
    value: "24/7 Report Hotline",
    sub: "Emergency reports anytime",
    color: "from-indigo-500/20 to-blue-600/20",
    border: "hover:border-indigo-500/30",
  },
];

// FAQ data
const faqs = [
  {
    q: "How do I report illegal fishing activity?",
    a: "Sign up for a free account, navigate to Reports and click Submit Report. Fill in the location, vessel details, and attach any photo or video evidence you have captured.",
  },
  {
    q: "What happens after I submit a report?",
    a: "Our team reviews your report within 24 hours. Verified reports are escalated to marine enforcement officers and a formal case is created. You will receive status updates via email.",
  },
  {
    q: "Is my identity kept confidential?",
    a: "Yes. Reporter identity is fully confidential. Your personal information is never shared with third parties or visible to other users.",
  },
  {
    q: "Can I report anonymously?",
    a: "You can submit reports without a full profile, but a valid email is required for tracking and updates. We never publish personal information publicly.",
  },
  {
    q: "What species are in the database?",
    a: "Our database covers hundreds of marine species found in the Indian Ocean and beyond, including endangered, protected and commercially exploited species.",
  },
];

// Input field component
const FormInput = ({ label, type = "text", placeholder, value, onChange, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full bg-white/5 border ${error ? "border-rose-400/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/15 text-sm focus:outline-none focus:border-cyan-400/40 transition-all duration-200`}
    />
    {error && <p className="text-rose-400 text-xs">{error}</p>}
  </div>
);

export default function ContactPage() {
  const [activePage, setActivePage] = useState("Contact");
  const [openFaq, setOpenFaq] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.subject) e.subject = "Subject is required";
    if (!form.message) e.message = "Message is required";
    else if (form.message.length < 10) e.message = "Message too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <OceanBackground />
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <div className="relative z-10">

        {/* ── HERO ── */}
        <section className="pt-36 pb-16 px-6 md:px-16 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              Get In Touch
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 tracking-tight">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Us</span>
            </h1>
            <p className="text-white/35 text-base leading-relaxed">
              Have a question, want to report something urgent, or just want to learn more? We would love to hear from you.
            </p>
          </div>
        </section>

        {/* ── CONTACT INFO CARDS ── */}
        <section className="px-6 md:px-16 pb-16">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactInfo.map((info) => (
              <div key={info.title}
                className={`bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1 ${info.border} group cursor-default`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  {info.icon}
                </div>
                <p className="text-white/40 text-xs mb-1 font-medium uppercase tracking-wider">{info.title}</p>
                <p className="text-white font-semibold text-sm mb-1">{info.value}</p>
                <p className="text-white/25 text-xs">{info.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN CONTENT: FORM + MAP ── */}
        <section className="px-6 md:px-16 pb-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">

            {/* ── LEFT: Contact Form ── */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-blue-600/3 pointer-events-none rounded-3xl" />

              {!submitted ? (
                <div className="relative z-10">
                  <div className="mb-7">
                    <h2 className="text-2xl font-black text-white mb-1">Send a Message</h2>
                    <p className="text-white/30 text-sm">Fill in the form and our team will get back to you.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Name & Email row */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput label="Your Name" placeholder="John Doe" value={form.name} onChange={handleChange("name")} error={errors.name} />
                      <FormInput label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange("email")} error={errors.email} />
                    </div>

                    {/* Subject */}
                    <FormInput label="Subject" placeholder="What is this about?" value={form.subject} onChange={handleChange("subject")} error={errors.subject} />

                    {/* Topic selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Topic</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm focus:outline-none focus:border-cyan-400/40 transition-all">
                        <option value="" className="bg-[#041828]">Select a topic</option>
                        <option value="report" className="bg-[#041828]">Report an Issue</option>
                        <option value="species" className="bg-[#041828]">Species Database</option>
                        <option value="account" className="bg-[#041828]">Account Help</option>
                        <option value="partnership" className="bg-[#041828]">Partnership</option>
                        <option value="other" className="bg-[#041828]">Other</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">Message</label>
                      <textarea
                        placeholder="Tell us more about your inquiry..."
                        value={form.message}
                        onChange={handleChange("message")}
                        rows={5}
                        className={`w-full bg-white/5 border ${errors.message ? "border-rose-400/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/15 text-sm focus:outline-none focus:border-cyan-400/40 transition-all resize-none`}
                      />
                      {errors.message && <p className="text-rose-400 text-xs">{errors.message}</p>}
                      <p className="text-white/20 text-xs text-right">{form.message.length} / 500</p>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm mt-1">
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message →</span>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Success state */
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce-once">
                    ✅
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">Message Sent!</h3>
                  <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl text-sm transition-all hover:bg-white/10">
                    Send Another →
                  </button>
                </div>
              )}
            </div>

            {/* ── RIGHT: Ocean image + social + extra info ── */}
            <div className="flex flex-col gap-6">

              {/* Ocean image card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 h-56">
                <img src="https://images.unsplash.com/photo-1733723005299-377af7deacac?q=80&w=1334&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Ocean" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020e1f] via-[#020e1f]/30 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="text-white font-bold text-lg">Together We Can</p>
                  <p className="text-white/50 text-sm">Protect all waters, all life 🐟</p>
                </div>
              </div>

              {/* Social links */}
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-2xl p-6">
                <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Follow Our Mission</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "🐦", name: "Twitter / X", handle: "@AquaShield", color: "hover:border-sky-500/30" },
                    { icon: "📘", name: "Facebook", handle: "AquaShield HQ", color: "hover:border-blue-500/30" },
                    { icon: "📸", name: "Instagram", handle: "@aquashield_org", color: "hover:border-pink-500/30" },
                    { icon: "💼", name: "LinkedIn", handle: "AquaShield", color: "hover:border-cyan-500/30" },
                  ].map((s) => (
                    <button key={s.name}
                      className={`flex items-center gap-3 bg-white/5 border border-white/8 ${s.color} rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 group`}>
                      <span className="text-xl">{s.icon}</span>
                      <div className="text-left">
                        <p className="text-white/60 text-xs font-semibold group-hover:text-white/80 transition-colors">{s.name}</p>
                        <p className="text-white/25 text-xs">{s.handle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency report box */}
              <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🚨</div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">Emergency Hotline</h3>
                    <p className="text-white/40 text-xs leading-relaxed mb-3">
                      Witnessing active illegal fishing right now? Use our emergency hotline for immediate response.
                    </p>
                    <button className="px-5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all">
                      Call Emergency Line →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section className="px-6 md:px-16 pb-32">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-cyan-400/50" />
                <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">FAQ</span>
                <div className="w-8 h-px bg-cyan-400/50" />
              </div>
              <h2 className="text-4xl font-black text-white mb-3">Frequently Asked Questions</h2>
              <p className="text-white/30 text-sm">Everything you need to know about AquaShield.</p>
            </div>

            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <div key={i}
                  className={`bg-white/[0.04] backdrop-blur-xl border transition-all duration-300 rounded-2xl overflow-hidden ${
                    openFaq === i ? "border-cyan-500/25" : "border-white/8 hover:border-white/12"
                  }`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left group"
                  >
                    <span className={`text-sm font-semibold transition-colors ${openFaq === i ? "text-cyan-300" : "text-white/70 group-hover:text-white/90"}`}>
                      {faq.q}
                    </span>
                    <span className={`text-white/30 text-lg transition-transform duration-300 ml-4 flex-shrink-0 ${openFaq === i ? "rotate-45 text-cyan-400" : ""}`}>
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5">
                      <div className="h-px bg-white/5 mb-4" />
                      <p className="text-white/40 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <style>{`
        @keyframes bubble {
          0% { transform: translateY(0); opacity: 0.3; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
          60% { transform: translateY(-6px); }
        }
        .animate-bubble { animation: bubble linear infinite; }
        .animate-bounce-once { animation: bounce-once 0.8s ease-out; }
      `}</style>
    </div>
  );
}