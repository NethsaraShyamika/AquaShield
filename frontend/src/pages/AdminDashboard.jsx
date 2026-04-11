// ─────────────────────────────────────────────────────────────
// AdminDashboard.jsx
// Main admin dashboard page for AquaShield
// Shows stats, charts, recent cases, reports and users
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, Briefcase, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Shield, Fish,
  LayoutDashboard, FileText, Settings, LogOut,
  UserX, Activity, MapPin, Search, X,
  ChevronRight,
} from "lucide-react";
import { API_BASE_URL as API_BASE } from "../config/api";

// ─── API CONFIG ───────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const api = {
  getUsers:   () => fetch(`${API_BASE}/users`,   { headers: authHeader() }).then((r) => r.json()),
  getCases:   () => fetch(`${API_BASE}/cases`,   { headers: authHeader() }).then((r) => r.json()),
  getReports: () => fetch(`${API_BASE}/reports`, { headers: authHeader() }).then((r) => r.json()),
};

// ─── NAV ITEMS ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",          icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "users",     label: "User Management",    icon: Users,           path: "/admin/users"     },
  { id: "species",   label: "Species Management", icon: Fish,            path: "/admin/species"   },
  { id: "reports",   label: "Report Management",  icon: FileText,        path: "/admin/reports"   },
  { id: "cases",     label: "Case Management",    icon: Briefcase,       path: "/admin/cases"     },
  { id: "settings",  label: "Settings",           icon: Settings,        path: "/admin/settings"  },
];

// ─── CASE STATUS META ─────────────────────────────────────────
const CASE_STATUS_META = {
  OPEN:                 { label: "Open",             twClass: "bg-cyan-500/20 text-cyan-400"    },
  UNDER_INVESTIGATION:  { label: "Investigating",    twClass: "bg-amber-500/20 text-amber-400"  },
  LEGAL_ACTION_STARTED: { label: "Legal Action",     twClass: "bg-violet-500/20 text-violet-400"},
  COURT_PROCEEDING:     { label: "Court Proceeding", twClass: "bg-pink-500/20 text-pink-400"    },
  CLOSED:               { label: "Closed",           twClass: "bg-emerald-500/20 text-emerald-400"},
  REJECTED:             { label: "Rejected",         twClass: "bg-red-500/20 text-red-400"      },
};

// ─── REPORT STATUS META ───────────────────────────────────────
const REPORT_STATUS_META = {
  Pending:        { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.35)",  text: "#fbbf24" },
  "Under Review": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" },
  Verified:       { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)", text: "#2dd4bf" },
  Dismissed:      { bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.35)",  text: "#fb7185" },
  Resolved:       { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  text: "#4ade80" },
};

// ─── PRIORITY META ────────────────────────────────────────────
const PRIORITY_META = {
  HIGH:   { color: "#f87171", twClass: "bg-red-400"     },
  MEDIUM: { color: "#fbbf24", twClass: "bg-amber-400"   },
  LOW:    { color: "#34d399", twClass: "bg-emerald-400" },
};

// ─── HELPERS ─────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1f35] border border-cyan-500/20 rounded-xl px-3.5 py-2.5 shadow-2xl">
      <p className="text-white/40 text-[11px] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[13px] font-extrabold" style={{ color: p.color || p.fill }}>
          {p.value} {p.name === "count" ? "cases" : p.name}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users,   setUsers]   = useState([]);
  const [cases,   setCases]   = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [caseSearch, setCaseSearch] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    (async () => {
      try {
        const [u, c, r] = await Promise.all([api.getUsers(), api.getCases(), api.getReports()]);
        setUsers(Array.isArray(u) ? u : []);
        setCases(Array.isArray(c) ? c : []);
        setReports(Array.isArray(r) ? r : (r?.reports ?? []));
      } catch {
        setError("Failed to load dashboard data. Check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // ── Computed stats ────────────────────────────────────────
  const totalUsers    = users.length;
  const totalCases    = cases.length;
  const openCases     = cases.filter((c) => c.status === "OPEN").length;
  const highPriority  = cases.filter((c) => c.priority === "HIGH").length;
  const blockedUsers  = users.filter((u) => u.isBlocked).length;
  const closedCases   = cases.filter((c) => c.status === "CLOSED").length;
  const totalReports  = reports.length;
  const pendingReports   = reports.filter((r) => r.status === "Pending").length;
  const verifiedReports  = reports.filter((r) => r.status === "Verified").length;
  const resolvedReports  = reports.filter((r) => r.status === "Resolved").length;

  // ── Chart data ────────────────────────────────────────────
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

  // ── Recent data ───────────────────────────────────────────
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

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleNav = (id, path) => {
    setActiveNav(id);
    navigate(path);
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">

        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside className="w-[260px] flex-shrink-0 border-r border-white/10 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] fixed top-0 left-0 h-full z-20 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 py-5 pb-4 mb-1 border-b border-white/10">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
              <Fish size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white m-0">AquaShield</p>
              <p className="text-[10px] tracking-[0.1em] uppercase text-white/45 m-0">Admin Panel</p>
            </div>
          </div>

          {/* Nav items */}
          <div className="flex flex-col gap-2.5 p-3">
            {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id, path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-180 ${
                  activeNav === id
                    ? "bg-cyan-500/15 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all duration-180"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <div className="flex-1 ml-[260px] w-[calc(100%-260px)] p-6 overflow-y-auto">
          <div className="max-w-[1180px] mx-auto flex flex-col gap-6">

            {/* ── HEADER CARD ─────────────────────────────── */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 shadow-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
                    <Shield size={12} /> Admin Panel
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-white">Dashboard</h1>
                  <p className="text-sm text-white/40 mt-1">
                    {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {openCases > 0 && (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {openCases} open cases
                    </div>
                  )}
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Activity size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            {/* ── USER & CASE STAT CARDS ───────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users,         label: "Total Users",   value: totalUsers,   sub: `${blockedUsers} blocked`,            iconClass: "bg-cyan-500/20 border-cyan-500/30",    textClass: "text-cyan-400"    },
                { icon: Briefcase,     label: "Total Cases",   value: totalCases,   sub: `${closedCases} resolved`,            iconClass: "bg-violet-500/20 border-violet-500/30", textClass: "text-violet-400"  },
                { icon: Clock,         label: "Open Cases",    value: openCases,    sub: "Awaiting action",                    iconClass: "bg-amber-500/20 border-amber-500/30",   textClass: "text-amber-400"   },
                { icon: AlertTriangle, label: "High Priority", value: highPriority, sub: "Needs immediate attention",          iconClass: "bg-red-500/20 border-red-500/30",       textClass: "text-red-400"     },
              ].map(({ icon: Icon, label, value, sub, iconClass, textClass }) => (
                <div key={label} className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-3 ${iconClass}`}>
                    <Icon size={18} className={textClass} />
                  </div>
                  <p className="text-sm text-white/40">{label}</p>
                  {loading
                    ? <div className="h-9 w-16 rounded-lg animate-pulse bg-white/5 mt-1" />
                    : <p className={`text-3xl font-extrabold ${textClass}`}>{value}</p>
                  }
                  <p className="text-xs text-white/25 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── REPORT STAT CARDS ────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-cyan-400" />
                <h2 className="text-sm font-extrabold text-white/60 uppercase tracking-widest">Incident Reports</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: FileText,     label: "Total Reports",    value: totalReports,   sub: "All submitted reports",    iconClass: "bg-blue-500/20 border-blue-500/30",     textClass: "text-blue-400"    },
                  { icon: Clock,        label: "Pending Review",   value: pendingReports, sub: "Awaiting admin action",    iconClass: "bg-yellow-500/20 border-yellow-500/30", textClass: "text-yellow-400"  },
                  { icon: Shield,       label: "Verified",         value: verifiedReports,sub: "Confirmed incidents",      iconClass: "bg-teal-500/20 border-teal-500/30",     textClass: "text-teal-400"    },
                  { icon: CheckCircle,  label: "Resolved",         value: resolvedReports,sub: "Cases closed from reports",iconClass: "bg-green-500/20 border-green-500/30",   textClass: "text-green-400"   },
                ].map(({ icon: Icon, label, value, sub, iconClass, textClass }) => (
                  <div key={label} className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-3 ${iconClass}`}>
                      <Icon size={18} className={textClass} />
                    </div>
                    <p className="text-sm text-white/40">{label}</p>
                    {loading
                      ? <div className="h-9 w-16 rounded-lg animate-pulse bg-white/5 mt-1" />
                      : <p className={`text-3xl font-extrabold ${textClass}`}>{value}</p>
                    }
                    <p className="text-xs text-white/25 mt-1">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CHARTS ROW ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

              {/* Bar chart */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[15px] font-extrabold text-white m-0">Cases Over Time</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Monthly case volume · Last 6 months</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/8 border border-cyan-500/15 text-cyan-400 text-[11px] font-bold">
                    <TrendingUp size={12} /> Live
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
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(34,211,238,0.04)", radius: 8 }} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-6 shadow-xl">
                <div className="mb-5">
                  <p className="text-[15px] font-extrabold text-white m-0">Priority Split</p>
                  <p className="text-[11px] text-white/30 mt-0.5">Case urgency breakdown</p>
                </div>
                {loading ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-[3px] border-cyan-500/10 border-t-cyan-400 animate-spin" />
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
                    <div className="flex flex-col gap-2 mt-1">
                      {priorityChartData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-[12px] text-white/50 font-semibold">
                            <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                            {d.name}
                          </span>
                          <span className="text-[13px] font-extrabold" style={{ color: d.fill }}>{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── CASE STATUS OVERVIEW ─────────────────────── */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-6 shadow-xl">
              <div className="mb-5">
                <p className="text-[15px] font-extrabold text-white m-0">Case Status Overview</p>
                <p className="text-[11px] text-white/30 mt-0.5">Distribution across all statuses</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(CASE_STATUS_META).map(([key, meta]) => {
                  const count = cases.filter((c) => c.status === key).length;
                  const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                  return (
                    <div key={key} className={`rounded-2xl p-4 ${meta.twClass.split(" ")[0]} border border-white/10`}>
                      <p className={`text-2xl font-extrabold ${meta.twClass.split(" ")[1]} m-0`}>
                        {loading ? "—" : count}
                      </p>
                      <p className="text-[10px] text-white/35 font-bold mt-1.5 mb-2.5 uppercase tracking-wider leading-tight">{meta.label}</p>
                      <div className="h-1 rounded-full bg-white/10">
                        <div className={`h-full rounded-full transition-all duration-1000 ${meta.twClass.split(" ")[0].replace("/20", "/60")}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-white/20 mt-1 font-semibold">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RECENT CASES TABLE ───────────────────────── */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Recent Cases</h2>
                  <p className="text-sm text-white/40">
                    {caseSearch ? `${recentCases.length} result${recentCases.length !== 1 ? "s" : ""} found` : "Latest 6 cases"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                      placeholder="Search cases..."
                      className="w-full rounded-2xl py-2.5 pl-9 pr-8 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                    />
                    {caseSearch && (
                      <button onClick={() => setCaseSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleNav("cases", "/admin/cases")}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all whitespace-nowrap"
                  >
                    View all <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Case No.", "Officer", "Priority", "Location", "Status", "Created"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentCases.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-14 text-center text-white/40">
                            {caseSearch ? `No cases match "${caseSearch}"` : "No cases found"}
                          </td>
                        </tr>
                      ) : recentCases.map((c) => {
                        const sm = CASE_STATUS_META[c.status] || { label: c.status, twClass: "bg-white/10 text-white/40" };
                        const pm = PRIORITY_META[c.priority];
                        return (
                          <tr key={c._id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">
                                {c.caseNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/60">{c.assignedOfficer || "—"}</td>
                            <td className="px-4 py-3">
                              {pm ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: pm.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ background: pm.color }} />
                                  {c.priority}
                                </span>
                              ) : <span className="text-white/30 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-xs text-white/40">
                                <MapPin size={10} />
                                <span className="max-w-[120px] truncate">{c.locationName || "—"}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${sm.twClass}`}>
                                {sm.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-white/30 font-semibold">{fmtDate(c.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── RECENT REPORTS TABLE ─────────────────────── */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Recent Reports</h2>
                  <p className="text-sm text-white/40">Latest 5 incident reports submitted</p>
                </div>
                <button
                  onClick={() => handleNav("reports", "/admin/reports")}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all whitespace-nowrap"
                >
                  View all <ChevronRight size={13} />
                </button>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Incident Type", "Reported By", "Description", "Status", "Date"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-14 text-center text-white/40">No reports found</td>
                        </tr>
                      ) : recentReports.map((r) => {
                        const sc = REPORT_STATUS_META[r.status] || REPORT_STATUS_META.Pending;
                        return (
                          <tr key={r._id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400">
                                {r.incidentType}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-white/80 font-medium m-0">
                                {r.reportedBy?.firstName} {r.reportedBy?.lastName}
                              </p>
                              <p className="text-xs text-white/35 m-0">{r.reportedBy?.email}</p>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <p className="text-sm text-white/50 truncate m-0">{r.description}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-white/30 font-semibold">{fmtDate(r.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── RECENT USERS + QUICK OVERVIEW ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Recent users */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[15px] font-extrabold text-white m-0">Recent Users</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{totalUsers} total registered</p>
                  </div>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Users size={15} className="text-cyan-400" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {loading ? (
                    [...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />)
                  ) : recentUsers.length === 0 ? (
                    <p className="text-white/20 text-xs text-center py-4">No users found</p>
                  ) : recentUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border border-white/10 flex items-center justify-center text-xs font-extrabold text-cyan-400 flex-shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white m-0 truncate">{u.firstName} {u.lastName}</p>
                        <p className="font-mono text-[10px] text-white/25 m-0">{u.uid}</p>
                      </div>
                      {u.isBlocked ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                          <UserX size={9} /> Blocked
                        </span>
                      ) : u.isAdmin ? (
                        <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                          <Shield size={9} /> Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle size={9} /> Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick overview */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
                <div>
                  <p className="text-[15px] font-extrabold text-white m-0">Quick Overview</p>
                  <p className="text-[11px] text-white/30 mt-0.5">System performance metrics</p>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { label: "Case Resolution Rate",  value: totalCases > 0   ? Math.round((closedCases    / totalCases)   * 100) : 0, color: "#34d399" },
                    { label: "High Priority Rate",    value: totalCases > 0   ? Math.round((highPriority   / totalCases)   * 100) : 0, color: "#f87171" },
                    { label: "Report Resolution Rate",value: totalReports > 0 ? Math.round((resolvedReports/ totalReports) * 100) : 0, color: "#22d3ee" },
                    { label: "User Blocked Rate",     value: totalUsers > 0   ? Math.round((blockedUsers   / totalUsers)   * 100) : 0, color: "#fbbf24" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-white/45 font-semibold">{item.label}</span>
                        <span className="text-[13px] font-extrabold" style={{ color: item.color }}>
                          {loading ? "—" : `${item.value}%`}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: loading ? "0%" : `${item.value}%`, background: item.color, boxShadow: `0 0 10px ${item.color}50` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleNav("cases", "/admin/cases")}
                    className="py-2.5 rounded-2xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Briefcase size={13} /> Manage Cases
                  </button>
                  <button
                    onClick={() => handleNav("reports", "/admin/reports")}
                    className="py-2.5 rounded-2xl text-xs font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText size={13} /> View Reports
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}