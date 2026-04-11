import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LeafletMap from "../components/LeafletMap";
import {
  FileText,
  MapPin,
  Calendar,
  Paperclip,
  ChevronDown,
  Edit2,
  Trash2,
  AlertTriangle,
  Fish,
  Shield,
  X,
  ArrowLeft,
  Save,
} from "lucide-react";
import { apiUrl } from "../config/api";

// ─── CONSTANTS ────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending: {
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.35)",
    text: "#fbbf24",
  },
  "Under Review": {
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.35)",
    text: "#60a5fa",
  },
  Verified: {
    bg: "rgba(20,184,166,0.12)",
    border: "rgba(20,184,166,0.35)",
    text: "#2dd4bf",
  },
  Dismissed: {
    bg: "rgba(244,63,94,0.12)",
    border: "rgba(244,63,94,0.35)",
    text: "#fb7185",
  },
  Resolved: {
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.35)",
    text: "#4ade80",
  },
};

const INCIDENT_TYPES = [
  "Illegal Net Fishing",
  "Dynamite Fishing",
  "Cyanide Fishing",
  "Trawling in Protected Zone",
  "Catching Protected Species",
  "Night Fishing Violation",
  "Other",
];

const STATUSES = [
  "All",
  "Pending",
  "Under Review",
  "Verified",
  "Dismissed",
  "Resolved",
];

// ─── SHARED CLASSES ───────────────────────────────────────────
const inputCls =
  "w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none";

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-cyan-400/80 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  );
}

// ─── COORDINATES DISPLAY ─────────────────────────────────────
function CoordinatesDisplay({ lat, lng }) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Latitude", lat],
          ["Longitude", lng],
        ].map(([label, val]) => (
          <div
            key={label}
            className={`rounded-2xl px-4 py-2.5 border transition-all ${
              val != null
                ? "bg-cyan-500/8 border-cyan-500/30"
                : "bg-white/[0.03] border-white/8"
            }`}
          >
            <p className="text-[10px] text-cyan-400/50 uppercase tracking-widest mb-0.5">
              {label}
            </p>
            <p
              className={`text-sm font-mono font-semibold ${val != null ? "text-cyan-400" : "text-white/20"}`}
            >
              {val != null ? Number(val).toFixed(6) : "— click map —"}
            </p>
          </div>
        ))}
      </div>
      {lat == null && (
        <p className="text-xs text-white/25 mt-2">
          Click anywhere on the map to update the pin location.
        </p>
      )}
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────
function EditModal({ report, onClose, onSaved }) {
  const [form, setForm] = useState({
    incidentType: report.incidentType || "",
    description: report.description || "",
    incidentDate: report.incidentDate ? report.incidentDate.slice(0, 16) : "",
    latitude: report.location?.coordinates?.[1] ?? null,
    longitude: report.location?.coordinates?.[0] ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.description || form.description.trim().length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = new FormData();

      data.append("incidentType", form.incidentType);
      data.append("description", form.description);

      if (form.incidentDate) {
        data.append("incidentDate", form.incidentDate);
      }

      const lat = form.latitude ?? report.location?.coordinates?.[1];
      const lng = form.longitude ?? report.location?.coordinates?.[0];

      if (lat == null || lng == null) {
        throw new Error("Location coordinates are required");
      }

      data.append("latitude", lat);
      data.append("longitude", lng);

      const res = await fetch(apiUrl(`/reports/my/${report._id}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: data,
      });

      const text = await res.text();

      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error("Invalid server response: " + text);
      }

      console.log("UPDATE RESPONSE:", result);

      if (!res.ok) {
        throw new Error(result.message || "Update failed.");
      }

      onSaved(result.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[rgba(6,15,30,0.97)] border border-white/20 rounded-3xl shadow-2xl">
        {/* Accent bar — sticky so it stays visible while scrolling */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600 sticky top-0 z-10" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-2">
                <Edit2 size={10} /> Edit Report
              </div>
              <h3 className="text-xl font-extrabold text-white">Edit Report</h3>
              <p className="text-xs text-white/35 mt-0.5">
                {report.incidentType} ·{" "}
                {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Incident type */}
            <div>
              <FieldLabel>Incident Type</FieldLabel>
              <select
                value={form.incidentType}
                onChange={(e) =>
                  setForm({ ...form, incidentType: e.target.value })
                }
                className={inputCls}
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: "#041828" }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe the incident…"
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Incident date */}
            <div>
              <FieldLabel>Incident Date &amp; Time</FieldLabel>
              <input
                type="datetime-local"
                value={form.incidentDate}
                onChange={(e) =>
                  setForm({ ...form, incidentDate: e.target.value })
                }
                className={inputCls}
              />
            </div>

            {/* Location — Map */}
            <div>
              <FieldLabel>Incident Location</FieldLabel>
              <p className="text-xs text-white/30 mb-2">
                Click the map to move the pin to a new location.
              </p>
              <div className="rounded-2xl overflow-hidden border border-white/10 relative z-0">
                <LeafletMap
                  lat={form.latitude}
                  lng={form.longitude}
                  onChange={(lat, lng) =>
                    setForm((p) => ({ ...p, latitude: lat, longitude: lng }))
                  }
                />
              </div>
              <CoordinatesDisplay lat={form.latitude} lng={form.longitude} />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Save size={14} />
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────
function DeleteModal({ report, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[rgba(6,15,30,0.97)] border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />
        <div className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <Trash2 size={24} className="text-red-400" />
          </div>

          {/* Badge + title */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-red-500/20 bg-red-500/8 text-red-400">
              <AlertTriangle size={10} /> Confirm Delete
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-center text-white mb-1">
            Delete Report?
          </h3>
          <p className="text-sm text-center text-white/40 mb-5">
            This action is permanent and cannot be undone.
          </p>

          {/* Report preview */}
          {report && (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3 mb-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  {report.incidentType}
                </span>
              </div>
              <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-2">
                {report.description}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-white/25">
                  <Calendar size={9} />
                  {new Date(
                    report.incidentDate || report.createdAt,
                  ).toLocaleDateString()}
                </span>
                {report.location?.coordinates && (
                  <span className="flex items-center gap-1 text-[10px] text-white/25">
                    <MapPin size={9} />
                    {report.location.coordinates[1]?.toFixed(3)},{" "}
                    {report.location.coordinates[0]?.toFixed(3)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REPORT CARD ─────────────────────────────────────────────
function ReportCard({ report, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[report.status] || STATUS_COLORS.Pending;

  return (
    <div className="bg-white/5 backdrop-blur-[14px] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span
                className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: sc.bg,
                  border: `1px solid ${sc.border}`,
                  color: sc.text,
                }}
              >
                {report.status}
              </span>
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {report.incidentType}
              </span>
            </div>
            <p className="text-sm text-white/55 line-clamp-2 leading-relaxed">
              {report.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {report.status === "Pending" && (
              <>
                <button
                  onClick={() => onEdit(report)}
                  title="Edit"
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-white/40 hover:text-cyan-400"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => onDelete(report)}
                  title="Delete"
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-white/40 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              title="Toggle details"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white"
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3">
          {report.location?.coordinates && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <MapPin size={11} />
              {report.location.coordinates[1]?.toFixed(4)},{" "}
              {report.location.coordinates[0]?.toFixed(4)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-white/30">
            <Calendar size={11} />
            {new Date(
              report.incidentDate || report.createdAt,
            ).toLocaleDateString()}
          </span>
          {report.evidence?.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Paperclip size={11} />
              {report.evidence.length} file
              {report.evidence.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-white/5 flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-widest mb-1">
              Full Description
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              {report.description}
            </p>
          </div>
          {report.adminNote && (
            <div className="p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/15">
              <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mb-1">
                Admin Note
              </p>
              <p className="text-sm text-white/55">{report.adminNote}</p>
            </div>
          )}
          {report.speciesInvolved?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-widest mb-2">
                Species Involved
              </p>
              <div className="flex flex-wrap gap-2">
                {report.speciesInvolved.map((s) => (
                  <span
                    key={s._id}
                    className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold"
                  >
                    {s.commonName || s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function MyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch(apiUrl("/reports/my"), {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(apiUrl(`/reports/my/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setReports(reports.filter((r) => r._id !== id));
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered =
    filter === "All" ? reports : reports.filter((r) => r.status === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] =
      s === "All"
        ? reports.length
        : reports.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] relative overflow-x-hidden">
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10">
        {/* ── TOPBAR ─────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] border-b border-white/10">
          <div className="max-w-[860px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                <Fish size={14} className="text-cyan-400" />
              </div>
              <span className="text-sm font-extrabold text-white">
                AquaShield
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all"
            >
              Back
            </button>
          </div>
        </header>

        <div className="max-w-[860px] mx-auto px-6 py-8">
          {/* ── HEADER CARD ─────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 mb-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
                  <Shield size={12} /> My Activity
                </div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-white">
                  My Reports
                </h1>
                <p className="text-sm text-white/40 mt-1">
                  {reports.length} report{reports.length !== 1 ? "s" : ""}{" "}
                  submitted
                </p>
              </div>
              <div className="flex gap-3">
                {[
                  {
                    label: "Total",
                    value: reports.length,
                    colorClass:
                      "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
                  },
                  {
                    label: "Pending",
                    value: reports.filter((r) => r.status === "Pending").length,
                    colorClass:
                      "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
                  },
                  {
                    label: "Resolved",
                    value: reports.filter((r) => r.status === "Resolved")
                      .length,
                    colorClass:
                      "bg-green-500/20 border-green-500/30 text-green-400",
                  },
                ].map(({ label, value, colorClass }) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border ${colorClass}`}
                  >
                    <span className="text-xl font-extrabold leading-none">
                      {value}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5 opacity-70">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── REPORTS CARD ─────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => {
                  const isActive = filter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(6,182,212,0.3)]"
                          : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {s}
                      {counts[s] > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {counts[s]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl animate-pulse bg-white/5"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-cyan-500/8 border border-cyan-500/15">
                    <FileText size={24} className="text-cyan-400/40" />
                  </div>
                  <p className="text-white/40 text-sm">
                    {filter === "All"
                      ? "No reports submitted yet."
                      : `No ${filter.toLowerCase()} reports.`}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((r) => (
                    <ReportCard
                      key={r._id}
                      report={r}
                      onEdit={setEditTarget}
                      onDelete={(report) => setDeleteConfirm(report)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          report={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setReports(
              reports.map((r) => (r._id === updated._id ? updated : r)),
            );
            setEditTarget(null);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <DeleteModal
          report={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm._id)}
        />
      )}
    </div>
  );
}
