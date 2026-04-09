import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Fish, FileText, Briefcase, Settings,
  LogOut, Shield, Search, Filter
} from "lucide-react";

const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",          icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "users",     label: "User Management",    icon: Users,           path: "/admin/users"     },
  { id: "species",   label: "Species Management", icon: Fish,            path: "/admin/species"   },
  { id: "reports",   label: "Report Management",  icon: FileText,        path: "/admin/reports"   },
  { id: "cases",     label: "Case Management",    icon: Briefcase,       path: "/admin/cases"     },
  { id: "settings",  label: "Settings",           icon: Settings,        path: "/admin/settings"  },
];

const STATUS_COLORS = {
  Pending:       { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.35)",   text: "#fbbf24", tw: "bg-yellow-500/20 text-yellow-400" },
  "Under Review":{ bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)",  text: "#60a5fa", tw: "bg-blue-500/20 text-blue-400"   },
  Verified:      { bg: "rgba(20,184,166,0.12)",  border: "rgba(20,184,166,0.35)",  text: "#2dd4bf", tw: "bg-teal-500/20 text-teal-400"   },
  Dismissed:     { bg: "rgba(244,63,94,0.12)",   border: "rgba(244,63,94,0.35)",   text: "#fb7185", tw: "bg-red-500/20 text-red-400"     },
  Resolved:      { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.35)",   text: "#4ade80", tw: "bg-green-500/20 text-green-400" },
};

const VALID_STATUSES = ["Pending", "Under Review", "Verified", "Dismissed", "Resolved"];

const STATS_CONFIG = [
  { key: "Pending",      label: "Pending",      icon: LayoutDashboard, colorClass: "bg-yellow-500/20 border-yellow-500/30", iconColor: "text-yellow-400" },
  { key: "Under Review", label: "Under Review", icon: FileText,        colorClass: "bg-blue-500/20 border-blue-500/30",   iconColor: "text-blue-400"   },
  { key: "Verified",     label: "Verified",     icon: Shield,          colorClass: "bg-teal-500/20 border-teal-500/30",   iconColor: "text-teal-400"   },
  { key: "Resolved",     label: "Resolved",     icon: Briefcase,       colorClass: "bg-green-500/20 border-green-500/30", iconColor: "text-green-400"  },
];

// ── Status Update Modal ────────────────────────────────────────────────────────
function StatusUpdateModal({ report, onClose, onUpdated }) {
  const [status, setStatus]     = useState(report.status);
  const [adminNote, setAdminNote] = useState(report.adminNote || "");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSave = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/reports/${report._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[rgba(6,15,30,0.95)] border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
        <div className="p-6">
          {/* Modal header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-2">
                <Shield size={12} /> Report Update
              </div>
              <h3 className="text-lg font-extrabold text-white">Update Report Status</h3>
              <p className="text-xs text-white/40 mt-0.5">
                {report.incidentType} — {report.reportedBy?.firstName} {report.reportedBy?.lastName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Status selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-cyan-400/80 mb-2 uppercase tracking-widest">Status</label>
            <div className="flex flex-col gap-2">
              {VALID_STATUSES.map((s) => {
                const sc = STATUS_COLORS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-left transition-all duration-150"
                    style={{
                      background: status === s ? sc.bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${status === s ? sc.border : "rgba(255,255,255,0.07)"}`,
                      color: status === s ? sc.text : "rgba(255,255,255,0.5)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.text }} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin note */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-cyan-400/80 mb-2 uppercase tracking-widest">Admin Note</label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note for this report..."
              className="w-full rounded-2xl py-2.5 px-3 text-sm outline-none transition-all bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 text-xs px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [total, setTotal]               = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [selected, setSelected]         = useState(null);
  const [activeNav, setActiveNav]       = useState("reports");

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return; }
    fetchReports();
  }, [fetchReports, navigate]);

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

  const statCounts = VALID_STATUSES.reduce((acc, s) => {
    acc[s] = reports.filter((r) => r.status === s).length;
    return acc;
  }, {});

  const filteredReports = reports.filter((r) =>
    r.incidentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedBy?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedBy?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedBy?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        {/* ── Sidebar ── */}
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
            {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
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

        {/* ── Main Content ── */}
        <div className="flex-1 ml-[260px] w-[calc(100%-260px)] p-6">
          <div className="max-w-[1180px] mx-auto">

            {/* Header Card */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 mb-6 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
                    <Shield size={12} /> Admin Panel
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-white">Report Management</h1>
                  <p className="text-sm text-white/40 mt-1">Review, update and manage all incident reports</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/40">{total} total reports</p>
                  <p className="text-xs text-white/25 mt-1">
                    {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {STATS_CONFIG.map(({ key, label, icon: Icon, colorClass, iconColor }) => (
                <div key={key} className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-3 ${colorClass}`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <p className="text-sm text-white/40">{label}</p>
                  <p className="text-3xl font-extrabold text-white">{statCounts[key] || 0}</p>
                </div>
              ))}
            </div>

            {/* Reports Table Card */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">

              {/* Table header: search + filter */}
              <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Incident Reports</h2>
                  <p className="text-sm text-white/40">Search, filter and update report statuses</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search */}
                  <div className="relative w-full md:w-[240px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                  {/* Status filter */}
                  <div className="relative">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                      className="appearance-none rounded-2xl py-2.5 pl-8 pr-8 text-sm outline-none bg-white/5 border border-white/10 text-white/70 focus:border-cyan-500/50 cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      {VALID_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Incident Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Reported By</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => {
                        const sc = STATUS_COLORS[report.status] || STATUS_COLORS.Pending;
                        return (
                          <tr
                            key={report._id}
                            className="border-b border-white/5 hover:bg-white/5 transition-all duration-200"
                          >
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400">
                                {report.incidentType}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-white/80 font-medium">
                                {report.reportedBy?.firstName} {report.reportedBy?.lastName}
                              </p>
                              <p className="text-xs text-white/40">{report.reportedBy?.email}</p>
                            </td>
                            <td className="px-4 py-3 max-w-[220px]">
                              <p className="text-sm text-white/60 truncate">{report.description}</p>
                              {report.adminNote && (
                                <p className="text-xs text-cyan-400/60 truncate mt-0.5">
                                  Note: {report.adminNote}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                              >
                                {report.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/40">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelected(report)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-all"
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredReports.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-14 text-center text-white/40">
                            No reports found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-white/10">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-white/40">Page {page} of {pages}</span>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
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