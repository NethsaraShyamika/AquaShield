// ─────────────────────────────────────────────────────────────
// AdminDashboard.jsx
// Main admin dashboard page for AquaShield
// Shows stats, charts, recent cases and users
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, Briefcase, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Shield, Fish, ChevronRight,
  LayoutDashboard, FileText, Settings, LogOut,
  UserX, Activity, MapPin, Menu, X, Search,
  Waves, Zap,
} from "lucide-react";

// ─── API CONFIG ───────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const api = {
  getUsers: () => fetch(`${API_BASE}/users`, { headers: authHeader() }).then((r) => r.json()),
  getCases: () => fetch(`${API_BASE}/cases`, { headers: authHeader() }).then((r) => r.json()),
};

// ─── CASE STATUS STYLES ───────────────────────────────────────
const STATUS_META = {
  OPEN:                  { label: "Open",             color: "#22d3ee", bg: "bg-cyan-500/10",    text: "text-cyan-400"   },
  UNDER_INVESTIGATION:   { label: "Investigating",    color: "#f59e0b", bg: "bg-amber-500/10",   text: "text-amber-400"  },
  LEGAL_ACTION_STARTED:  { label: "Legal Action",     color: "#a78bfa", bg: "bg-violet-500/10",  text: "text-violet-400" },
  COURT_PROCEEDING:      { label: "Court Proceeding", color: "#f472b6", bg: "bg-pink-500/10",    text: "text-pink-400"   },
  CLOSED:                { label: "Closed",           color: "#34d399", bg: "bg-emerald-500/10", text: "text-emerald-400"},
  REJECTED:              { label: "Rejected",         color: "#f87171", bg: "bg-red-500/10",     text: "text-red-400"    },
};

// ─── CASE PRIORITY STYLES ─────────────────────────────────────
const PRIORITY_META = {
  HIGH:   { color: "#f87171", bar: "bg-red-400"    },
  MEDIUM: { color: "#fbbf24", bar: "bg-amber-400"  },
  LOW:    { color: "#34d399", bar: "bg-emerald-400"},
};

// ─── SIDEBAR NAVIGATION ITEMS ─────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",          icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "cases",     label: "Case Management",    icon: Briefcase,       path: "/admin/cases"     },
  { id: "species",   label: "Species Management", icon: Fish,            path: "/admin/species"   },
  { id: "reports",   label: "Reports",            icon: FileText,        path: "/admin/reports"   },
  { id: "users",     label: "Users",              icon: Users,           path: "/admin/users"     },
  { id: "settings",  label: "Settings",           icon: Settings,        path: "/admin/settings"  },
];

// ─── HELPER ───────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, loading, index }) {
  return (
    <div
      className="stat-card relative overflow-hidden rounded-2xl p-6 flex flex-col gap-3 group cursor-default"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: `1px solid rgba(255,255,255,0.07)`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Floating glow blob */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl pointer-events-none"
        style={{ background: accent }} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: `${accent}99` }}>{label}</span>
          {loading ? (
            <div className="h-10 w-20 rounded-lg animate-pulse" style={{ background: `${accent}15` }} />
          ) : (
            <span className="text-5xl font-black tracking-tighter leading-none" style={{ color: accent }}>
              {value}
            </span>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}12`, border: `1px solid ${accent}25`, boxShadow: `0 0 20px ${accent}20` }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>

      {sub && (
        <div className="relative z-10 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full" style={{ background: accent }} />
          <span className="text-xs font-medium" style={{ color: `${accent}80` }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, bg: "bg-slate-700", text: "text-slate-300" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// PRIORITY DOT
// ─────────────────────────────────────────────────────────────
function PriorityDot({ priority }) {
  const meta = PRIORITY_META[priority] || { bar: "bg-slate-400", color: "#94a3b8" };
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: meta.color }}>
      <span className={`w-2 h-2 rounded-full ${meta.bar}`}
        style={{ boxShadow: `0 0 6px ${meta.color}80` }} />
      {priority}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOM CHART TOOLTIP
// ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1f35", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
      <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, fontWeight: 800, fontSize: 13 }}>
          {p.value} cases
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────
  const [users, setUsers]             = useState([]);
  const [cases, setCases]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeNav, setActiveNav]     = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [caseSearch, setCaseSearch]   = useState("");

  // ── Fetch data on page load ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [u, c] = await Promise.all([api.getUsers(), api.getCases()]);
        setUsers(Array.isArray(u) ? u : []);
        setCases(Array.isArray(c) ? c : []);
      } catch (e) {
        setError("Failed to load dashboard data. Check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Computed stats ─────────────────────────────────────────
  const totalUsers   = users.length;
  const totalCases   = cases.length;
  const openCases    = cases.filter((c) => c.status === "OPEN").length;
  const highPriority = cases.filter((c) => c.priority === "HIGH").length;
  const blockedUsers = users.filter((u) => u.isBlocked).length;
  const closedCases  = cases.filter((c) => c.status === "CLOSED").length;

  // ── Chart data ─────────────────────────────────────────────
  const priorityChartData = ["HIGH", "MEDIUM", "LOW"].map((p) => ({
    name: p, count: cases.filter((c) => c.priority === p).length, fill: PRIORITY_META[p].color,
  }));

  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short" });
      const count = cases.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      months.push({ name: label, count });
    }
    return months;
  })();

  // ── Recent cases filtered by search ───────────────────────
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((c) => {
      if (!caseSearch.trim()) return true;
      const q = caseSearch.toLowerCase();
      return (
        c.caseNumber?.toLowerCase().includes(q) ||
        c.assignedOfficer?.toLowerCase().includes(q) ||
        c.locationName?.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  // ── Sidebar navigation handler ─────────────────────────────
  const handleNav = (id, path) => {
    setActiveNav(id);
    setSidebarOpen(false);
    navigate(path);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { background: #040d1a; }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 99px; }

        /* Stat card entrance */
        .stat-card { animation: cardIn .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes cardIn { from { opacity:0; transform:translateY(20px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }

        /* Fade up */
        .fade-up { animation: fadeUp .6s cubic-bezier(.16,1,.3,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .d1 { animation-delay:.05s; } .d2 { animation-delay:.12s; }
        .d3 { animation-delay:.18s; } .d4 { animation-delay:.24s; }
        .d5 { animation-delay:.30s; } .d6 { animation-delay:.36s; }

        /* Sidebar nav hover */
        .nav-btn { position: relative; overflow: hidden; }
        .nav-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,rgba(34,211,238,0.08),transparent); opacity:0; transition:.2s; border-radius:12px; }
        .nav-btn:hover::before { opacity:1; }

        /* Table row hover */
        .trow { transition: background .15s; }
        .trow:hover { background: rgba(34,211,238,0.04); }

        /* Glow pulse on active nav */
        .nav-active { box-shadow: inset 0 0 0 1px rgba(34,211,238,0.3), 0 0 20px rgba(34,211,238,0.08); }

        /* Shimmer loading */
        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
      `}</style>

      <div style={{ fontFamily: "'Outfit', sans-serif", width: "100vw", minHeight: "100vh", background: "#040d1a", color: "#fff", display: "flex", overflowX: "hidden" }}>

        {/* ── ANIMATED BACKGROUND ─────────────────────────────── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {/* Deep ocean gradient */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.12) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 100% 100%, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
          {/* Grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          {/* Vignette */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(4,13,26,0.8) 100%)" }} />
        </div>

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 lg:hidden"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
              onClick={() => setSidebarOpen(false)} />
          )}

          <aside style={{
            width: 260, flexShrink: 0, background: "rgba(6,15,30,0.95)",
            borderRight: "1px solid rgba(34,211,238,0.08)",
            backdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column",
            position: sidebarOpen ? "fixed" : "sticky",
            top: 0, left: 0, height: "100vh", zIndex: 40,
            transform: sidebarOpen ? "translateX(0)" : undefined,
            transition: "transform .3s cubic-bezier(.16,1,.3,1)",
          }}
            className={!sidebarOpen ? "hidden lg:flex" : "flex"}>

            {/* Brand */}
            <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(34,211,238,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(34,211,238,0.15)" }}>
                  <Waves size={20} style={{ color: "#22d3ee" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.3px" }}>AquaShield</p>
                  <p style={{ fontSize: 10, color: "rgba(34,211,238,0.6)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>Admin Panel</p>
                </div>
              </div>

              {/* System status pill */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", width: "fit-content" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 10, color: "#34d399", fontWeight: 700, letterSpacing: "0.1em" }}>SYSTEM ONLINE</span>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, padding: "0 12px", marginBottom: 8 }}>Navigation</p>

              {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
                const isActive = activeNav === id;
                return (
                  <button key={id} onClick={() => handleNav(id, path)}
                    className="nav-btn"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: isActive ? "rgba(34,211,238,0.08)" : "transparent",
                      color: isActive ? "#22d3ee" : "rgba(255,255,255,0.45)",
                      fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: isActive ? 700 : 500,
                      transition: "all .2s", textAlign: "left",
                      ...(isActive ? { boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.25)" } : {}),
                    }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)", flexShrink: 0 }}>
                      <Icon size={15} />
                    </div>
                    <span style={{ flex: 1 }}>{label}</span>
                    {isActive && <ChevronRight size={14} style={{ opacity: 0.7 }} />}
                  </button>
                );
              })}
            </nav>

            {/* User info + logout */}
            <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#22d3ee", flexShrink: 0 }}>
                  AD
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Admin User</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Super Administrator</p>
                </div>
                <button onClick={() => { localStorage.removeItem("token"); navigate("/admin/login"); }}
                  style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f87171", flexShrink: 0, transition: "all .2s" }}>
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>

          {/* Top header */}
          <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(4,13,26,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Mobile menu button */}
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                <Menu size={16} />
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={14} style={{ color: "#22d3ee" }} />
                  <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>Dashboard</h1>
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, marginTop: 1 }}>
                  {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Open cases indicator */}
              {openCases > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 8px #fbbf24" }} />
                  <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>{openCases} open</span>
                </div>
              )}
              <button style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", position: "relative" }}>
                <Activity size={15} />
              </button>
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div style={{ margin: "20px 28px 0", padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* ── DASHBOARD BODY ──────────────────────────────────── */}
          <main style={{ flex: 1, padding: "28px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>

            {/* ── STAT CARDS ────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <StatCard icon={Users}         label="Total Users"   value={totalUsers}   sub={`${blockedUsers} blocked`}         accent="#22d3ee" loading={loading} index={0} />
              <StatCard icon={Briefcase}     label="Total Cases"   value={totalCases}   sub={`${closedCases} resolved`}         accent="#818cf8" loading={loading} index={1} />
              <StatCard icon={Clock}         label="Open Cases"    value={openCases}    sub="Awaiting action"                   accent="#fbbf24" loading={loading} index={2} />
              <StatCard icon={AlertTriangle} label="High Priority" value={highPriority} sub="Needs immediate attention"         accent="#f87171" loading={loading} index={3} />
            </div>

            {/* ── CHARTS ROW ────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }} className="fade-up d2">

              {/* Bar chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Cases Over Time</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>Monthly case volume · Last 6 months</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)" }}>
                    <TrendingUp size={12} style={{ color: "#22d3ee" }} />
                    <span style={{ fontSize: 11, color: "#22d3ee", fontWeight: 700 }}>Live</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} barCategoryGap="40%">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0e7490" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "Outfit", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "Outfit" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(34,211,238,0.04)", radius: 8 }} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Priority Split</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>Case urgency breakdown</p>
                </div>
                {loading ? (
                  <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid rgba(34,211,238,0.1)", borderTopColor: "#22d3ee", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={priorityChartData} dataKey="count" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} strokeWidth={0}>
                          {priorityChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                      {priorityChartData.map((d) => (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill, boxShadow: `0 0 8px ${d.fill}` }} />
                            {d.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: d.fill }}>{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── STATUS BREAKDOWN ──────────────────────────────── */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }} className="fade-up d3">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Case Status Overview</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>Distribution across all statuses</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                {Object.entries(STATUS_META).map(([key, meta]) => {
                  const count = cases.filter((c) => c.status === key).length;
                  const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                  return (
                    <div key={key} style={{ borderRadius: 16, padding: "16px 14px", background: `${meta.color}08`, border: `1px solid ${meta.color}18`, transition: "all .2s", cursor: "default" }}
                      onMouseEnter={e => e.currentTarget.style.border = `1px solid ${meta.color}40`}
                      onMouseLeave={e => e.currentTarget.style.border = `1px solid ${meta.color}18`}>
                      <p style={{ fontSize: 28, fontWeight: 900, color: meta.color, margin: 0, lineHeight: 1 }}>{loading ? "—" : count}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, margin: "6px 0 10px", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.3 }}>{meta.label}</p>
                      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: meta.color, width: `${pct}%`, transition: "width 1s cubic-bezier(.16,1,.3,1)", boxShadow: `0 0 8px ${meta.color}60` }} />
                      </div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "5px 0 0", fontWeight: 600 }}>{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RECENT CASES TABLE ────────────────────────────── */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }} className="fade-up d4">

              {/* Table header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Recent Cases</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>
                    {caseSearch ? `${recentCases.length} result${recentCases.length !== 1 ? "s" : ""} found` : "Latest 6 cases"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input type="text" value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)}
                      placeholder="Search cases..."
                      style={{ paddingLeft: 34, paddingRight: caseSearch ? 32 : 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, fontFamily: "Outfit", outline: "none", width: 200, transition: "all .2s" }} />
                    {caseSearch && (
                      <button onClick={() => setCaseSearch("")}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button onClick={() => handleNav("cases", "/admin/cases")}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#22d3ee", fontWeight: 700, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "Outfit", transition: "all .2s" }}>
                    View all <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Table content */}
              {loading ? (
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="shimmer" style={{ height: 44, borderRadius: 10 }} />
                  ))}
                </div>
              ) : recentCases.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <Search size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    {caseSearch ? `No cases match "${caseSearch}"` : "No cases found"}
                  </p>
                  {caseSearch && (
                    <button onClick={() => setCaseSearch("")}
                      style={{ marginTop: 8, fontSize: 12, color: "#22d3ee", background: "none", border: "none", cursor: "pointer", fontFamily: "Outfit" }}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {["Case No.", "Officer", "Priority", "Location", "Status", "Created"].map((h) => (
                          <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentCases.map((c) => (
                        <tr key={c._id} className="trow" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22d3ee", fontSize: 12, fontWeight: 700, background: "rgba(34,211,238,0.08)", padding: "3px 8px", borderRadius: 6 }}>
                              {c.caseNumber}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>{c.assignedOfficer || "—"}</td>
                          <td style={{ padding: "14px 20px" }}><PriorityDot priority={c.priority} /></td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                              <MapPin size={10} />
                              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.locationName || "—"}</span>
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px" }}><StatusBadge status={c.status} /></td>
                          <td style={{ padding: "14px 20px", fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{fmtDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── USERS + QUICK OVERVIEW ────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="fade-up d5">

              {/* Recent users */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Recent Users</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>{totalUsers} total registered</p>
                  </div>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={15} style={{ color: "#22d3ee" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {loading ? (
                    [...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 52, borderRadius: 12 }} />)
                  ) : recentUsers.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "16px 0" }}>No users found</p>
                  ) : (
                    recentUsers.map((u) => (
                      <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", transition: "all .2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                        {/* Avatar */}
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#22d3ee", flexShrink: 0 }}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.firstName} {u.lastName}</p>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>{u.uid}</p>
                        </div>
                        {/* Role badge */}
                        {u.isBlocked ? (
                          <span style={{ fontSize: 10, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", padding: "3px 8px", borderRadius: 99, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                            <UserX size={9} /> Blocked
                          </span>
                        ) : u.isAdmin ? (
                          <span style={{ fontSize: 10, color: "#818cf8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", padding: "3px 8px", borderRadius: 99, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                            <Shield size={9} /> Admin
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", padding: "3px 8px", borderRadius: 99, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                            <CheckCircle size={9} /> Active
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick overview */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Quick Overview</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>System performance metrics</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Case Resolution Rate", value: totalCases > 0 ? Math.round((closedCases  / totalCases) * 100) : 0, color: "#34d399" },
                    { label: "High Priority Rate",   value: totalCases > 0 ? Math.round((highPriority / totalCases) * 100) : 0, color: "#f87171" },
                    { label: "User Blocked Rate",    value: totalUsers > 0 ? Math.round((blockedUsers / totalUsers) * 100) : 0, color: "#fbbf24" },
                    { label: "Open Case Rate",       value: totalCases > 0 ? Math.round((openCases   / totalCases) * 100) : 0, color: "#22d3ee" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{loading ? "—" : `${item.value}%`}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: item.color, width: loading ? "0%" : `${item.value}%`, transition: "width 1.2s cubic-bezier(.16,1,.3,1)", boxShadow: `0 0 10px ${item.color}50` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button onClick={() => handleNav("cases", "/admin/cases")}
                    style={{ padding: "11px 16px", borderRadius: 12, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(34,211,238,0.15)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(34,211,238,0.08)"}>
                    <Briefcase size={13} /> Manage Cases
                  </button>
                  <button onClick={() => handleNav("users", "/admin/users")}
                    style={{ padding: "11px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
                    <Users size={13} /> Manage Users
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
}
