import { useState, useEffect, useCallback } from "react";

const STATUS_COLORS = {
  Pending: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.35)", text: "#fbbf24" },
  "Under Review": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" },
  Verified: { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)", text: "#2dd4bf" },
  Dismissed: { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.35)", text: "#fb7185" },
  Resolved: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", text: "#4ade80" },
};

const VALID_STATUSES = ["Pending", "Under Review", "Verified", "Dismissed", "Resolved"];

const STATS_CONFIG = [
  { key: "Pending", label: "Pending", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "#fbbf24" },
  { key: "Under Review", label: "Under Review", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#60a5fa" },
  { key: "Verified", label: "Verified", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#2dd4bf" },
  { key: "Resolved", label: "Resolved", icon: "M5 13l4 4L19 7", color: "#4ade80" },
];

function StatusUpdateModal({ report, onClose, onUpdated }) {
  const [status, setStatus] = useState(report.status);
  const [adminNote, setAdminNote] = useState(report.adminNote || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/reports/${report._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ status, adminNote }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Update failed.");
      const data = await res.json();
      onUpdated(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,14,31,0.9)", backdropFilter: "blur(16px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#041828", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="h-1" style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)" }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Update Report Status</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {report.incidentType} — {report.reportedBy?.firstName} {report.reportedBy?.lastName}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status Selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>Status</label>
            <div className="grid grid-cols-1 gap-2">
              {VALID_STATUSES.map((s) => {
                const sc = STATUS_COLORS[s];
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all duration-150"
                    style={{
                      background: status === s ? sc.bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${status === s ? sc.border : "rgba(255,255,255,0.07)"}`,
                      color: status === s ? sc.text : "rgba(255,255,255,0.5)",
                    }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.text }} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Note */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>Admin Note</label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note for this report..."
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {error && <div className="mb-4 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185" }}>{error}</div>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Save Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportRow({ report, onSelect }) {
  const s = STATUS_COLORS[report.status] || STATUS_COLORS.Pending;
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 cursor-pointer group"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      onClick={() => onSelect(report)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
              {report.status}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", color: "#22d3ee" }}>
              {report.incidentType}
            </span>
          </div>
          <p className="text-sm font-medium text-white mb-1">
            {report.reportedBy?.firstName} {report.reportedBy?.lastName}
            <span className="ml-2 text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>{report.reportedBy?.email}</span>
          </p>
          <p className="text-xs line-clamp-1" style={{ color: "rgba(255,255,255,0.5)" }}>{report.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(report.createdAt).toLocaleDateString()}</p>
          <div className="mt-2 flex items-center gap-1 justify-end">
            {report.evidence?.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                {report.evidence.length} file{report.evidence.length > 1 ? "s" : ""}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(6,182,212,0.15)", color: "#22d3ee" }}>
              Update →
            </span>
          </div>
        </div>
      </div>
      {report.adminNote && (
        <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(6,182,212,0.05)", borderLeft: "2px solid rgba(6,182,212,0.3)", color: "rgba(255,255,255,0.5)" }}>
          <span style={{ color: "#22d3ee" }}>Note: </span>{report.adminNote}
        </div>
      )}
    </div>
  );
}

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/reports?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const statCounts = VALID_STATUSES.reduce((acc, s) => {
    acc[s] = reports.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#020e1f" }}>
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04), transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-10 right-10 w-96 h-96" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.04), transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#06b6d4" }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: "#22d3ee" }}>Admin Panel</span>
            </div>
            <h1 className="text-3xl font-bold" style={{ background: "linear-gradient(to right, #22d3ee, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              All Reports
            </h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{total} total incident reports</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS_CONFIG.map(({ key, label, icon, color }) => (
            <div key={key} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <svg className="w-4 h-4" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{statCounts[key] || 0}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {["", ...VALID_STATUSES].map((s) => (
            <button key={s || "all"} onClick={() => { setStatusFilter(s); setPage(1); }}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={statusFilter === s
                ? { background: "linear-gradient(to right, #06b6d4, #2563eb)", color: "#fff" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
              }>
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <svg className="w-8 h-8" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>No reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => <ReportRow key={r._id} report={r} onSelect={setSelected} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: page === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)" }}>
              ← Prev
            </button>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Page {page} of {pages}</span>
            <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: page === pages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)" }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {selected && (
        <StatusUpdateModal
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setReports(reports.map((r) => (r._id === updated._id ? updated : r)));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}