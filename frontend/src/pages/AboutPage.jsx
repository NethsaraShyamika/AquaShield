import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import reportingImg from "../assets/images/reporting.jpg";
import fishingImg from "../assets/images/fish.jpg";
import firewingImg from "../assets/images/firewing.jpg";
import { motion } from "framer-motion";
import policereportImg from "../assets/images/policereporting.webp";

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
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-cyan-500/40">🌊</div>
          <span className="text-xl font-bold text-white tracking-tight">Aqua<span className="text-cyan-400">Shield</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link === "Home" ? (
              <button key={link} onClick={() => { handleHomeClick(); setActivePage(link); }}
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
              <Link key={link} to="/services" onClick={() => setActivePage(link)}
                className={`text-sm font-medium transition-all duration-200 relative group ${activePage === link ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-1 left-0 h-px bg-cyan-400 transition-all duration-200 ${activePage === link ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
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
          <button
            onClick={handleSignIn}
            className="px-4 py-1.5 text-sm font-medium rounded-lg text-white/40 hover:text-white/70 transition-all">
            Sign In
          </button>
          <button
            onClick={handleSignUp}
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
              <Link key={link} to="/services" onClick={() => { setActivePage(link); setMenuOpen(false); }}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activePage === link ? "text-cyan-300 bg-cyan-500/10" : "text-white/50 hover:text-white"}`}>
                {link}
              </Link>
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
          {/* Mobile menu sign in/sign up buttons */}
          <div className="flex gap-2 pt-2 mt-2 border-t border-white/10">
            <button
              onClick={handleSignIn}
              className="flex-1 py-2 text-sm rounded-xl border border-white/20 text-white/60 hover:text-white transition-all">
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="flex-1 py-2 text-sm rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md">
              Sign Up
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};


const OceanBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-b from-[#020e1f] via-[#041828] to-[#061e35]" />
    <div className="absolute top-20 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
    <div className="absolute top-0 left-[25%] w-px h-3/4 bg-gradient-to-b from-cyan-300/10 to-transparent" />
    <div className="absolute top-0 left-[60%] w-px h-2/3 bg-gradient-to-b from-blue-300/6 to-transparent" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
    {/* Bottom waves */}
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


const aboutCarouselImages = [
  {
    url: "https://images.unsplash.com/photo-1771765302248-9b733668780f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Stop Illegal Fishing",
    sub: "Together we can end poaching 🎣",
  },
  {
    url: "https://images.unsplash.com/photo-1539607436488-73c6c32e6dc2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Protect All Species",
    sub: "From oceans to rivers, every species matters 🐠",
  },
  {
    url: "https://images.unsplash.com/photo-1712331640584-035a22fb70a9?q=80&w=1125&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Fight Illegal Fishing",
    sub: "Report. Protect. Preserve. ⚓",
  },
  {
    url: "https://images.unsplash.com/photo-1748650337213-2d206688a968?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Save Endangered Species",
    sub: "Protecting aquatic life worldwide 🐟",
  },
  {
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Guard Our Waters",
    sub: "Stop poaching, save species 🌊",
  },
];

const AboutImageCarousel = () => {
  const [current, setCurrent] = useState(0);

  // Auto advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % aboutCarouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => setCurrent(index);
  const prev = () => setCurrent((current - 1 + aboutCarouselImages.length) % aboutCarouselImages.length);
  const next = () => setCurrent((current + 1) % aboutCarouselImages.length);

  return (
    <div className="relative mx-auto max-w-4xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 h-72 md:h-96">
      {/* Images */}
      {aboutCarouselImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
          
          {/* Stronger gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Text with background for guaranteed readability - bottom aligned */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white font-bold text-lg md:text-xl mb-1">{img.title}</p>
            <p className="text-white/80 text-sm md:text-base">{img.sub}</p>
          </div>
        </div>
      ))}

      {/* Left arrow */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/80 border border-white/20 rounded-full flex items-center justify-center text-white text-lg transition-all z-10 hover:scale-110 backdrop-blur-sm"
      >
        ‹
      </button>

      {/* Right arrow */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/80 border border-white/20 rounded-full flex items-center justify-center text-white text-lg transition-all z-10 hover:scale-110 backdrop-blur-sm"
      >
        ›
      </button>

      {/* Dot navigation */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
        {aboutCarouselImages.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-1.5 bg-cyan-400"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Team member data
const team = [
  {
    name: "Dr. Nadeesha Perera",
    role: "Marine Biologist & Co-Founder",
    bio: "15 years researching coral reef ecosystems along Sri Lanka’s coastline. Passionate about using technology to combat illegal fishing and protect marine biodiversity.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    color: "from-cyan-500/20 to-blue-600/20",
  },
  {
    name: "Tharindu Jayasinghe",
    role: "Lead Developer",
    bio: "Full-stack software engineer focused on building scalable systems that connect ocean conservation efforts across Sri Lanka.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    color: "from-blue-500/20 to-teal-600/20",
  },
  {
    name: "Sanduni Fernando",
    role: "Conservation Officer",
    bio: "Former Sri Lanka Coast Guard officer with strong expertise in maritime law, illegal fishing detection, and coastal protection.",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    color: "from-teal-500/20 to-cyan-600/20",
  },
  {
    name: "Kasun Wijesinghe",
    role: "Data Scientist",
    bio: "Specializes in analyzing fishing patterns using AI and data analytics to predict and prevent illegal fishing activities in Sri Lankan waters.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    color: "from-indigo-500/20 to-blue-600/20",
  },
];

// Stats
const stats = [
  { num: "2.4K+", label: "Reports Filed", icon: "📋" },
  { num: "180+", label: "Species Protected", icon: "🐠" },
  { num: "50+", label: "Countries Active", icon: "🌍" },
  { num: "98%", label: "Report Accuracy", icon: "🎯" },
];

// Mission cards
const missions = [
  {
    title: "Stop Illegal Fishing",
    desc: "We empower communities to report illegal fishing activities in real time, creating a global network of ocean protectors.",
    img: reportingImg,
  },
  {
    title: "Protect Marine Life",
    desc: "Our species database helps identify and track endangered marine life, ensuring they are protected from exploitation.",
    img: fishingImg,
  },
  {
    title: "Preserve Our Oceans",
    desc: "Through data-driven insights and community action, we work to preserve ocean ecosystems for future generations.",
    img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80",
  },
];

export default function AboutPage() {
  const [activePage, setActivePage] = useState("About");

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <OceanBackground />
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <div className="relative z-10">

        {/* ── HERO SECTION WITH CAROUSEL ── */}
        <section className="pt-36 pb-20 px-6 md:px-16 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              Our Story
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
              We Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AquaShield</span>
            </h1>
            <p className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Born from a passion for ocean conservation, we built a platform that turns every citizen into an ocean guardian. Together, we fight illegal fishing one report at a time.
            </p>
            {/* Carousel replacing static image */}
            <AboutImageCarousel />
          </div>
        </section>

        {/* ── STATS SECTION ── */}
        <section className="py-16 px-6 md:px-16">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-2xl p-6 text-center hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-1">{stat.num}</div>
                <div className="text-white/35 text-xs tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MISSION SECTION ── */}
        <section className="py-16 px-6 md:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-cyan-400/50" />
                <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">Our Mission</span>
                <div className="w-8 h-px bg-cyan-400/50" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">What We Stand For</h2>
              <p className="text-white/35 max-w-lg mx-auto">Three pillars that drive everything we do at AquaShield.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {missions.map((m) => (
                <div key={m.title} className="group bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img src={m.img} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020e1f] via-[#020e1f]/40 to-transparent" />
                  </div>
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg mb-2">{m.title}</h3>
                    <p className="text-white/35 text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STORY SECTION ── */}
        <section className="py-16 px-6 md:px-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left - image collage */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <img src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80"
                  alt="Ocean" className="rounded-2xl h-52 w-full object-cover border border-white/10" />
                <img src="https://images.unsplash.com/photo-1636145092768-f7fce365f205?q=80&w=1049&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Diving" className="rounded-2xl h-52 w-full object-cover border border-white/10 mt-8" />
                <img src="https://images.unsplash.com/photo-1560241852-557156733a6b?q=80&w=1183&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Marine life" className="rounded-2xl h-40 w-full object-cover border border-white/10 -mt-4" />
                <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80"
                  alt="Fishing" className="rounded-2xl h-40 w-full object-cover border border-white/10 mt-4" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl px-5 py-3 shadow-xl shadow-cyan-500/30">
                <p className="text-white font-bold text-lg">Est. 2024</p>
                <p className="text-white/70 text-xs">Founded by water guardians</p>
              </div>
            </div>

            {/* Right - story text */}
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-8 h-px bg-cyan-400/50" />
                <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">Our Story</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                How It All <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Began</span>
              </h2>
              <div className="space-y-4 text-white/40 text-sm leading-relaxed">
                <p>AquaShield was born in 2024 when a group of marine biologists, environmentalists, and developers watched helplessly as illegal fishing vessels destroyed protected coral reefs off the coast of Sri Lanka, while similar activities went unchecked in rivers, lakes, and coastal waters worldwide.</p>
                <p>Frustrated by the lack of tools to report and track these violations across all water bodies, we built AquaShield a platform that gives every citizen the power to fight back against illegal fishing with just their smartphone, whether on the open ocean, along coastlines, or on inland waters.</p>
                <p>Today, we are a growing community of water guardians across 50+ countries, working together to protect marine and freshwater ecosystems that sustain life on our planet.</p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all text-sm">
                  Join Our Mission →
                </button>
                <button className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all text-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── TEAM SECTION ── */}
        <section className="py-16 px-6 md:px-16 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-cyan-400/50" />
                <span className="text-cyan-400/80 text-xs font-semibold tracking-[0.25em] uppercase">The Team</span>
                <div className="w-8 h-px bg-cyan-400/50" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">Meet the Guardians</h2>
              <p className="text-white/35 max-w-md mx-auto text-sm">The passionate team behind AquaShield, united by a love for our oceans.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {team.map((member) => (
                <div key={member.name} className="group bg-white/[0.04] backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-2">
                  {/* Photo */}
                  <div className="relative h-56 overflow-hidden">
                    <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${member.color} mix-blend-overlay`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020e1f] via-transparent to-transparent" />
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-white font-bold text-sm mb-0.5">{member.name}</h3>
                    <p className="text-cyan-400/70 text-xs font-medium mb-3">{member.role}</p>
                    <p className="text-white/30 text-xs leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}