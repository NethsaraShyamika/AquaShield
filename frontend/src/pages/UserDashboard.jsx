import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import EditProfile from "./EditProfile";
import {
  Fish, Shield, FileText, Search, MapPin, ChevronRight,
  LogOut, User, AlertTriangle, Clock, CheckCircle, X,
  Home, List, Eye, Scale,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

// ─── CONSTANTS ────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending:        { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.35)",  text: "#fbbf24", tw: "bg-yellow-500/20 text-yellow-400"  },
  "Under Review": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa", tw: "bg-blue-500/20 text-blue-400"      },
  Verified:       { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)", text: "#2dd4bf", tw: "bg-teal-500/20 text-teal-400"      },
  Dismissed:      { bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.35)",  text: "#fb7185", tw: "bg-red-500/20 text-red-400"        },
  Resolved:       { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  text: "#4ade80", tw: "bg-green-500/20 text-green-400"    },
};

const statusStageMap = { Pending: 1, "Under Review": 2, Verified: 3, Resolved: 4, Dismissed: 4 };

const BODY_SHAPES           = ["torpedo", "oval", "flat", "eel-like", "box-like"];
const IDENTIFY_BODY_SHAPES  = ["Fusiform", "Compressiform", "Depressiform", "Anguilliform", "Sagittiform"];
const TAIL_SHAPES           = ["crescent", "forked", "rounded", "square", "pointed"];
const INCIDENT_TYPES        = [
  "Illegal Net Fishing", "Dynamite Fishing", "Cyanide Fishing",
  "Trawling in Protected Zone", "Catching Protected Species",
  "Night Fishing Violation", "Other",
];

const BODY_SHAPE_REFERENCES = {
  Fusiform:       { description: "Streamlined, spindle-shaped body. Pointed at both ends, widens in the middle.", image: "/fusiform-reference.png" },
  Compressiform:  { description: "Flattened side-to-side, like a pancake. High and narrow body.",                image: "/compressiform-reference.png" },
  Depressiform:   { description: "Flattened top to bottom, like a stingray. Wide and flat body.",                image: "/depressiform-reference.png" },
  Anguilliform:   { description: "Snake-like, elongated and thin. Wavy, sinuous body.",                          image: "/anguilliform-reference.png" },
  Sagittiform:    { description: "Arrow-shaped body. Pointed head with triangular tail.",                        image: "/sagittiform-reference.png" },
};

const TAIL_SHAPE_REFERENCES = {
  Rounded: { description: "Rounded tail shape with a smooth, curved edge.",    image: "/rounded-tail-reference.png"  },
  Crescent:{ description: "Crescent tail shape with a curved, moon-like edge.",image: "/crescent-tail-reference.png" },
  Forked:  { description: "Forked tail shape with a split end.",                image: "/forked-tail-reference.png"   },
  Square:  { description: "Square tail shape with a straight, flat end.",       image: "/square-tail-reference.png"   },
  Pointed: { description: "Pointed tail shape with a narrow, sharp end.",       image: "/pointed-tail-reference.png"  },
};

// ─── HELPERS ─────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function tokenFromStorage() {
  const keys = ["token", "authToken", "accessToken", "jwt"];
  for (const key of keys) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (token) {
      let n = token.trim();
      if (n.startsWith("Bearer ")) n = n.slice(7).trim();
      if ((n.startsWith('"') && n.endsWith('"')) || (n.startsWith("'") && n.endsWith("'"))) n = n.slice(1, -1);
      return n;
    }
  }
  return "";
}

function decodeJwtPayload(token) {
  try {
    const p = token.split(".")[1];
    if (!p) return null;
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

async function fetchJson(path, token) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function toTitleCase(value) {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeIdentifyShape(value)   { return String(value || "").trim().toLowerCase(); }
function normalizeSpeciesBodyShape(value) {
  const s = normalizeIdentifyShape(value);
  if (!s) return "";
  if (s === "torpedo" || s === "fusiform")       return "fusiform";
  if (s === "oval"    || s === "compressiform")  return "compressiform";
  if (s === "flat"    || s === "depressiform")   return "depressiform";
  if (s === "eel-like"|| s === "anguilliform")   return "anguilliform";
  if (s === "sagittiform")                       return "sagittiform";
  return s;
}

function formatBodyShapeLabel(value) {
  const n = normalizeSpeciesBodyShape(value);
  if (!n) return "Unknown";
  const map = { fusiform:"Fusiform", compressiform:"Compressiform", depressiform:"Depressiform", anguilliform:"Anguilliform", sagittiform:"Sagittiform" };
  return map[n] || (String(value||"").trim() || "Unknown");
}

function toSpeciesKey(item) {
  return String(item?._id || item?.id || item?.scientificName || item?.name || "");
}

function formatMonthRange(legalSeason) {
  if (!legalSeason?.startMonth || !legalSeason?.endMonth) return "Not specified";
  const monthName = (m) => new Date(2000, m - 1, 1).toLocaleString(undefined, { month: "long" });
  return `${monthName(legalSeason.startMonth)} – ${monthName(legalSeason.endMonth)}`;
}

function resolveSpeciesImageUrl(item) {
  const raw = item?.image;
  if (!raw) return "";
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]" || trimmed === "{}") return "";
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try { value = JSON.parse(trimmed); } catch { value = trimmed; }
    } else { value = trimmed; }
  }
  if (Array.isArray(value)) { const first = value.find(Boolean); value = first || ""; }
  if (value && typeof value === "object") value = value.url || value.secure_url || value.path || "";
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:image")) return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
}

// ─── STATUS BADGE ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const sc = STATUS_COLORS[status];
  if (!sc) return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/40">{status}</span>;
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
      {status}
    </span>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────
function StageProgress({ stage }) {
  return (
    <div className="mt-3">
      <div className="w-full h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
          style={{ width: `${(stage / 4) * 100}%` }} />
      </div>
      <p className="text-[10px] text-white/30 mt-1 font-semibold">Step {stage} of 4</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD HOME VIEW
// ─────────────────────────────────────────────────────────────
function DashboardHome({
  firstName, isLoading, reportCount, underReviewCount, identifiedSpeciesCount,
  recentReports, protectedSpecies, topMatch, last30DaysIncidents,
  onOpenComplaintModal, onOpenIdentifyView, onViewMyReports, onViewReportForm, onViewMyCases,
  isProfileMenuOpen, onToggleProfileMenu, onViewProfile, onLogout, profileMenuRef,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── TOPBAR ──────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] border-b border-white/10">
          <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                <Fish size={16} className="text-cyan-400" />
              </div>
              <span className="text-sm font-extrabold text-white">AquaShield</span>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Home",           icon: Home,     action: null,               active: true  },
                { label: "My Reports",     icon: List,     action: onViewMyReports,    active: false },
                { label: "My Cases",       icon: Scale,    action: onViewMyCases,       active: false },
                { label: "Identify Fish",  icon: Search,      action: onOpenIdentifyView, active: false },
                
              ].map(({ label, icon: Icon, action, active }) => (
                <button key={label} type="button" onClick={action}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-cyan-500/15 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onViewReportForm}
                className="hidden sm:inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_8px_20px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all">
                <FileText size={14} /> Create Report
              </button>

              {/* Profile */}
              <div className="relative" ref={profileMenuRef}>
                <button type="button" onClick={onToggleProfileMenu} aria-label="Profile menu"
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-sm font-extrabold text-cyan-400 hover:from-cyan-500/30 hover:to-blue-600/30 transition-all">
                  {(firstName?.charAt(0) || "U").toUpperCase()}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-11 w-44 bg-[rgba(6,15,30,0.97)] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all text-left">
                      <User size={14} /> View Profile
                    </button>
                    <div className="border-t border-white/10" />
                    <button type="button" onClick={onLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-left">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── HERO ────────────────────────────────────────── */}
        <section className="max-w-[1180px] mx-auto px-6 pt-10 pb-8 w-full ">
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-8 py-8 shadow-xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-4">
              <Shield size={20} /> AquaShield
            </div>
            <h1 className="text-cyan-400/70 text-sm font-semibold mb-1">Good morning, {firstName}</h1>
            <h1 className="text-[32px] font-extrabold tracking-tight text-white leading-tight mb-2">
              Protect Sri Lanka's Ocean Species
            </h1>
            <p className="text-white/40 text-sm mb-6">Report illegal fishing or identify a species in seconds.</p>
            <div className="flex flex-wrap flex-col sm:flex-row items-center justify-center gap-8">
              <button type="button" onClick={onViewReportForm}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all">
                <FileText size={15} /> Create Report
              </button>
              <button type="button" onClick={onOpenIdentifyView}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">
                <Fish size={15} /> Identify Species
              </button>

            </div>
          </div>
        </section>

        {/* ── MAIN GRID ───────────────────────────────────── */}
        <div className="max-w-[1180px] mx-auto px-6 pb-10 w-full flex flex-col gap-6">

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: FileText,    label: "Reports Filed",      value: reportCount,             sub: reportCount > 0 ? "3 resolved" : "No reports yet",   iconClass: "bg-cyan-500/20 border-cyan-500/30",   textClass: "text-cyan-400"   },
              { icon: Clock,       label: "Under Review",       value: underReviewCount,        sub: underReviewCount > 0 ? "1 escalated" : "All cleared", iconClass: "bg-amber-500/20 border-amber-500/30", textClass: "text-amber-400"  },
              { icon: Fish,        label: "Species Identified", value: identifiedSpeciesCount,  sub: "Via reports submitted",                             iconClass: "bg-blue-500/20 border-blue-500/30",   textClass: "text-blue-400"   },
            ].map(({ icon: Icon, label, value, sub, iconClass, textClass }) => (
              <div key={label} className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-3 ${iconClass}`}>
                  <Icon size={18} className={textClass} />
                </div>
                <p className="text-sm text-white/40">{label}</p>
                {isLoading
                  ? <div className="h-9 w-12 rounded-lg animate-pulse bg-white/5 mt-1" />
                  : <p className={`text-3xl font-extrabold ${textClass}`}>{value}</p>
                }
                <p className="text-xs text-white/25 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* Left: Recent reports */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Recent Reports</h2>
                  <p className="text-sm text-white/40">Your latest submitted reports</p>
                </div>
                <button type="button" onClick={onViewMyReports}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all">
                  View all <ChevronRight size={12} />
                </button>
              </div>

              {recentReports.length === 0 && !isLoading ? (
                <div className="px-6 py-14 text-center text-white/40 text-sm">No reports submitted yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentReports.map((report) => {
                    const stage = statusStageMap[report.status] || 1;
                    const sc    = STATUS_COLORS[report.status];
                    return (
                      <div key={report._id} className="px-6 py-4 hover:bg-white/5 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-sm font-bold text-white">{report.incidentType}</h3>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-xs text-white/40 mb-0.5">Filed {formatDate(report.createdAt)}</p>
                        <p className="text-xs text-white/50">{report.speciesInvolved?.[0]?.name || "Species unidentified"}</p>
                        <StageProgress stage={stage} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Quick Identifier */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white">Quick Fish Identifier</h2>
                    <p className="text-xs text-white/40 mt-0.5">Narrow the match by shape</p>
                  </div>
                  <button type="button" onClick={onOpenIdentifyView}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all">
                    Full tool
                  </button>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-white mb-0.5">{topMatch?.name || "No species selected"}</h3>
                  <p className="text-xs text-white/40 mb-3 italic">{topMatch?.scientificName || "Adjust filters to find species."}</p>
                  <button type="button" onClick={onOpenIdentifyView}
                    className="w-full py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-105 transition-all">
                    Identify Species
                  </button>
                  <p className="text-[10px] text-white/25 text-center mt-2">Pick body & tail shape to narrow results</p>
                </div>
              </div>

              {/* Protected species */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-5 shadow-xl">
                <h2 className="text-base font-extrabold text-white mb-4">Protected Species Nearby</h2>
                <div className="flex flex-col gap-2">
                  {protectedSpecies.map((item) => (
                    <div key={item._id || item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                        <p className="text-xs text-white/35 italic truncate">{item.scientificName}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                        item.isFullyBanned ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {item.isFullyBanned ? "Banned" : item.protectionStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident map */}
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-5 shadow-xl">
                <h2 className="text-base font-extrabold text-white mb-3">Incident Map</h2>
                <div className="rounded-2xl border border-white/10 bg-cyan-500/5 px-5 py-6 text-center">
                  <MapPin size={24} className="text-cyan-400/50 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{last30DaysIncidents}</p>
                  <p className="text-xs text-white/40 mt-1">incidents near you</p>
                  <p className="text-[10px] text-white/20 mt-0.5">Sri Lanka · last 30 days</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IDENTIFY VIEW
// ─────────────────────────────────────────────────────────────
// ...existing code...
import IdentifyView from "./IdentifyView";

// ─────────────────────────────────────────────────────────────
// REPORT MODAL
// ─────────────────────────────────────────────────────────────
function ReportModal({
  speciesCatalog, complaintForm, updateComplaintField,
  complaintGuess, updateComplaintGuess, complaintEvidence, updateComplaintEvidence,
  complaintStatus, submitComplaint, closeComplaintModal, setCurrentLocation,
  guessedSpeciesMatches,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[rgba(6,15,30,0.97)] border border-white/20 rounded-3xl shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-2">
                <AlertTriangle size={12} /> New Report
              </div>
              <h2 className="text-xl font-extrabold text-white">Create Illegal Fish Report</h2>
            </div>
            <button type="button" onClick={closeComplaintModal}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={submitComplaint} className="flex flex-col gap-4">

            {/* Incident type */}
            <div>
              <label className="block text-xs font-semibold text-cyan-400/80 mb-1.5 uppercase tracking-widest">Incident Type</label>
              <select value={complaintForm.incidentType} onChange={(e) => updateComplaintField("incidentType", e.target.value)}
                className="w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 appearance-none">
                {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-cyan-400/80 mb-1.5 uppercase tracking-widest">Description</label>
              <textarea rows={4} minLength={20} required
                placeholder="Describe what happened, vessel type, time, and severity…"
                value={complaintForm.description} onChange={(e) => updateComplaintField("description", e.target.value)}
                className="w-full rounded-2xl py-2.5 px-3 text-sm outline-none resize-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Latitude",  field: "latitude",  placeholder: "6.9271"  },
                { label: "Longitude", field: "longitude", placeholder: "79.8612" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-cyan-400/80 mb-1.5 uppercase tracking-widest">{label}</label>
                  <input type="number" step="any" required placeholder={placeholder}
                    value={complaintForm[field]} onChange={(e) => updateComplaintField(field, e.target.value)}
                    className="w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" />
                </div>
              ))}
            </div>

            {/* Date + Species */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cyan-400/80 mb-1.5 uppercase tracking-widest">Incident Date</label>
                <input type="datetime-local" value={complaintForm.incidentDate} onChange={(e) => updateComplaintField("incidentDate", e.target.value)}
                  className="w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cyan-400/80 mb-1.5 uppercase tracking-widest">Species (optional)</label>
                <select value={complaintForm.speciesId} onChange={(e) => updateComplaintField("speciesId", e.target.value)}
                  className="w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 appearance-none">
                  <option value="">Not sure</option>
                  {speciesCatalog.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>

            {/* Species helper */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-bold text-white mb-0.5">Not sure which species?</p>
              <p className="text-xs text-white/40 mb-3">Filter by body and tail shape to find likely species.</p>
              {[
                { label: "Body Shape", field: "bodyShape", shapes: BODY_SHAPES },
                { label: "Tail Shape", field: "tailShape", shapes: TAIL_SHAPES },
              ].map(({ label, field, shapes }) => (
                <div key={field} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {shapes.map((shape) => (
                      <button key={shape} type="button" onClick={() => updateComplaintGuess(field, shape)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                          complaintGuess[field] === shape
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                            : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                        }`}>
                        {toTitleCase(shape)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {guessedSpeciesMatches.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {guessedSpeciesMatches.map((item) => {
                    const selected = complaintForm.speciesId === (item._id || item.id);
                    return (
                      <button key={item._id || item.id} type="button" onClick={() => updateComplaintField("speciesId", item._id || item.id)}
                        className={`flex flex-col px-3 py-2 rounded-xl text-left transition-all ${
                          selected
                            ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-400"
                            : "bg-white/[0.03] border border-white/10 text-white/60 hover:bg-white/[0.06]"
                        }`}>
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[10px] italic opacity-60">{item.scientificName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {guessedSpeciesMatches.length === 0 && (complaintGuess.bodyShape || complaintGuess.tailShape) && (
                <p className="text-xs text-white/25 mt-2">No species matches for this shape combination.</p>
              )}
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-xs font-semibold text-cyan-400/80 mb-1.5 uppercase tracking-widest">Evidence (optional, up to 5 files)</label>
              <input type="file" multiple accept="image/*,video/*" onChange={(e) => updateComplaintEvidence(e.target.files)}
                className="w-full rounded-2xl py-2.5 px-3 text-sm bg-white/5 border border-white/10 text-white/60 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 cursor-pointer" />
              <p className="text-xs text-white/30 mt-1.5">
                {complaintEvidence.length > 0 ? `Selected: ${complaintEvidence.map((f) => f.name).join(", ")}` : "No evidence selected."}
              </p>
            </div>

            {complaintStatus.error && (
              <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{complaintStatus.error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeComplaintModal}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button type="button" onClick={setCurrentLocation}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all">
                📍 My Location
              </button>
              <button type="submit" disabled={complaintStatus.loading}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all disabled:opacity-70">
                {complaintStatus.loading ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut]       = useState(false);
  const [activeView, setActiveView]           = useState("dashboard");
  const [reports, setReports]                 = useState([]);
  const [speciesCatalog, setSpeciesCatalog]   = useState([]);
  const [identifierResult, setIdentifierResult] = useState([]);
  const [filters, setFilters]                 = useState({ bodyShape: "torpedo", tailShape: "crescent" });
  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState("");
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState({ loading: false, error: "", success: "" });
  const [complaintEvidence, setComplaintEvidence] = useState([]);
  const [complaintGuess, setComplaintGuess]   = useState({ bodyShape: "", tailShape: "" });
  const [complaintForm, setComplaintForm]     = useState({
    incidentType: INCIDENT_TYPES[0], description: "", latitude: "", longitude: "",
    incidentDate: new Date().toISOString().slice(0, 16), speciesId: "",
  });
  const [identifyQuery, setIdentifyQuery]             = useState("");
  const [identifyBodyShape, setIdentifyBodyShape]     = useState("");
  const [identifyTailShape, setIdentifyTailShape]     = useState("");
  const [selectedIdentifySpeciesId, setSelectedIdentifySpeciesId] = useState("");
  const [brokenIdentifyImages, setBrokenIdentifyImages] = useState({});
  const [isProfileMenuOpen, setIsProfileMenuOpen]     = useState(false);
  const [showEditProfile, setShowEditProfile]         = useState(false);
  const profileMenuRef = useRef(null);

  const [token, setToken] = useState(() => tokenFromStorage());
  const userPayload = useMemo(() => decodeJwtPayload(token), [token]);
  const firstName   = userPayload?.firstName || "Fisher";

  useEffect(() => {
    if (!token || !userPayload) navigate("/login", { replace: true });
  }, [token, userPayload, navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);
    }
    if (isProfileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true); setError("");
    try {
      const speciesData = await fetchJson("/species", token);
      setSpeciesCatalog(Array.isArray(speciesData) ? speciesData : []);
      if (token) {
        const reportsData = await fetchJson("/reports/my", token);
        setReports(Array.isArray(reportsData?.reports) ? reportsData.reports : []);
      } else { setReports([]); }
    } catch (e) {
      setError(e.message || "Unable to load dashboard data.");
    } finally { setIsLoading(false); }
  }, [token]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const params = new URLSearchParams(filters);
      try {
        const data = await fetchJson(`/species/find?${params.toString()}`, token);
        if (!ignore) setIdentifierResult(Array.isArray(data?.species) ? data.species : []);
      } catch { if (!ignore) setIdentifierResult([]); }
    })();
    return () => { ignore = true; };
  }, [filters, token]);

  // Computed
  const reportCount             = reports.length;
  const underReviewCount        = reports.filter((r) => ["Pending", "Under Review"].includes(r.status)).length;
  const identifiedSpeciesCount  = useMemo(() => {
    const s = new Set();
    reports.forEach((r) => (r.speciesInvolved || []).forEach((e) => { const id = e?._id || e?.id || e; if (id) s.add(id); }));
    return s.size;
  }, [reports]);
  const recentReports           = reports.slice(0, 3);
  const protectedSpecies        = useMemo(() => speciesCatalog.filter((i) => ["Protected", "Endangered", "Critically Endangered", "Banned"].includes(i.protectionStatus)).slice(0, 3), [speciesCatalog]);
  const last30DaysIncidents     = useMemo(() => { const t = Date.now() - 30*24*60*60*1000; return reports.filter((r) => new Date(r.createdAt).getTime() >= t).length; }, [reports]);
  const topMatch                = identifierResult[0];

  const identifyMatches = useMemo(() => {
    const query  = identifyQuery.trim().toLowerCase();
    const selBody = normalizeSpeciesBodyShape(identifyBodyShape);
    const selTail = normalizeIdentifyShape(identifyTailShape);
    return speciesCatalog.filter((item) => {
      if (selBody && normalizeSpeciesBodyShape(item.bodyShape) !== selBody) return false;
      if (selTail && normalizeIdentifyShape(item.tailShape) !== selTail) return false;
      if (!query) return true;
      return (item.name||"").toLowerCase().includes(query) || (item.scientificName||"").toLowerCase().includes(query);
    }).slice(0, 18);
  }, [identifyBodyShape, identifyTailShape, identifyQuery, speciesCatalog]);

  const identifyFilterSummary = useMemo(() => {
    const parts = [];
    if (identifyBodyShape) parts.push(`Body: ${identifyBodyShape}`);
    if (identifyTailShape) parts.push(`Tail: ${toTitleCase(identifyTailShape)}`);
    return parts.join(" • ");
  }, [identifyBodyShape, identifyTailShape]);

  const selectedIdentifySpecies = useMemo(() => {
    if (!selectedIdentifySpeciesId) return null;
    return identifyMatches.find((item) => toSpeciesKey(item) === selectedIdentifySpeciesId) || null;
  }, [identifyMatches, selectedIdentifySpeciesId]);

  useEffect(() => {
    if (identifyMatches.length === 0) { setSelectedIdentifySpeciesId(""); return; }
    if (!identifyMatches.some((item) => toSpeciesKey(item) === selectedIdentifySpeciesId)) setSelectedIdentifySpeciesId(toSpeciesKey(identifyMatches[0]));
  }, [identifyMatches, selectedIdentifySpeciesId]);

  const identifySuggestions = useMemo(() => {
    const query = identifyQuery.trim().toLowerCase();
    if (!query) return [];
    return speciesCatalog.filter((item) => (item.name||"").toLowerCase().includes(query) || (item.scientificName||"").toLowerCase().includes(query))
      .sort((a, b) => {
        const aS = (a.name||"").toLowerCase().startsWith(query) ? 0 : 1;
        const bS = (b.name||"").toLowerCase().startsWith(query) ? 0 : 1;
        return aS !== bS ? aS - bS : (a.name||"").localeCompare(b.name||"");
      }).slice(0, 6);
  }, [identifyQuery, speciesCatalog]);

  const guessedSpeciesMatches = useMemo(() => {
    const byBody = complaintGuess.bodyShape ? speciesCatalog.filter((i) => i.bodyShape === complaintGuess.bodyShape) : speciesCatalog;
    return (complaintGuess.tailShape ? byBody.filter((i) => i.tailShape === complaintGuess.tailShape) : byBody).slice(0, 6);
  }, [complaintGuess, speciesCatalog]);

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsProfileMenuOpen(false);
    ["token","authToken","accessToken","jwt","user","userData","role"].forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    localStorage.clear(); sessionStorage.clear();
    document.cookie.split(";").forEach((c) => { const n = c.indexOf("=") > -1 ? c.slice(0, c.indexOf("=")).trim() : c.trim(); if (n) document.cookie = `${n}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`; });
    fetch(`${API_BASE_URL}/users/logout`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include", keepalive: true }).catch(() => {});
    navigate("/login", { replace: true });
    window.location.replace("/login");
  };

  const updateComplaintField    = (field, value) => setComplaintForm((p) => ({ ...p, [field]: value }));
  const updateComplaintGuess    = (field, value) => setComplaintGuess((p) => ({ ...p, [field]: value }));
  const updateComplaintEvidence = (files) => setComplaintEvidence(Array.from(files || []).slice(0, 5));
  const setCurrentLocation      = () => {
    if (!navigator.geolocation) { setComplaintStatus((p) => ({ ...p, error: "Geolocation not available." })); return; }
    setComplaintStatus((p) => ({ ...p, error: "", success: "" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setComplaintForm((p) => ({ ...p, latitude: String(pos.coords.latitude.toFixed(6)), longitude: String(pos.coords.longitude.toFixed(6)) })),
      () => setComplaintStatus((p) => ({ ...p, error: "Unable to fetch location. Please enter manually." }))
    );
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    if (complaintForm.description.trim().length < 20) { setComplaintStatus({ loading: false, error: "Description must be at least 20 characters.", success: "" }); return; }
    if (!complaintForm.latitude || !complaintForm.longitude) { setComplaintStatus({ loading: false, error: "Location coordinates are required.", success: "" }); return; }
    setComplaintStatus({ loading: true, error: "", success: "" });
    const fd = new FormData();
    fd.append("incidentType",  complaintForm.incidentType);
    fd.append("description",   complaintForm.description.trim());
    fd.append("latitude",      complaintForm.latitude.trim());
    fd.append("longitude",     complaintForm.longitude.trim());
    if (complaintForm.incidentDate) fd.append("incidentDate", new Date(complaintForm.incidentDate).toISOString());
    if (complaintForm.speciesId)    fd.append("speciesInvolved", JSON.stringify([complaintForm.speciesId]));
    complaintEvidence.forEach((file) => fd.append("evidence", file));
    try {
      const res = await fetch(`${API_BASE_URL}/reports`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      let payload = null; try { payload = await res.json(); } catch {}
      if (!res.ok) throw new Error(payload?.message || "Failed to submit report.");
      setComplaintStatus({ loading: false, error: "", success: "Report submitted successfully." });
      setComplaintForm({ incidentType: INCIDENT_TYPES[0], description: "", latitude: "", longitude: "", incidentDate: new Date().toISOString().slice(0, 16), speciesId: "" });
      setComplaintGuess({ bodyShape: "", tailShape: "" });
      setComplaintEvidence([]);
      setIsComplaintOpen(false);
      await loadDashboardData();
    } catch (e) {
      setComplaintStatus({ loading: false, error: e.message || "Failed to submit report.", success: "" });
    }
  };

  return (
    <main>
      {/* EditProfile Modal */}
      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} onUpdated={(u) => { 
          console.log("Profile updated:", u); 
          setToken(tokenFromStorage()); 
          setShowEditProfile(false); 
        }} />
      )}

      {/* Banners */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm shadow-2xl backdrop-blur-xl">
          <AlertTriangle size={14} className="inline mr-2" />{error}
        </div>
      )}
      {complaintStatus.success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm shadow-2xl backdrop-blur-xl">
          <CheckCircle size={14} className="inline mr-2" />{complaintStatus.success}
        </div>
      )}

      {activeView === "dashboard" && (
        <DashboardHome
          firstName={firstName}
          isLoading={isLoading}
          reportCount={reportCount}
          underReviewCount={underReviewCount}
          identifiedSpeciesCount={identifiedSpeciesCount}
          recentReports={recentReports}
          protectedSpecies={protectedSpecies}
          topMatch={topMatch}
          last30DaysIncidents={last30DaysIncidents}
          onOpenComplaintModal={() => { setComplaintStatus({ loading: false, error: "", success: "" }); setIsComplaintOpen(true); }}
          onOpenIdentifyView={() => setActiveView("identify")}
          onViewMyReports={() => navigate("/my-reports")}
          onViewReportForm={() => navigate("/report-form")}
          onViewMyCases={() => navigate("/my-cases")}
          isProfileMenuOpen={isProfileMenuOpen}
          onToggleProfileMenu={() => setIsProfileMenuOpen((p) => !p)}
          onViewProfile={() => { setIsProfileMenuOpen(false); setShowEditProfile(true); }}
          onLogout={handleLogout}
          profileMenuRef={profileMenuRef}
        />
      )}

      {activeView === "identify" && (
        <IdentifyView
          speciesCatalog={speciesCatalog}
          identifyQuery={identifyQuery}             setIdentifyQuery={setIdentifyQuery}
          identifyBodyShape={identifyBodyShape}     setIdentifyBodyShape={setIdentifyBodyShape}
          identifyTailShape={identifyTailShape}     setIdentifyTailShape={setIdentifyTailShape}
          identifyMatches={identifyMatches}
          identifyFilterSummary={identifyFilterSummary}
          identifySuggestions={identifySuggestions}
          selectedIdentifySpeciesId={selectedIdentifySpeciesId}
          setSelectedIdentifySpeciesId={setSelectedIdentifySpeciesId}
          selectedIdentifySpecies={selectedIdentifySpecies}
          brokenIdentifyImages={brokenIdentifyImages}
          setBrokenIdentifyImages={setBrokenIdentifyImages}
          onBack={() => setActiveView("dashboard")}
        />
      )}

      {activeView === "dashboard" && isComplaintOpen && (
        <ReportModal
          speciesCatalog={speciesCatalog}
          complaintForm={complaintForm}         updateComplaintField={updateComplaintField}
          complaintGuess={complaintGuess}       updateComplaintGuess={updateComplaintGuess}
          complaintEvidence={complaintEvidence} updateComplaintEvidence={updateComplaintEvidence}
          complaintStatus={complaintStatus}
          submitComplaint={submitComplaint}
          closeComplaintModal={() => { if (complaintStatus.loading) return; setIsComplaintOpen(false); }}
          setCurrentLocation={setCurrentLocation}
          guessedSpeciesMatches={guessedSpeciesMatches}
        />
      )}
    </main>
  );
}