import { useState, useEffect } from "react";

const STATUS_COLORS = {
  Pending: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.35)", text: "#fbbf24" },
  "Under Review": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" },
  Verified: { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)", text: "#2dd4bf" },
  Dismissed: { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.35)", text: "#fb7185" },
  Resolved: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", text: "#4ade80" },
};

const INCIDENT_TYPES = [
  "Illegal Net Fishing","Dynamite Fishing","Cyanide Fishing",
  "Trawling in Protected Zone","Catching Protected Species","Night Fishing Violation","Other",
];

function EditModal({ report, onClose, onSaved }) {
  const [form, setForm] = useState({
    incidentType: report.incidentType || "",
    description: report.description || "",
    latitude: report.location?.coordinates?.[1] || "",
    longitude: report.location?.coordinates?.[0] || "",
    incidentDate: report.incidentDate ? report.incidentDate.slice(0, 16) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      const res = await fetch(`/api/reports/my/${report._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: data,
      });
      if (!res.ok) throw new Error((await res.json()).message || "Update failed.");
      const updated = await res.json();
      onSaved(updated.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,14,31,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#041828", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="h-1" style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)" }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Report</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(103,232,249,0.8)" }}>Incident Type</label>
              <select
                value={form.incidentType}
                onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              >
                {INCIDENT_TYPES.map((t) => <option key={t} value={t} style={{ background: "#041828" }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(103,232,249,0.8)" }}>Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg outline-none text-sm resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["latitude", "longitude"].map((k) => (
                <div key={k}>
                  <label className="block text-xs font-medium mb-1.5 capitalize" style={{ color: "rgba(103,232,249,0.8)" }}>{k}</label>
                  <input type="number" step="any" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                </div>
              ))}
            </div>
            {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185" }}>{error}</div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_COLORS[report.status] || STATUS_COLORS.Pending;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                {report.status}
              </span>
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#22d3ee" }}>
                {report.incidentType}
              </span>
            </div>
            <p className="text-sm mt-2 line-clamp-2" style={{ color: "rgba(255,255,255,0.6)" }}>{report.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {report.status === "Pending" && (
              <>
                <button onClick={() => onEdit(report)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-cyan-500/10"
                  title="Edit">
                  <svg className="w-4 h-4" fill="none" stroke="#06b6d4" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(report._id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/10" title="Delete">
                  <svg className="w-4 h-4" fill="none" stroke="#fb7185" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
            <button onClick={() => setExpanded(!expanded)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {report.location?.coordinates?.[1]?.toFixed(4)}, {report.location?.coordinates?.[0]?.toFixed(4)}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(report.incidentDate || report.createdAt).toLocaleDateString()}
          </span>
          {report.evidence?.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {report.evidence.length} file{report.evidence.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="pt-4">
            <p className="text-xs font-medium mb-1" style={{ color: "rgba(103,232,249,0.7)" }}>Full Description</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{report.description}</p>
          </div>
          {report.adminNote && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#22d3ee" }}>Admin Note</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{report.adminNote}</p>
            </div>
          )}
          {report.speciesInvolved?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "rgba(103,232,249,0.7)" }}>Species Involved</p>
              <div className="flex flex-wrap gap-2">
                {report.speciesInvolved.map((s) => (
                  <span key={s._id} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#2dd4bf" }}>
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

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/reports/my", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/reports/my/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setReports(reports.filter((r) => r._id !== id));
    } finally {
      setDeleteConfirm(null);
    }
  };

  const statuses = ["All", "Pending", "Under Review", "Verified", "Dismissed", "Resolved"];
  const filtered = filter === "All" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#020e1f" }}>
      <div className="fixed top-0 right-0 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.05), transparent 70%)", filter: "blur(60px)" }} />

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ background: "linear-gradient(to right, #22d3ee, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            My Reports
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>{reports.length} report{reports.length !== 1 ? "s" : ""} submitted</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={filter === s
                ? { background: "linear-gradient(to right, #06b6d4, #2563eb)", color: "#fff" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
              }>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <svg className="w-8 h-8" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>No reports found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <ReportCard key={r._id} report={r} onEdit={setEditTarget} onDelete={setDeleteConfirm} />
            ))}
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal
          report={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setReports(reports.map((r) => (r._id === updated._id ? updated : r)));
            setEditTarget(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,14,31,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#041828", border: "1px solid rgba(244,63,94,0.3)" }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(244,63,94,0.12)" }}>
              <svg className="w-6 h-6" fill="none" stroke="#fb7185" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center text-white mb-2">Delete Report?</h3>
            <p className="text-sm text-center mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(to right, #f43f5e, #e11d48)", color: "#fff" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}