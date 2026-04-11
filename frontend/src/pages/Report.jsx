import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import LeafletMap from "../components/LeafletMap";
import {
  Fish, Shield, MapPin, Calendar, User, ExternalLink,
  AlertTriangle, X, FileText, Paperclip,
} from "lucide-react";
import { apiUrl } from "../config/api";

// ─── CONSTANTS ────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending:        { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.35)",  text: "#fbbf24" },
  "Under Review": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" },
  Verified:       { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)", text: "#2dd4bf" },
  Dismissed:      { bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.35)",  text: "#fb7185" },
  Resolved:       { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  text: "#4ade80" },
};

// ─── SECTION CARD ─────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white/5 backdrop-blur-[14px] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
        {Icon && <Icon size={13} className="text-cyan-400/70" />}
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
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
    const endpoint = isAdmin ? apiUrl(`/reports/${id}`) : apiUrl(`/reports/my/${id}`);
    fetch(endpoint, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then((d) => { if (d.message && !d._id) setError(d.message); else setReport(d); })
      .catch((err) => setError(err.message || "Failed to load report."))
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

  const goBack = () => isAdmin ? navigate("/admin/reports") : navigate("/my-reports");

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] flex items-center justify-center">
        <div className="w-full max-w-[720px] px-6 flex flex-col gap-4">
          {[100, 140, 100, 200, 120].map((h, i) => (
            <div key={i} className="rounded-2xl animate-pulse bg-white/5" style={{ height: h }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <p className="text-red-400 text-sm mb-5">{error || "Report not found."}</p>
          <button type="button" onClick={goBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">
             Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────
  const sc  = STATUS_COLORS[report.status] || STATUS_COLORS.Pending;
  const lat = report.location?.coordinates?.[1];
  const lng = report.location?.coordinates?.[0];

  // ── Main render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10">
        {/* ── TOPBAR ────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] border-b border-white/10">
          <div className="max-w-[720px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                <Fish size={14} className="text-cyan-400" />
              </div>
              <span className="text-sm font-extrabold text-white">AquaShield</span>
            </div>
            <button type="button" onClick={goBack}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">
               Back
            </button>
          </div>
        </header>

        <div className="max-w-[720px] mx-auto px-6 py-8 flex flex-col gap-4">

          {/* ── HEADER CARD ─────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <div className="px-6 py-5">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-4">
                <Shield size={12} /> Report Detail
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Status badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.text }} />
                  {report.status}
                </span>
                {/* Incident type badge */}
                <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  {report.incidentType}
                </span>
              </div>
              <p className="text-xs text-white/30">
                Reported on {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* ── DESCRIPTION ─────────────────────────────── */}
          <Section title="Description" icon={FileText}>
            <p className="text-sm text-white/70 leading-relaxed">{report.description}</p>
          </Section>

          {/* ── LOCATION + MAP ──────────────────────────── */}
          <Section title="Incident Location" icon={MapPin}>
            {lat != null && lng != null ? (
              <>
                {/* Map */}
                <div className="rounded-2xl overflow-hidden border border-white/10 relative z-0 mb-4">
                  <LeafletMap
                    lat={lat}
                    lng={lng}
                    onChange={null}
                    readOnly
                  />
                </div>

                {/* Coordinate tiles */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[["Latitude", lat], ["Longitude", lng]].map(([label, val]) => (
                    <div key={label} className="rounded-2xl px-4 py-2.5 bg-cyan-500/8 border border-cyan-500/30">
                      <p className="text-[10px] text-cyan-400/50 uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-sm font-mono font-semibold text-cyan-400">{Number(val).toFixed(6)}</p>
                    </div>
                  ))}
                </div>

                {/* Google Maps link */}
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all">
                  <ExternalLink size={12} /> Open in Google Maps
                </a>
              </>
            ) : (
              <p className="text-sm text-white/30 italic">No location data available.</p>
            )}
          </Section>

          {/* ── INCIDENT DATE ───────────────────────────── */}
          <Section title="Incident Date" icon={Calendar}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                <Calendar size={16} className="text-cyan-400" />
              </div>
              <p className="text-sm font-semibold text-white">
                {new Date(report.incidentDate || report.createdAt).toLocaleString()}
              </p>
            </div>
          </Section>

          {/* ── REPORTED BY (admin only) ─────────────────── */}
          {isAdmin && report.reportedBy && (
            <Section title="Reported By" icon={User}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                  {report.reportedBy.firstName?.[0]}{report.reportedBy.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {report.reportedBy.firstName} {report.reportedBy.lastName}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{report.reportedBy.email}</p>
                </div>
              </div>
            </Section>
          )}

          {/* ── SPECIES INVOLVED ────────────────────────── */}
          {report.speciesInvolved?.length > 0 && (
            <Section title="Species Involved" icon={Fish}>
              <div className="flex flex-wrap gap-2">
                {report.speciesInvolved.map((sp) => (
                  <span key={sp._id}
                    className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold">
                    {sp.commonName || sp.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* ── EVIDENCE ────────────────────────────────── */}
          {report.evidence?.length > 0 && (
            <Section title={`Evidence · ${report.evidence.length} file${report.evidence.length !== 1 ? "s" : ""}`} icon={Paperclip}>
              <div className="grid grid-cols-2 gap-3">
                {report.evidence.map((ev, i) => {
                  const isImg = ev.fileType?.startsWith("image");
                  return (
                    <div key={i}
                      className={`rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] transition-all ${isImg ? "cursor-zoom-in hover:border-white/20 hover:scale-[1.01]" : ""}`}
                      onClick={() => isImg && setLightbox(ev.url)}>
                      {isImg ? (
                        <img src={ev.url} alt={ev.originalName} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="h-36 flex flex-col items-center justify-center gap-2">
                          <Paperclip size={28} className="text-cyan-400/40" />
                          <a href={ev.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}>
                            View file <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                      <div className="px-3 py-2 border-t border-white/8">
                        <p className="text-xs text-white/40 truncate">{ev.originalName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── ADMIN NOTE ──────────────────────────────── */}
          {report.adminNote && (
            <Section title="Admin Note" icon={Shield}>
              <div className="flex gap-3">
                <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
                <p className="text-sm text-white/70 leading-relaxed">{report.adminNote}</p>
              </div>
            </Section>
          )}

        </div>
      </div>

      {/* ── IMAGE LIGHTBOX ────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          onClick={() => setLightbox(null)}>
          <img
            src={lightbox}
            alt="Evidence preview"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-[0_0_80px_rgba(6,182,212,0.2)]"
          />
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
            onClick={() => setLightbox(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}