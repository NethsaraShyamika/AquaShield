import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  MapPin,
  Calendar,
  ChevronDown,
  Shield,
  X,
} from "lucide-react";

const STATUSES = [
  "All",
  "OPEN",
  "UNDER_INVESTIGATION",
  "LEGAL_ACTION_STARTED",
  "COURT_PROCEEDING",
  "CLOSED",
  "REJECTED",
];

const inputCls =
  "w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none";

function CaseCard({ c }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/5 backdrop-blur-[14px] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {c.caseNumber}
              </span>
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/60">
                {c.priority}
              </span>
            </div>
            <p className="text-sm text-white/55 line-clamp-2 leading-relaxed">
              {c.notes || (c.reportId && c.reportId.description) || "No description"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
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
          {c.reportId?.location?.coordinates && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <MapPin size={11} />
              {c.reportId.location.coordinates[1]?.toFixed(4)}, {" "}
              {c.reportId.location.coordinates[0]?.toFixed(4)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-white/30">
            <Calendar size={11} />
            {new Date(c.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-white/5 flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-widest mb-1">
              Case Details
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              <strong>Status:</strong> {c.status}
              {c.assignedOfficer && (
                <span className="block"> <strong>Officer:</strong> {c.assignedOfficer}</span>
              )}
            </p>
          </div>

          {c.reportId && (
            <div>
              <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-widest mb-2">
                Related Report
              </p>
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
                <p className="text-sm text-white/55 mb-2">{c.reportId.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1"><Calendar size={9} />{new Date(c.reportId.createdAt).toLocaleDateString()}</span>
                  {c.reportId.speciesInvolved?.length > 0 && (
                    <span className="flex items-center gap-1">{c.reportId.speciesInvolved.length} species</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/cases/my", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => setCases(d.cases || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? cases : cases.filter((c) => c.status === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === "All" ? cases.length : cases.filter((c) => c.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] relative overflow-x-hidden">
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] border-b border-white/10">
          <div className="max-w-[860px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                <Shield size={14} className="text-cyan-400" />
              </div>
              <span className="text-sm font-extrabold text-white">AquaShield</span>
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
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 mb-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
                  <Shield size={12} /> My Cases
                </div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-white">My Cases</h1>
                <p className="text-sm text-white/40 mt-1">{cases.length} case{cases.length !== 1 ? "s" : ""} opened</p>
              </div>
            </div>
          </div>

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
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/40"}`}>
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
                    <div key={i} className="h-28 rounded-2xl animate-pulse bg-white/5" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-cyan-500/8 border border-cyan-500/15">
                    <FileText size={24} className="text-cyan-400/40" />
                  </div>
                  <p className="text-white/40 text-sm">{filter === "All" ? "No cases opened yet." : `No ${filter.toLowerCase()} cases.`}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((c) => (
                    <CaseCard key={c._id} c={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
