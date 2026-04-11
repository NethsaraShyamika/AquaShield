import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";

const navLinks = ["Home", "About", "Services", "Contact"];

// Navbar - with working Sign In/Sign Up buttons
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
          {navLinks.map((link) => (
            link === "Home" ? (
              <button key={link} onClick={handleHomeClick}
                className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
              </button>
            ) : link === "About" ? (
              <Link key={link} to="/about" onClick={() => setActivePage(link)}
                className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            ) : link === "Services" ? (
              <button key={link} onClick={() => setActivePage(link)}
                className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
              </button>
            ) : link === "Contact" ? (
              <Link key={link} to="/contact" onClick={() => setActivePage(link)}
                className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            ) : (
              <button key={link} onClick={() => setActivePage(link)}
                className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
              </button>
            )
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          <button onClick={handleSignIn} className="px-4 py-1.5 text-sm font-medium rounded-lg text-white/40 hover:text-white/70 transition-all">Sign In</button>
          <button onClick={handleSignUp} className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md">Sign Up</button>
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
          {navLinks.map((link) => (
            link === "Home" ? (
              <button key={link} onClick={() => { handleHomeClick(); setMenuOpen(false); }}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
                {link}
              </button>
            ) : link === "About" ? (
              <Link key={link} to="/about" onClick={() => { setActivePage(link); setMenuOpen(false); }}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
                {link}
              </Link>
            ) : link === "Services" ? (
              <button key={link} onClick={() => { setActivePage(link); setMenuOpen(false); }}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
                {link}
              </button>
            ) : link === "Contact" ? (
              <Link key={link} to="/contact" onClick={() => { setActivePage(link); setMenuOpen(false); }}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
                {link}
              </Link>
            ) : (
              <button key={link} onClick={() => { setActivePage(link); setMenuOpen(false); }}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
                {link}
              </button>
            )
          ))}
          <div className="flex gap-2 pt-2 mt-2 border-t border-white/10">
            <button onClick={handleSignIn} className="flex-1 py-2 text-sm rounded-xl border border-white/20 text-white/60 hover:text-white transition-all">Sign In</button>
            <button onClick={handleSignUp} className="flex-1 py-2 text-sm rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md">Sign Up</button>
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
    <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl animate-pulse" style={{animationDelay:'2s'}} />
    <div className="absolute top-1/2 right-10 w-64 h-64 bg-teal-500/6 rounded-full blur-3xl animate-pulse" style={{animationDelay:'4s'}} />
    <div className="absolute top-0 left-[30%] w-px h-3/4 bg-gradient-to-b from-cyan-300/10 to-transparent" />
    <div className="absolute top-0 left-[65%] w-px h-2/3 bg-gradient-to-b from-blue-300/6 to-transparent" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
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

// ✅ Professional capability badge (no CRUD mentions)
const CapabilityBadge = ({ type }) => {
  const styles = {
    Submit:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    View:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Manage:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Archive: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${styles[type]}`}>
      {type}
    </span>
  );
};

// Service data
const services = [
  {
    id: "reports",
   
    title: "Report Management",
    subtitle: "Illegal Activity Reporting System",
    color: "from-cyan-500 to-blue-600",
    glowColor: "cyan-500/15",
    borderColor: "cyan-500/20",
    image: "https://images.unsplash.com/photo-1583503912245-160118f13e17?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Our core service empowers citizens to report illegal fishing activities in real time. From submitting evidence to tracking case progress, every report makes our oceans safer.",
    operations: [
      {
        type: "Submit",
        who: "Users",
        desc: "Submit illegal activity reports with location, photos, vessel details and description of the violation.",
        icon: "✍️",
      },
      {
        type: "View",
        who: "Users & Admin",
        desc: "Users view their own submitted reports and track status. Admin and staff can view all reports across the system.",
        icon: "👁️",
      },
      {
        type: "Manage",
        who: "Users & Admin",
        desc: "Users can edit their pending reports. Admin and staff can update report status Pending, Under Review, Resolved.",
        icon: "✏️",
      },
      {
        type: "Archive",
        who: "Admin only",
        desc: "Administrators can permanently remove reports that are spam, duplicate, or no longer relevant.",
        icon: "🗑️",
      },
    ],
  },
  {
    id: "species",
    
    title: "Species Management",
    subtitle: "Marine Species Database",
    color: "from-teal-500 to-cyan-600",
    glowColor: "teal-500/15",
    borderColor: "teal-500/20",
    image: "https://images.unsplash.com/photo-1759709604544-b2b85444337e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "A comprehensive database of marine species, including endangered and protected species. Users can identify species involved in illegal fishing reports to strengthen their case.",
    operations: [
      {
        type: "Submit",
        who: "Admin only",
        desc: "Administrators add new marine species to the database including scientific name, conservation status, habitat and images.",
        icon: "➕",
      },
      {
        type: "View",
        who: "Users & Admin",
        desc: "All users and admins can browse and search the marine species database to identify species in reports.",
        icon: "🔍",
      },
      {
        type: "Manage",
        who: "Admin only",
        desc: "Administrators update species information such as conservation status changes, new research findings and habitat data.",
        icon: "🔄",
      },
      {
        type: "Archive",
        who: "Admin only",
        desc: "Administrators can remove species entries that are incorrect, outdated or duplicated in the database.",
        icon: "🗑️",
      },
    ],
  },
  {
    id: "cases",
    
    title: "Case Management",
    subtitle: "Investigation Case Tracking",
    color: "from-blue-500 to-indigo-600",
    glowColor: "blue-500/15",
    borderColor: "blue-500/20",
    image: "https://images.unsplash.com/photo-1723146601712-56d8dcce9bc9?q=80&w=1152&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "When reports are verified, they become formal investigation cases. Our case management system allows staff to track, update and resolve cases with full audit trail.",
    operations: [
      {
        type: "Submit",
        who: "Admin & Staff",
        desc: "Admin and staff create formal investigation cases from verified reports, assigning priority level and responsible officer.",
        icon: "📁",
      },
      {
        type: "View",
        who: "Admin & Staff",
        desc: "Admin and staff can view all active and closed cases, filter by status, date range, severity and assigned officer.",
        icon: "📊",
      },
      {
        type: "Manage",
        who: "Admin & Staff",
        desc: "Admin and staff update case status Open, Investigating, Escalated, Closed and add investigation notes and evidence.",
        icon: "📝",
      },
      {
        type: "Archive",
        who: "Admin only",
        desc: "Only administrators can permanently remove closed or archived cases from the system for data management.",
        icon: "🗑️",
      },
    ],
  },
];

// How it works steps
const steps = [
  { num: "01", icon: "📸", title: "Spot & Capture", desc: "Witness illegal fishing activity and capture photo or video evidence on your device." },
  { num: "02", icon: "📋", title: "Submit Report", desc: "Fill in the report form with location, vessel details, species involved and attach your evidence." },
  { num: "03", icon: "🔍", title: "Review & Verify", desc: "Our team reviews and verifies the report, cross-checking with the species database." },
  { num: "04", icon: "⚖️", title: "Case Created", desc: "Verified reports become formal investigation cases assigned to marine enforcement officers." },
  { num: "05", icon: "✅", title: "Resolved", desc: "Cases are tracked to resolution. You receive updates on the outcome of your report." },
];

export default function ServicesPage() {
  const [activePage, setActivePage] = useState("Services");
  const [activeService, setActiveService] = useState("reports");

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <OceanBackground />
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <div className="relative z-10">

        {/* ── HERO ── */}
        <section className="pt-36 pb-16 px-6 md:px-16 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              What We Offer
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 tracking-tight">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Services</span>
            </h1>
            <p className="text-white/35 text-lg leading-relaxed max-w-xl mx-auto">
              Three powerful management systems working together to fight illegal fishing, protect marine species and track enforcement cases.
            </p>

            {/* Service tabs */}
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveService(s.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium border transition-all duration-200 ${
                    activeService === s.id
                      ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-lg`
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8"
                  }`}
                >
                  <span>{s.emoji}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICE DETAIL ── */}
        {services.map((service) => (
          <section
            key={service.id}
            className={`px-6 md:px-16 pb-20 transition-all duration-300 ${activeService === service.id ? "block" : "hidden"}`}
          >
            <div className="max-w-6xl mx-auto">

              {/* Service hero card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-12 shadow-2xl shadow-black/40">
                <img src={service.image} alt={service.title} className="w-full h-64 md:h-80 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020e1f] via-[#020e1f]/70 to-transparent" />
                <div className="absolute inset-0 flex items-center px-10">
                  <div className="max-w-lg">
                    <div className="text-5xl mb-4">{service.emoji}</div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{service.title}</h2>
                    <p className="text-cyan-400/80 text-sm font-medium mb-4 tracking-wide">{service.subtitle}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </div>

              {/* ✅ Key Capabilities grid (no CRUD mention) */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-cyan-400/50" />
                  <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">Key Capabilities</span>
                  <div className="w-8 h-px bg-cyan-400/50" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {service.operations.map((op) => (
                    <div
                      key={op.type}
                      className="bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{op.icon}</span>
                          <CapabilityBadge type={op.type} />
                        </div>
                        <span className="text-white/20 text-xs bg-white/5 border border-white/8 rounded-lg px-2 py-1">
                          {op.who}
                        </span>
                      </div>
                      <p className="text-white/40 text-sm leading-relaxed">{op.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        ))}

        {/* ── ALL SERVICES OVERVIEW ── */}
        <section className="py-16 px-6 md:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-cyan-400/50" />
                <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">Overview</span>
                <div className="w-8 h-px bg-cyan-400/50" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">All Services at a Glance</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setActiveService(service.id)}
                  className="group cursor-pointer bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020e1f] to-transparent" />
                    <div className="absolute top-4 left-4 text-3xl">{service.emoji}</div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.color}`} />
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg mb-1">{service.title}</h3>
                    <p className={`text-xs font-medium mb-3 text-transparent bg-clip-text bg-gradient-to-r ${service.color}`}>
                      {service.subtitle}
                    </p>
                    <p className="text-white/35 text-sm leading-relaxed mb-4">{service.description}</p>
                    {/* ✅ Professional capability badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {["Submit", "View", "Manage", "Archive"].map((op) => (
                        <CapabilityBadge key={op} type={op} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-16 px-6 md:px-16 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-cyan-400/50" />
                <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">The Process</span>
                <div className="w-8 h-px bg-cyan-400/50" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
              <p className="text-white/35 text-sm max-w-md mx-auto">From spotting illegal activity to case resolution — here is the full journey.</p>
            </div>

            <div className="relative">
              <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent hidden md:block" />
              <div className="grid md:grid-cols-5 gap-6">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex flex-col items-center text-center group">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center text-2xl group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-all duration-300 group-hover:-translate-y-1">
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-cyan-500/30">
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">{step.title}</h3>
                    <p className="text-white/30 text-xs leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <div className="inline-flex flex-col items-center gap-4 bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-3xl px-10 py-8">
                <span className="text-4xl">🌊</span>
                <h3 className="text-white font-black text-2xl">Ready to Protect Our Oceans?</h3>
                <p className="text-white/35 text-sm max-w-sm">Join thousands of ocean guardians and start making a difference today.</p>
                <div className="flex gap-3 mt-2">
                  <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all text-sm">
                    Start Reporting →
                  </button>
                  <button className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all text-sm">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}