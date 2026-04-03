// ─────────────────────────────────────────────────────────────
// CaseManagement.jsx — AquaShield
// FIXES:
//   ✅ Robust API response unwrapping (handles array / {reports} / {data} / {success,reports})
//   ✅ Reports refresh every time Create modal opens (always fresh)
//   ✅ Location auto-fills from selected report coordinates
//   ✅ Report dropdown shows loading state
//   ✅ Shows how many reports are available
//   ✅ Manual refresh button inside modal
//   ✅ Console debug logs to help diagnose any remaining issues
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  Search, Filter, Eye, Pencil, Trash2, X, ChevronDown,
  MapPin, User, Calendar, Gavel, AlertTriangle, CheckCircle,
  Clock, Shield, FileText, Loader2, RefreshCw, ChevronLeft,
  ChevronRight, Scale, BadgeAlert, CircleDot, XCircle, Waves,
  Plus, Hash, ClipboardList, Lock,
} from "lucide-react";

// ─── API CONFIG ───────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const getUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
};

// ─── SMART ARRAY EXTRACTOR ────────────────────────────────────
// Handles any backend response shape:
//   • Plain array:              [...]
//   • { reports: [...] }
//   • { data: [...] }
//   • { success: true, reports: [...] }
//   • { success: true, data: [...] }
//   • { cases: [...] }
const extractArray = (res, hints = []) => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    // Try caller-supplied hints first (e.g. "reports", "cases")
    for (const key of hints) {
      if (Array.isArray(res[key])) return res[key];
    }
    // Generic fallback — first array-valued key wins
    for (const key of Object.keys(res)) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return null; // nothing usable found
};

const api = {
  getCases:   ()      => fetch(`${API_BASE}/cases`,       { headers: authHeader() }).then(r => r.json()),
  getReports: ()      => fetch(`${API_BASE}/reports`,     { headers: authHeader() }).then(r => r.json()),
  createCase: (data)  => fetch(`${API_BASE}/cases`,       { method: "POST",   headers: authHeader(), body: JSON.stringify(data) }).then(r => r.json()),
  updateCase: (id, d) => fetch(`${API_BASE}/cases/${id}`, { method: "PUT",    headers: authHeader(), body: JSON.stringify(d)    }).then(r => r.json()),
  deleteCase: (id)    => fetch(`${API_BASE}/cases/${id}`, { method: "DELETE", headers: authHeader() }).then(r => r.json()),
};

// ─── CONSTANTS ────────────────────────────────────────────────
const STATUS_META = {
  OPEN:                 { label: "Open",             icon: CircleDot,   color: "#22d3ee", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.25)"  },
  UNDER_INVESTIGATION:  { label: "Investigating",    icon: Search,      color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)"  },
  LEGAL_ACTION_STARTED: { label: "Legal Action",     icon: Scale,       color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  COURT_PROCEEDING:     { label: "Court Proceeding", icon: Gavel,       color: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.25)" },
  CLOSED:               { label: "Closed",           icon: CheckCircle, color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)"  },
  REJECTED:             { label: "Rejected",         icon: XCircle,     color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
};

const PRIORITY_META = {
  HIGH:   { color: "#f87171", glow: "rgba(248,113,113,0.3)" },
  MEDIUM: { color: "#fbbf24", glow: "rgba(251,191,36,0.3)"  },
  LOW:    { color: "#34d399", glow: "rgba(52,211,153,0.3)"  },
};

const STATUSES   = Object.keys(STATUS_META);
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const PAGE_SIZE  = 8;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const iStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" };
const iCls   = "w-full px-3 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all";

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold">
      <Icon size={10} /> {m.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// PRIORITY BADGE
// ─────────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority];
  if (!m) return null;
  return (
    <span style={{ color: m.color }} className="inline-flex items-center gap-1.5 text-xs font-bold">
      <span style={{ background: m.color, boxShadow: `0 0 6px ${m.glow}` }} className="w-2 h-2 rounded-full" />
      {priority}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATE CASE MODAL
// ✅ FIX: Robust response unwrapping so any backend shape works
// ✅ FIX: Fetches fresh reports when modal opens
// ✅ FIX: Location auto-fills from report coordinates
// ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate, saving }) {
  const [form, setForm] = useState({
    caseNumber:      "",
    reportId:        "",
    assignedOfficer: "",
    status:          "OPEN",
    priority:        "MEDIUM",
    notes:           "",
    legalAction: { courtName: "", courtDate: "", fineAmount: "", jailDuration: "" },
  });

  const [reports,        setReports]        = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError,   setReportsError]   = useState("");
  const [locationPreview, setLocationPreview] = useState("");

  // ✅ FIXED: Handles any response shape the backend returns
  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const res = await api.getReports();

      // 🔍 Debug — open browser Console (F12) to see exactly what backend returns
      console.log("[CaseManagement] GET /api/reports raw response:", res);

      // Check for HTTP-level error embedded in JSON (e.g. { message: "Unauthorized" })
      if (res && !Array.isArray(res) && res.message && !res.reports && !res.data) {
        console.warn("[CaseManagement] Backend returned error message:", res.message);
        setReportsError(`Server error: ${res.message}`);
        return;
      }

      // ✅ Try to extract an array from any response shape
      const list = extractArray(res, ["reports", "data", "result", "results"]);

      console.log("[CaseManagement] Extracted reports list:", list);

      if (list === null) {
        // Response is not an array and has no recognisable array key
        console.error("[CaseManagement] Could not find reports array. Full response:", res);
        setReportsError(
          `Unexpected response from server. Check console (F12) for details.`
        );
        return;
      }

      setReports(list);

      if (list.length === 0) {
        setReportsError("No reports found. A report must exist before creating a case.");
      }

    } catch (err) {
      console.error("[CaseManagement] fetchReports network error:", err);
      setReportsError("Failed to connect to server. Make sure the backend is running on port 5000.");
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch reports immediately when modal opens
  useEffect(() => { fetchReports(); }, []);

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLegal = (k, v) => setForm(f => ({ ...f, legalAction: { ...f.legalAction, [k]: v } }));

  // ✅ When report selected, extract coordinates → show location preview
  const handleReportSelect = (reportId) => {
    set("reportId", reportId);

    if (!reportId) {
      setLocationPreview("");
      return;
    }

    const report = reports.find(r => r._id === reportId);

    if (!report) {
      setLocationPreview("Report not found.");
      return;
    }

    console.log("[CaseManagement] Selected report object:", report);

    // Support both GeoJSON { type:"Point", coordinates:[lng,lat] }
    // and flat { latitude, longitude } or { lat, lng } shapes
    const coords = report?.location?.coordinates;
    if (coords && coords.length === 2) {
      const lng = coords[0];
      const lat = coords[1];
      setLocationPreview(`${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`);
    } else if (report?.location?.latitude != null && report?.location?.longitude != null) {
      const lat = report.location.latitude;
      const lng = report.location.longitude;
      setLocationPreview(`${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`);
    } else if (report?.latitude != null && report?.longitude != null) {
      const lat = report.latitude;
      const lng = report.longitude;
      setLocationPreview(`${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`);
    } else {
      setLocationPreview("No coordinates found in this report.");
    }
  };

  const handleSubmit = () => {
    if (!form.caseNumber.trim()) { alert("Please enter a Case Number (e.g. CASE-001)."); return; }
    if (!form.reportId)          { alert("Please select a Report.");                      return; }
    onCreate(form);
  };

  // ── Helper: pick a useful label for each report in the dropdown ──
  const reportLabel = (r) => {
    const type     = r.incidentType || r.type || r.category || "Report";
    const dateStr  = fmtDate(r.incidentDate || r.createdAt);
    const status   = r.status ? ` [${r.status}]` : "";
    return `${type} — ${dateStr}${status}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#070f1a", border: "1px solid rgba(34,211,238,0.2)", maxWidth: 620, width: "100%", maxHeight: "94vh" }}
        className="relative rounded-2xl overflow-hidden flex flex-col scale-in">

        {/* ── Modal Header ── */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(34,211,238,0.03)" }}
          className="px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
              className="w-9 h-9 rounded-xl flex items-center justify-center">
              <Plus size={17} className="text-cyan-400" />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: "#fff", letterSpacing: 2 }}>
                Create New Case
              </h3>
              <p className="text-xs text-slate-500">Fill all required fields to open a case</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── SECTION 1: CASE NUMBER ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-cyan-400">1</div>
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Case Identification</span>
            </div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Case Number <span className="text-red-400">*</span>
              <span className="ml-2 text-slate-600 normal-case font-normal tracking-normal">Unique ID — e.g. CASE-001</span>
            </label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                value={form.caseNumber}
                onChange={e => set("caseNumber", e.target.value.toUpperCase())}
                placeholder="CASE-001"
                maxLength={20}
                className={`${iCls} pl-9 font-mono tracking-widest`}
                style={{ ...iStyle, color: "#22d3ee" }}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-1">Must be unique. Admin/staff enters this manually.</p>
          </div>

          {/* ── SECTION 2: REPORT + LOCATION ── */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            className="rounded-xl p-4 space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-cyan-400">2</div>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Report & Location</span>
              </div>

              {/* Refresh button */}
              <button onClick={fetchReports} disabled={reportsLoading}
                style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 transition-colors hover:bg-cyan-500/15">
                <RefreshCw size={11} className={reportsLoading ? "animate-spin" : ""} />
                {reportsLoading ? "Loading..." : `Refresh (${reports.length})`}
              </button>
            </div>

            {/* Report dropdown */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                Select Report <span className="text-red-400">*</span>
                <span className="ml-2 text-slate-600 normal-case font-normal tracking-normal">
                  {reports.length > 0 ? `${reports.length} reports available` : ""}
                </span>
              </label>

              {/* Error state */}
              {reportsError && (
                <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
                  className="rounded-xl px-3 py-2.5 flex items-start gap-2 mb-2">
                  <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-400">{reportsError}</p>
                    <p className="text-[10px] text-red-400/60 mt-0.5">
                      Open browser Console (F12 → Console tab) to see the raw server response and diagnose the issue.
                    </p>
                  </div>
                </div>
              )}

              <div className="relative">
                <ClipboardList size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />

                {reportsLoading ? (
                  <div style={{ ...iStyle, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 10px 36px", borderRadius: 12 }}>
                    <Loader2 size={14} className="animate-spin text-cyan-500" />
                    <span className="text-sm text-slate-500">Loading reports...</span>
                  </div>
                ) : (
                  <select
                    value={form.reportId}
                    onChange={e => handleReportSelect(e.target.value)}
                    className={`${iCls} pl-9 pr-8 appearance-none`}
                    style={iStyle}
                    disabled={reports.length === 0}
                  >
                    <option value="" style={{ background: "#0f172a" }}>
                      {reports.length === 0 ? "— No reports available —" : "— Select a Report —"}
                    </option>
                    {reports.map(r => (
                      <option key={r._id} value={r._id} style={{ background: "#0f172a" }}>
                        {reportLabel(r)}
                      </option>
                    ))}
                  </select>
                )}
                {!reportsLoading && <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                Selecting a report links this case and provides GPS coordinates for location conversion.
              </p>
            </div>

            {/* Location preview — auto-filled from report coordinates */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                <Lock size={10} className="text-slate-600" /> Location
                <span className="text-slate-600 normal-case font-normal tracking-normal ml-1">Auto-filled from report · Read only</span>
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: locationPreview && !locationPreview.includes("No") ? "#34d399" : "#475569" }} />
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: locationPreview && !locationPreview.includes("No")
                      ? "1px solid rgba(52,211,153,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: locationPreview && !locationPreview.includes("No") ? "#34d399" : "#475569",
                    borderRadius: 12, padding: "10px 12px 10px 36px", fontSize: 13, minHeight: 42,
                    display: "flex", alignItems: "center", fontFamily: "monospace"
                  }}
                >
                  {locationPreview
                    ? locationPreview
                    : <span style={{ color: "#475569", fontFamily: "DM Sans, sans-serif", fontSize: 12, fontStyle: "italic" }}>
                        Select a report above to auto-fill GPS coordinates...
                      </span>
                  }
                </div>
              </div>

              {form.reportId && locationPreview && !locationPreview.includes("No") && (
                <div style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}
                  className="mt-2 rounded-lg px-3 py-2 flex items-start gap-2">
                  <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                    GPS coordinates found! Backend will automatically convert these coordinates
                    into a readable address (e.g. "Colombo, Sri Lanka") when the case is created.
                  </p>
                </div>
              )}

              {form.reportId && locationPreview?.includes("No") && (
                <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)" }}
                  className="mt-2 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-400/80 leading-relaxed">
                    This report has no GPS coordinates. The case will be created without a location.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3: CASE DETAILS ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-cyan-400">3</div>
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Case Details</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Assigned Officer</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input value={form.assignedOfficer} onChange={e => set("assignedOfficer", e.target.value)}
                    placeholder="Officer full name..." className={`${iCls} pl-9`} style={iStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Status</label>
                  <div className="relative">
                    <select value={form.status} onChange={e => set("status", e.target.value)}
                      className={`${iCls} appearance-none pr-8`} style={iStyle}>
                      {STATUSES.map(s => <option key={s} value={s} style={{ background: "#0f172a" }}>{STATUS_META[s].label}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Priority</label>
                  <div className="relative">
                    <select value={form.priority} onChange={e => set("priority", e.target.value)}
                      className={`${iCls} appearance-none pr-8`} style={iStyle}>
                      {PRIORITIES.map(p => <option key={p} value={p} style={{ background: "#0f172a" }}>{p}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                  rows={3} placeholder="Add any relevant case notes here..."
                  className={`${iCls} resize-none`} style={iStyle} />
              </div>
            </div>
          </div>

          {/* ── SECTION 4: LEGAL ACTION ── */}
          <div style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)" }}
            className="rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-violet-400">4</div>
              <span className="text-xs text-violet-400 font-bold uppercase tracking-widest">Legal Action</span>
              <span className="text-[10px] text-slate-600">(Optional)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "courtName",    label: "Court Name",    type: "text",   placeholder: "e.g. Colombo High Court" },
                { key: "courtDate",    label: "Court Date",    type: "date",   placeholder: ""                        },
                { key: "fineAmount",   label: "Fine (LKR)",    type: "number", placeholder: "e.g. 50000"             },
                { key: "jailDuration", label: "Jail Duration", type: "text",   placeholder: "e.g. 6 months"          },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">{label}</label>
                  <input type={type} value={form.legalAction[key]}
                    onChange={e => setLegal(key, e.target.value)}
                    placeholder={placeholder} className={iCls} style={iStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* ── FORM CHECKLIST ── */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            className="rounded-xl p-4">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-3">Form Checklist</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Case Number",      done: !!form.caseNumber.trim() },
                { label: "Report Selected",  done: !!form.reportId          },
                { label: "Location Fetched", done: !!(form.reportId && locationPreview && !locationPreview.includes("No")) },
                { label: "Status Set",       done: true                     },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  {done
                    ? <CheckCircle size={11} className="text-emerald-400" />
                    : <CircleDot  size={11} className="text-slate-600" />
                  }
                  <span className={done ? "text-slate-300" : "text-slate-600"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          className="px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold hover:bg-white/8 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            disabled={saving || !form.caseNumber.trim() || !form.reportId}
            style={{ background: "linear-gradient(135deg, #06b6d4, #0e7490)", color: "#fff" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90">
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : <><Plus size={14} /> Create Case</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL PANEL
// ─────────────────────────────────────────────────────────────
function DetailPanel({ case: c, isAdmin, isStaff, onClose, onEdit, onDelete }) {
  if (!c) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", width: 480, background: "#070f1a", borderLeft: "1px solid rgba(34,211,238,0.1)" }}
        className="h-full overflow-y-auto flex flex-col slide-in">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#070f1a" }}
          className="px-6 py-5 flex items-start justify-between sticky top-0 z-10">
          <div>
            <p className="text-xs text-slate-500 font-medium tracking-widest uppercase mb-1">Case Details</p>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: "#22d3ee", letterSpacing: 2 }}>{c.caseNumber}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Hash,     label: "Case No",  value: c.caseNumber             },
              { icon: User,     label: "Officer",  value: c.assignedOfficer || "—" },
              { icon: MapPin,   label: "Location", value: c.locationName    || "—" },
              { icon: Calendar, label: "Created",  value: fmtDate(c.createdAt)     },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} className="rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={12} className="text-cyan-500" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
                </div>
                <p className="text-sm text-white font-medium truncate">{value}</p>
              </div>
            ))}
          </div>
          {c.notes && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} className="rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={13} className="text-cyan-500" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Notes</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{c.notes}</p>
            </div>
          )}
          {c.legalAction && (c.legalAction.courtName || c.legalAction.fineAmount) && (
            <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }} className="rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={13} className="text-violet-400" />
                <span className="text-xs text-violet-400 font-bold uppercase tracking-wider">Legal Action</span>
              </div>
              <div className="space-y-2 text-sm">
                {c.legalAction.courtName    && <div className="flex justify-between"><span className="text-slate-500">Court</span><span className="text-white font-medium">{c.legalAction.courtName}</span></div>}
                {c.legalAction.courtDate    && <div className="flex justify-between"><span className="text-slate-500">Court Date</span><span className="text-white font-medium">{fmtDate(c.legalAction.courtDate)}</span></div>}
                {c.legalAction.fineAmount   && <div className="flex justify-between"><span className="text-slate-500">Fine</span><span className="text-emerald-400 font-bold">LKR {c.legalAction.fineAmount?.toLocaleString()}</span></div>}
                {c.legalAction.jailDuration && <div className="flex justify-between"><span className="text-slate-500">Jail Duration</span><span className="text-red-400 font-medium">{c.legalAction.jailDuration}</span></div>}
              </div>
            </div>
          )}
          {c.evidence?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BadgeAlert size={13} className="text-cyan-500" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Evidence ({c.evidence.length})</span>
              </div>
              <div className="space-y-1">
                {c.evidence.map((e, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    className="rounded-lg px-3 py-2 text-xs text-slate-300 truncate font-mono">{e}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="px-6 py-4 flex gap-3">
          {(isAdmin || isStaff) && (
            <button onClick={() => onEdit(c)}
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-500/20 transition-colors">
              <Pencil size={14} /> Edit Case
            </button>
          )}
          {isAdmin && (
            <button onClick={() => onDelete(c)}
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────
function EditModal({ case: c, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    assignedOfficer: c?.assignedOfficer || "",
    status:          c?.status          || "OPEN",
    priority:        c?.priority        || "MEDIUM",
    notes:           c?.notes           || "",
    legalAction: {
      courtName:    c?.legalAction?.courtName    || "",
      courtDate:    c?.legalAction?.courtDate ? new Date(c.legalAction.courtDate).toISOString().split("T")[0] : "",
      fineAmount:   c?.legalAction?.fineAmount   || "",
      jailDuration: c?.legalAction?.jailDuration || "",
    },
  });

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLegal = (k, v) => setForm(f => ({ ...f, legalAction: { ...f.legalAction, [k]: v } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#070f1a", border: "1px solid rgba(34,211,238,0.15)", maxWidth: 560, width: "100%", maxHeight: "90vh" }}
        className="relative rounded-2xl overflow-hidden flex flex-col scale-in">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Editing Case</p>
            <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: "#22d3ee", letterSpacing: 2 }}>{c?.caseNumber}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }} className="rounded-xl p-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Case Number</p>
              <p style={{ fontFamily: "monospace", color: "#22d3ee" }} className="text-sm font-bold">{c?.caseNumber}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Location</p>
              <p className="text-sm text-slate-400 truncate">{c?.locationName || "—"}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Assigned Officer</label>
            <input value={form.assignedOfficer} onChange={e => set("assignedOfficer", e.target.value)}
              placeholder="Officer name..." className={iCls} style={iStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Status</label>
              <div className="relative">
                <select value={form.status} onChange={e => set("status", e.target.value)}
                  className={`${iCls} appearance-none pr-8`} style={iStyle}>
                  {STATUSES.map(s => <option key={s} value={s} style={{ background: "#0f172a" }}>{STATUS_META[s].label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Priority</label>
              <div className="relative">
                <select value={form.priority} onChange={e => set("priority", e.target.value)}
                  className={`${iCls} appearance-none pr-8`} style={iStyle}>
                  {PRIORITIES.map(p => <option key={p} value={p} style={{ background: "#0f172a" }}>{p}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={3} placeholder="Case notes..." className={`${iCls} resize-none`} style={iStyle} />
          </div>
          <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }} className="rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale size={13} className="text-violet-400" />
              <span className="text-xs text-violet-400 font-bold uppercase tracking-wider">Legal Action</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "courtName",    label: "Court Name",    type: "text",   placeholder: "Court name..."  },
                { key: "courtDate",    label: "Court Date",    type: "date",   placeholder: ""               },
                { key: "fineAmount",   label: "Fine (LKR)",    type: "number", placeholder: "0"              },
                { key: "jailDuration", label: "Jail Duration", type: "text",   placeholder: "e.g. 6 months" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">{label}</label>
                  <input type={type} value={form.legalAction[key]} onChange={e => setLegal(key, e.target.value)}
                    placeholder={placeholder} className={iCls} style={iStyle} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="px-6 py-4 flex gap-3 shrink-0">
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors">Cancel</button>
          <button onClick={() => onSave(c._id, form)} disabled={saving}
            style={{ background: "linear-gradient(135deg, #06b6d4, #0e7490)", color: "#fff" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────
function DeleteModal({ case: c, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#070f1a", border: "1px solid rgba(248,113,113,0.2)", maxWidth: 400, width: "100%" }}
        className="relative rounded-2xl p-6 scale-in text-center">
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
          className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="text-lg font-black text-white mb-1">Delete Case?</h3>
        <p className="text-sm text-slate-400 mb-1">Permanently deleting</p>
        <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: "#f87171", letterSpacing: 2 }} className="mb-2">{c?.caseNumber}</p>
        <p className="text-xs text-slate-500 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
          <button onClick={() => onConfirm(c._id)} disabled={deleting}
            style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
            {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN CASE MANAGEMENT PAGE
// ─────────────────────────────────────────────────────────────
export default function CaseManagement() {
  const user    = getUser();
  const isAdmin = user?.isAdmin === true;
  const isStaff = !isAdmin && !!user;

  const [cases,      setCases]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [page,           setPage]           = useState(1);
  const [selected,   setSelected]   = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [creating,   setCreating]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(false);
  const [toast,      setToast]      = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getCases();
      console.log("[CaseManagement] GET /api/cases raw response:", res);
      // ✅ Robust unwrapping for cases too
      const list = extractArray(res, ["cases", "data", "result", "results"]);
      setCases(list ?? []);
      if (!list) setError("Unexpected response from cases endpoint.");
    } catch {
      setError("Failed to load cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    return (
      (!q || c.caseNumber?.toLowerCase().includes(q) || c.assignedOfficer?.toLowerCase().includes(q) || c.locationName?.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q)) &&
      (filterStatus   === "ALL" || c.status   === filterStatus) &&
      (filterPriority === "ALL" || c.priority === filterPriority)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const newCase = await api.createCase(data);
      console.log("[CaseManagement] POST /api/cases response:", newCase);
      if (newCase._id) {
        setCases(cs => [newCase, ...cs]);
        setCreating(false);
        showToast(`✅ Case ${newCase.caseNumber} created successfully!`);
      } else {
        showToast(newCase.message || "Failed to create case.", "error");
      }
    } catch {
      showToast("Failed to create case. Check server.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (id, data) => {
    setSaving(true);
    try {
      const updated = await api.updateCase(id, data);
      setCases(cs => cs.map(c => c._id === id ? { ...c, ...updated } : c));
      if (selected?._id === id) setSelected(s => ({ ...s, ...updated }));
      setEditing(null);
      showToast("Case updated successfully!");
    } catch { showToast("Failed to update case.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(true);
    try {
      await api.deleteCase(id);
      setCases(cs => cs.filter(c => c._id !== id));
      setDeleting(null);
      setSelected(null);
      showToast("Case deleted successfully!");
    } catch { showToast("Failed to delete case.", "error"); }
    finally { setDeletingId(false); }
  };

  const stats = {
    total:  cases.length,
    open:   cases.filter(c => c.status === "OPEN").length,
    high:   cases.filter(c => c.priority === "HIGH").length,
    closed: cases.filter(c => c.status === "CLOSED").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #030b15; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 99px; }
        .slide-in { animation: slideIn .3s cubic-bezier(.16,1,.3,1) both; }
        @keyframes slideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .scale-in { animation: scaleIn .25s cubic-bezier(.16,1,.3,1) both; }
        @keyframes scaleIn { from { transform: scale(.95); opacity:0; } to { transform: scale(1); opacity:1; } }
        .row-fade { animation: rowFade .3s ease both; }
        @keyframes rowFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .toast-in { animation: toastIn .3s cubic-bezier(.16,1,.3,1) both; }
        @keyframes toastIn { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        select option { background: #0d1f35; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        .btn-row { opacity:0; transition: opacity .15s; }
        tr:hover .btn-row { opacity:1; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#030b15", minHeight: "100vh", width: "100vw", overflowX: "hidden" }}>
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div style={{ background: "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(6,182,212,0.06) 0%, transparent 70%)" }} className="absolute inset-0" />
          <div style={{ background: "radial-gradient(ellipse 50% 35% at 80% 80%, rgba(14,116,144,0.05) 0%, transparent 70%)" }} className="absolute inset-0" />
          <div style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" }} className="absolute inset-0" />
        </div>

        <div className="relative z-10 p-6 w-full space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }} className="w-9 h-9 rounded-xl flex items-center justify-center">
                  <Waves size={17} className="text-cyan-400" />
                </div>
                <span className="text-xs text-cyan-500 font-bold tracking-widest uppercase">Aqua Shield</span>
              </div>
              <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 42, color: "#fff", letterSpacing: 3, lineHeight: 1 }}>Case Management</h1>
              <p className="text-slate-500 text-sm mt-1">{filtered.length} of {cases.length} cases</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={load} disabled={loading}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/8 transition-colors disabled:opacity-50">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              {(isAdmin || isStaff) && (
                <button onClick={() => setCreating(true)}
                  style={{ background: "linear-gradient(135deg, #06b6d4, #0e7490)", color: "#fff" }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20">
                  <Plus size={16} /> Create Case
                </button>
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Cases",   value: stats.total,  color: "#22d3ee", icon: FileText     },
              { label: "Open Cases",    value: stats.open,   color: "#fbbf24", icon: CircleDot    },
              { label: "High Priority", value: stats.high,   color: "#f87171", icon: AlertTriangle },
              { label: "Closed",        value: stats.closed, color: "#34d399", icon: CheckCircle  },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }} className="rounded-2xl p-5 flex items-center gap-4">
                <div style={{ background: `${color}12`, border: `1px solid ${color}25` }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p style={{ color }} className="text-3xl font-black leading-none">{loading ? "—" : value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Role Banner */}
          <div style={{ background: isAdmin ? "rgba(34,211,238,0.05)" : "rgba(167,139,250,0.05)", border: `1px solid ${isAdmin ? "rgba(34,211,238,0.15)" : "rgba(167,139,250,0.15)"}` }}
            className="rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Shield size={13} style={{ color: isAdmin ? "#22d3ee" : "#a78bfa" }} />
            <span style={{ color: isAdmin ? "#22d3ee" : "#a78bfa" }} className="text-xs font-semibold">
              {isAdmin ? "Admin — Create, View, Edit and Delete cases" : "Staff — Create, View and Edit cases (Delete: Admin only)"}
            </span>
          </div>

          {/* Search + Filters */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }} className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search case number, officer, location..."
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#fff" }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X size={13} /></button>}
            </div>
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#fff" }}
                className="pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none focus:outline-none cursor-pointer min-w-[160px]">
                <option value="ALL">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-500 pointer-events-none" />
              <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#fff" }}
                className="pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none focus:outline-none cursor-pointer min-w-[140px]">
                <option value="ALL">All Priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Cases Table */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }} className="rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div style={{ border: "3px solid rgba(34,211,238,0.1)", borderTopColor: "#22d3ee" }} className="w-10 h-10 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading cases...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <AlertTriangle size={32} className="text-red-400/50" />
                <p className="text-slate-400 text-sm">{error}</p>
                <button onClick={load} className="text-cyan-400 text-sm hover:underline">Try again</button>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <FileText size={32} className="text-slate-700" />
                <p className="text-slate-500 text-sm">No cases found</p>
                {(search || filterStatus !== "ALL" || filterPriority !== "ALL") && (
                  <button onClick={() => { setSearch(""); setFilterStatus("ALL"); setFilterPriority("ALL"); }} className="text-cyan-400 text-sm hover:underline">Clear filters</button>
                )}
                {(isAdmin || isStaff) && !search && filterStatus === "ALL" && filterPriority === "ALL" && (
                  <button onClick={() => setCreating(true)}
                    style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mt-2">
                    <Plus size={14} /> Create First Case
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Case No.", "Officer", "Location", "Priority", "Status", "Created", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold tracking-widest uppercase text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((c, i) => (
                      <tr key={c._id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", animationDelay: `${i * 40}ms` }}
                        className="row-fade hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelected(c)}>
                        <td className="px-5 py-4">
                          <span style={{ fontFamily: "monospace", color: "#22d3ee", fontSize: 13, fontWeight: 700 }}>{c.caseNumber}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div style={{ background: "rgba(255,255,255,0.05)", width: 28, height: 28 }} className="rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                              {c.assignedOfficer ? c.assignedOfficer[0].toUpperCase() : "?"}
                            </div>
                            <span className="text-sm text-slate-300">{c.assignedOfficer || <span className="text-slate-600 italic text-xs">Unassigned</span>}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin size={11} className="text-slate-600 shrink-0" />
                            <span className="truncate max-w-[130px]">{c.locationName || "—"}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-4 text-xs text-slate-600">{fmtDate(c.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="btn-row flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelected(c)} style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)", color: "#22d3ee" }} className="p-1.5 rounded-lg hover:bg-cyan-500/15 transition-colors" title="View"><Eye size={13} /></button>
                            {(isAdmin || isStaff) && <button onClick={() => setEditing(c)} style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)", color: "#a78bfa" }} className="p-1.5 rounded-lg hover:bg-violet-500/15 transition-colors" title="Edit"><Pencil size={13} /></button>}
                            {isAdmin && <button onClick={() => setDeleting(c)} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171" }} className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors" title="Delete"><Trash2 size={13} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="px-5 py-3.5 flex items-center justify-between">
                <p className="text-xs text-slate-600">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }} className="p-1.5 rounded-lg disabled:opacity-30"><ChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} style={{ background: n === page ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)", border: n === page ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.06)", color: n === page ? "#22d3ee" : "#64748b" }} className="w-7 h-7 rounded-lg text-xs font-bold">{n}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }} className="p-1.5 rounded-lg disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {creating  && <CreateModal onClose={() => setCreating(false)} onCreate={handleCreate} saving={saving} />}
        {selected && !editing && !deleting && <DetailPanel case={selected} isAdmin={isAdmin} isStaff={isStaff} onClose={() => setSelected(null)} onEdit={c => setEditing(c)} onDelete={c => setDeleting(c)} />}
        {editing   && <EditModal   case={editing}  onClose={() => setEditing(null)}  onSave={handleSave}     saving={saving}     />}
        {deleting  && <DeleteModal case={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} deleting={deletingId} />}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[100] toast-in">
            <div style={{ background: toast.type === "success" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, color: toast.type === "success" ? "#34d399" : "#f87171", fontFamily: "'DM Sans', sans-serif" }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl">
              {toast.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
              {toast.msg}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
