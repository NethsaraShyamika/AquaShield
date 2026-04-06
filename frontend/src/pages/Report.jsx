import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const STATUS_COLORS = {
  Pending:        { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.35)",  text: "#fbbf24", glow: "rgba(234,179,8,0.15)"  },
  "Under Review": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa", glow: "rgba(59,130,246,0.15)" },
  Verified:       { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)", text: "#2dd4bf", glow: "rgba(20,184,166,0.15)" },
  Dismissed:      { bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.35)",  text: "#fb7185", glow: "rgba(244,63,94,0.15)"  },
  Resolved:       { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  text: "#4ade80", glow: "rgba(34,197,94,0.15)"  },
};

/**
 * Route setup:
 *   User  → <Route path="/reports/:id"       element={<ReportDetail />} />
 *   Admin → <Route path="/admin/reports/:id" element={<ReportDetail />} />
 *
 * Admin mode detected from URL ("/admin/") OR localStorage role === "admin".
 * On login: localStorage.setItem("token", ...) + localStorage.setItem("role", "admin"|"user")
 */
export default function ReportDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin =
    location.pathname.includes("/admin/") ||
    localStorage.getItem("role") === "admin";

  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!id) return;
    const endpoint = isAdmin ? `/api/reports/${id}` : `/api/reports/my/${id}`;

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.message && !d._id) setError(d.message);
        else setReport(d);
      })
      .catch((err) => setError(err.message || "Failed to load report."))
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

  /* ── Loading skeleton ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020e1f" }}>
        <div className="space-y-4 w-full max-w-2xl px-4">
          {[100, 120, 100, 120, 80].map((h, i) => (
            <div
              key={i}
              className="rounded-xl animate-pulse"
              style={{ height: h, background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ──────────────────────────────────────────────────── */
  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020e1f" }}>
        <div className="text-center px-6">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#fb7185" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-base mb-5" style={{ color: "#fb7185" }}>
            {error || "Report not found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived values ───────────────────────────────────────────────── */
  const s   = STATUS_COLORS[report.status] || STATUS_COLORS.Pending;
  const lat = report.location?.coordinates?.[1];
  const lng = report.location?.coordinates?.[0];

  /* ── Main render ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#020e1f" }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-20 right-20 w-96 h-96"
          style={{
            background: `radial-gradient(circle, ${s.glow}, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-20 left-20 w-96 h-96"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.05), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto relative">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 mb-7 text-sm transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header card */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="h-1" style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)" }} />
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium"
                style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: s.text }}
                />
                {report.status}
              </span>
              <span
                className="text-sm px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(6,182,212,0.08)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "#22d3ee",
                }}
              >
                {report.incidentType}
              </span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Reported on {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Description */}
        <Section title="Description">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            {report.description}
          </p>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="#06b6d4" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {lat != null ? lat.toFixed(6) : "—"}, {lng != null ? lng.toFixed(6) : "—"}
              </p>
              {lat != null && lng != null && (
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-0.5 inline-flex items-center gap-1 transition-opacity hover:opacity-75"
                  style={{ color: "#22d3ee" }}
                >
                  Open in Google Maps
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </Section>

        {/* Incident Date */}
        <Section title="Incident Date">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="#06b6d4" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-white">
              {new Date(report.incidentDate || report.createdAt).toLocaleString()}
            </p>
          </div>
        </Section>

        {/* Reported By — admin only */}
        {isAdmin && report.reportedBy && (
          <Section title="Reported By">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #06b6d4, #2563eb)", color: "#fff" }}
              >
                {report.reportedBy.firstName?.[0]}
                {report.reportedBy.lastName?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {report.reportedBy.firstName} {report.reportedBy.lastName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {report.reportedBy.email}
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* Species Involved */}
        {report.speciesInvolved?.length > 0 && (
          <Section title="Species Involved">
            <div className="flex flex-wrap gap-2">
              {report.speciesInvolved.map((sp) => (
                <span
                  key={sp._id}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(20,184,166,0.1)",
                    border: "1px solid rgba(20,184,166,0.25)",
                    color: "#2dd4bf",
                  }}
                >
                  {sp.commonName || sp.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Evidence */}
        {report.evidence?.length > 0 && (
          <Section
            title={`Evidence · ${report.evidence.length} file${report.evidence.length !== 1 ? "s" : ""}`}
          >
            <div className="grid grid-cols-2 gap-3">
              {report.evidence.map((ev, i) => {
                const isImg = ev.fileType?.startsWith("image");
                return (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: isImg ? "zoom-in" : "default",
                    }}
                    onClick={() => isImg && setLightbox(ev.url)}
                  >
                    {isImg ? (
                      <img
                        src={ev.url}
                        alt={ev.originalName}
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center gap-2">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="rgba(6,182,212,0.5)"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium"
                          style={{ color: "#22d3ee" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View file ↗
                        </a>
                      </div>
                    )}
                    <div className="px-3 py-2">
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {ev.originalName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Admin Note */}
        {report.adminNote && (
          <Section title="Admin Note">
            <div className="flex gap-3">
              <div
                className="w-1 shrink-0 rounded-full"
                style={{ background: "linear-gradient(to bottom, #06b6d4, #2563eb)" }}
              />
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {report.adminNote}
              </p>
            </div>
          </Section>
        )}

      </div>

      {/* Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(2,14,31,0.96)", backdropFilter: "blur(20px)" }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Evidence preview"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            style={{ boxShadow: "0 0 80px rgba(6,182,212,0.2)" }}
          />
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onClick={() => setLightbox(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}

/* ── Section card helper ────────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "rgba(103,232,249,0.7)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
