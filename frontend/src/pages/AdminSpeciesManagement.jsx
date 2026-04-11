import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Fish, LayoutGrid, CalendarDays, LayoutDashboard, Briefcase, FileText, Users, Settings, LogOut } from "lucide-react";
import { API_BASE_URL as API_BASE } from "../config/api";

const PALETTE = {
  oceanBase: "#020e1f",
  oceanMid: "#041828",
  oceanDeep: "#061e35",
  oceanDarkest: "#040f1e",
  cardBg: "rgba(255,255,255,0.05)",
  cyan: "#06b6d4",
  cyanLight: "#22d3ee",
  cyanDark: "#0891b2",
  blue: "#2563eb",
  blueLight: "#3b82f6",
  teal: "#14b8a6",
  textMain: "#ffffff",
  textMuted: "rgba(255,255,255,0.40)",
  textMuted2: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.10)",
  divider: "rgba(255,255,255,0.05)",
};

const STATUS_BADGES = {
  Protected: "#fca5a5",
  "Endangered": "#fcd34d",
  "Critically Endangered": "#fca5a5",
  Banned: "#86efac",
  Legal: "#93c5fd",
};

const DEFAULT_FORM = {
  id: "",
  name: "",
  scientificName: "",
  description: "",
  protectionStatus: "Endangered",
  bodyShape: "Fusiform",
  tailShape: "rounded",
  finType: "",
  colorPattern: "",
  isFullyBanned: false,
  legalMinSizeCm: "",
  regions: "",
  image: "",
};

const TAIL_SHAPES = ["forked", "square", "crescent", "pointed", "rounded"];
const BODY_SHAPES = [
  "Fusiform",
  "Compressiform",
  "Depressiform",
  "Anguilliform",
  "Sagittiform",
];
const PROTECTION_STATUSES = ["Protected", "Endangered", "Critically Endangered", "Banned", "Legal"];

const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",          icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "users",     label: "User Management",    icon: Users,           path: "/admin/users"     },
  { id: "species",   label: "Species Management", icon: Fish,            path: "/admin/species"   },
  { id: "reports",   label: "Report Management",  icon: FileText,        path: "/admin/reports"   },
  { id: "cases",     label: "Case Management",    icon: Briefcase,       path: "/admin/cases"     },  
  { id: "settings",  label: "Settings",           icon: Settings,        path: "/admin/settings"  },
];

function getToken() {
  return localStorage.getItem("token");
}

function generateSpeciesId(name, scientificName) {
  const source = (name || scientificName || "species").toLowerCase().trim();
  const normalized = source.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${normalized || "species"}-${Date.now().toString().slice(-6)}`;
}

function normalizeFinTypeForLegacyEnum(value) {
  const v = (value || "").toLowerCase();
  if (v.includes("dorsal")) return "large-dorsal";
  if (v.includes("soft")) return "soft-ray";
  if (v.includes("spiny") || v.includes("pectoral") || v.includes("pelvic") || v.includes("caudal")) return "spiny";
  return "soft-ray";
}

function normalizeColorPatternForLegacyEnum(value) {
  const v = (value || "").toLowerCase();
  if (v.includes("blue") || v.includes("silver")) return "blue-silver";
  if (v.includes("brown")) return "brown";
  if (v.includes("white") || v.includes("stripe")) return "white-striped";
  if (v.includes("spot")) return "spotted";
  return "plain";
}

function resolveSpeciesImageUrl(item) {
  const raw = item?.image;
  if (!raw) return "";

  let value = raw;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]" || trimmed === "{}") return "";

    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        value = trimmed;
      }
    } else {
      value = trimmed;
    }
  }

  if (Array.isArray(value)) {
    const first = value.find(Boolean);
    value = first || "";
  }

  if (value && typeof value === "object") {
    value = value.url || value.secure_url || value.path || "";
  }

  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url) return "";

  if (/^https?:\/\//i.test(url) || url.startsWith("data:image")) return url;

  if (url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }

  return `${window.location.origin}/${url}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SpeciesModal({ open, onClose, form, setForm, onSubmit, saving, error, mode }) {
  if (!open) return null;

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${PALETTE.border}`,
    outline: "none",
    background: "rgba(255,255,255,0.06)",
    color: PALETTE.textMain,
    fontSize: 14,
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(34,211,238,0.8)",
    marginBottom: 8,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2, 14, 31, 0.78)", backdropFilter: "blur(16px)" }}>
      <div className="w-full max-w-[420px] rounded-[18px] border overflow-hidden" style={{ background: PALETTE.cardBg, borderColor: PALETTE.border, boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: PALETTE.divider }}>
          <div>
            <h3 className="text-[18px] font-bold" style={{ color: PALETTE.textMain }}>{mode === "edit" ? "Edit Species" : "Add New Species"}</h3>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center transition-colors" style={{ color: PALETTE.textMuted, background: "transparent" }}>×</button>
        </div>

        <form
          className="px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label style={labelStyle}>Common Name</label>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Scientific Name</label>
              <input value={form.scientificName} onChange={(e) => setForm((prev) => ({ ...prev, scientificName: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.protectionStatus} onChange={(e) => setForm((prev) => ({ ...prev, protectionStatus: e.target.value }))} style={inputStyle}>
                  {PROTECTION_STATUSES.map((opt) => (
                    <option key={opt} value={opt} style={{ backgroundColor: '#e5e7eb', color: '#111827' }}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Legal Min Size (cm)</label>
                <input type="number" min="0" value={form.legalMinSizeCm} onChange={(e) => setForm((prev) => ({ ...prev, legalMinSizeCm: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Body Shape</label>
                <select
                  value={form.bodyShape}
                  onChange={(e) => setForm((prev) => ({ ...prev, bodyShape: e.target.value }))}
                  style={inputStyle}
                >
                  {BODY_SHAPES.map((opt) => (
                    <option key={opt} value={opt} style={{ backgroundColor: '#e5e7eb', color: '#111827' }}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tail Shape</label>
                <select value={form.tailShape} onChange={(e) => setForm((prev) => ({ ...prev, tailShape: e.target.value }))} style={inputStyle}>
                  {TAIL_SHAPES.map((opt) => (
                    <option key={opt} value={opt} style={{ backgroundColor: '#e5e7eb', color: '#111827' }}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Fin Type</label>
                <input
                  value={form.finType}
                  onChange={(e) => setForm((prev) => ({ ...prev, finType: e.target.value }))}
                  placeholder="Enter fin type"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Color Pattern</label>
                <input
                  value={form.colorPattern}
                  onChange={(e) => setForm((prev) => ({ ...prev, colorPattern: e.target.value }))}
                  placeholder="Enter color pattern"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Regions</label>
              <input
                value={form.regions}
                onChange={(e) => setForm((prev) => ({ ...prev, regions: e.target.value }))}
                placeholder="Indian Ocean, Sri Lanka, Coastal Waters"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Image URL</label>
              <input value={form.image} onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))} style={inputStyle} />
            </div>

            <label className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm" style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.textMuted }}>
              <input
                type="checkbox"
                checked={form.isFullyBanned}
                onChange={(e) => setForm((prev) => ({ ...prev, isFullyBanned: e.target.checked }))}
              />
              Mark as fully banned
            </label>
          </div>

          {error ? <p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ border: "1px solid rgba(244,63,94,0.35)", background: "rgba(244,63,94,0.12)", color: "#fecdd3" }}>{error}</p> : null}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium transition-colors" style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.textMuted, background: "rgba(255,255,255,0.04)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${PALETTE.cyan} 0%, ${PALETTE.blue} 100%)`, boxShadow: "0 10px 24px rgba(6,182,212,0.30)" }}
            >
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSpeciesManagement() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("species");
  const [species, setSpecies] = useState([]);
  const [brokenImages, setBrokenImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, endangered: 0, banned: 0, recentlyAdded: 0 });
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const loadSpecies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/species`, {
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSpecies(list);
      setStats({
        total: list.length,
        endangered: list.filter((item) => ["Endangered", "Critically Endangered"].includes(item.protectionStatus)).length,
        banned: list.filter((item) => item.isFullyBanned).length,
        recentlyAdded: list.filter((item) => {
          const created = new Date(item.createdAt).getTime();
          return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
        }).length,
      });
    } catch {
      setSpecies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    loadSpecies();
  }, [loadSpecies, navigate]);

  const filteredSpecies = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? species.filter((item) =>
          [item.name, item.scientificName, item.protectionStatus, item.id]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q))
        )
      : species;

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [search, species]);

  const pagedSpecies = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSpecies.slice(start, start + perPage);
  }, [filteredSpecies, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredSpecies.length / perPage));

  const openAddModal = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    const normalizedBodyShape = BODY_SHAPES.includes(item.bodyShape) ? item.bodyShape : "Fusiform";
    setForm({
      id: item.id || "",
      name: item.name || "",
      scientificName: item.scientificName || "",
      description: item.description || "",
      protectionStatus: item.protectionStatus || "Endangered",
      bodyShape: normalizedBodyShape,
      tailShape: item.tailShape || "rounded",
      finType: item.finType || "",
      colorPattern: item.colorPattern || "",
      isFullyBanned: Boolean(item.isFullyBanned),
      legalMinSizeCm: item.legalMinSizeCm ?? "",
      regions: Array.isArray(item.regions) ? item.regions.join(", ") : (item.regions || ""),
      image: item.image || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const saveSpecies = async () => {
    setSaving(true);
    setFormError("");

    const generatedId = generateSpeciesId(form.name, form.scientificName);

    const payload = {
      id: editingId ? (form.id.trim() || editingId) : (form.id.trim() || generatedId),
      name: form.name.trim(),
      scientificName: form.scientificName.trim(),
      description: form.description.trim(),
      protectionStatus: form.protectionStatus,
      bodyShape: BODY_SHAPES.includes(form.bodyShape) ? form.bodyShape : "Fusiform",
      tailShape: form.tailShape,
      finType: form.finType,
      colorPattern: form.colorPattern,
      isFullyBanned: form.isFullyBanned,
      legalMinSizeCm: form.legalMinSizeCm === "" ? undefined : Number(form.legalMinSizeCm),
      regions: form.regions
        .split(",")
        .map((region) => region.trim())
        .filter(Boolean),
      image: form.image.trim(),
    };

    try {
      const url = editingId ? `${API_BASE}/species/${editingId}` : `${API_BASE}/species`;
      const method = editingId ? "PUT" : "POST";
      let res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let data = await res.json();

      const isLegacyEnumError =
        !res.ok &&
        typeof data?.message === "string" &&
        (data.message.includes("finType") || data.message.includes("colorPattern")) &&
        data.message.includes("enum");

      if (isLegacyEnumError) {
        const legacyPayload = {
          ...payload,
          finType: normalizeFinTypeForLegacyEnum(payload.finType),
          colorPattern: normalizeColorPatternForLegacyEnum(payload.colorPattern),
        };

        res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(legacyPayload),
        });
        data = await res.json();
      }

      if (!res.ok) throw new Error(data?.message || "Unable to save species");

      setModalOpen(false);
      await loadSpecies();
    } catch (error) {
      if (error?.message?.toLowerCase().includes("failed to fetch")) {
        setFormError("Cannot reach server. Start backend on port 5000 and try again.");
      } else {
        setFormError(error.message || "Unable to save species");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteSpecies = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await fetch(`${API_BASE}/species/${item.id}`, {
        method: "DELETE",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      });
      await loadSpecies();
    } catch {
      // keep it quiet here; page will refresh on next load
    }
  };

  const handleNav = (id, path) => {
    setActiveNav(id);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="species-management-page" style={{ color: PALETTE.textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        :root {
          --ocean-start: #1E3A5F;
          --ocean-end: #0C1423;
          --glass-bg: rgba(255, 255, 255, 0.08);
          --glass-border: rgba(255, 255, 255, 0.18);
        }

        .species-management-page {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(135deg, var(--ocean-start) 0%, var(--ocean-end) 100%);
          overflow: hidden;
        }

        .species-management-page::before,
        .species-management-page::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(70px);
        }

        .species-management-page::before {
          width: 380px;
          height: 380px;
          top: -120px;
          left: -100px;
          background: rgba(59, 130, 246, 0.2);
        }

        .species-management-page::after {
          width: 460px;
          height: 460px;
          right: -140px;
          bottom: -170px;
          background: rgba(30, 58, 95, 0.3);
        }

        .species-management-content {
          position: relative;
          z-index: 1;
          flex: 1;
          margin-left: 260px;
          width: calc(100% - 260px);
        }

        .species-management-layout {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100vh;
        }

        .species-sidebar {
          width: 260px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255,255,255,0.08);
          background: rgba(6, 15, 30, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          padding: 22px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 20;
          overflow-y: auto;
        }

        .species-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 16px;
          margin-bottom: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .species-nav-btn {
          width: 100%;
          border: none;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          color: rgba(255,255,255,0.62);
          background: transparent;
          transition: all 180ms ease;
          font-size: 14px;
          font-weight: 600;
        }

        .species-nav-btn:hover {
          background: rgba(255,255,255,0.06);
          color: #ffffff;
        }

        .species-nav-btn-active {
          background: rgba(34,211,238,0.14);
          color: #22d3ee;
          box-shadow: inset 0 0 0 1px rgba(34,211,238,0.28);
        }

        .species-sidebar-footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .species-page * { box-sizing: border-box; }
        .species-page { font-family: Inter, sans-serif; }
        .species-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .species-chip { border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; }
        .species-head-btn { background: linear-gradient(135deg, ${PALETTE.cyanLight}, ${PALETTE.blue}); color: #fff; box-shadow: 0 10px 24px rgba(6,182,212,0.30); }
        .species-head-btn:hover { filter: brightness(1.05); }
        .species-table th, .species-table td { padding: 14px 14px; border-bottom: 1px solid ${PALETTE.divider}; }
        .species-table th { font-size: 13px; color: ${PALETTE.textMuted}; text-align: left; background: rgba(255,255,255,0.02); }
        .species-row:hover { background: rgba(255,255,255,0.025); }
        .species-input { background: rgba(255,255,255,0.05); border: 1px solid ${PALETTE.border}; color: ${PALETTE.textMain}; }
        .species-input::placeholder { color: ${PALETTE.textMuted2}; }
      `}</style>

      <div className="species-management-layout">
        <aside className="species-sidebar">
          <div className="species-sidebar-logo">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.24), rgba(37,99,235,0.24))", border: "1px solid rgba(34,211,238,0.28)" }}>
              <Fish size={18} style={{ color: "#22d3ee" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>AquaShield</p>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Admin Panel</p>
            </div>
          </div>

          {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              type="button"
              className={`species-nav-btn ${activeNav === id ? "species-nav-btn-active" : ""}`}
              onClick={() => handleNav(id, path)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}

          <div className="species-sidebar-footer">
            <button type="button" className="species-nav-btn" onClick={handleLogout}>
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="species-management-content species-page mx-auto max-w-[1180px] px-4 py-5 md:px-6 md:py-6">
          <header className="species-card flex items-center justify-between gap-4 rounded-3xl px-5 py-4 md:px-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ border: `1px solid ${PALETTE.border}`, background: "rgba(255,255,255,0.04)", color: PALETTE.cyanLight }}>
              <LayoutGrid size={12} /> Admin Panel
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight" style={{ color: PALETTE.textMain }}>Species Management</h1>
            <p className="mt-1 text-sm" style={{ color: PALETTE.textMuted }}>Manage fish species, conservation status and taxonomy</p>
          </div>
          <button onClick={openAddModal} className="species-head-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold">
            <Plus size={16} /> Add New Species
          </button>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="species-card rounded-2xl p-4 md:p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(34,211,238,0.12)", color: PALETTE.cyanLight, border: `1px solid rgba(34,211,238,0.18)` }}><Fish size={18} /></div>
            <p className="text-sm" style={{ color: PALETTE.textMuted }}>Total Species</p>
            <p className="text-3xl font-extrabold" style={{ color: PALETTE.textMain }}>{stats.total}</p>
          </div>
          <div className="species-card rounded-2xl p-4 md:p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(6,182,212,0.10)", color: PALETTE.cyanLight, border: `1px solid rgba(6,182,212,0.18)` }}><AlertCircle size={18} /></div>
            <p className="text-sm" style={{ color: PALETTE.textMuted }}>Endangered</p>
            <p className="text-3xl font-extrabold" style={{ color: PALETTE.textMain }}>{stats.endangered}</p>
          </div>
          <div className="species-card rounded-2xl p-4 md:p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(20,184,166,0.10)", color: PALETTE.teal, border: `1px solid rgba(20,184,166,0.18)` }}><CalendarDays size={18} /></div>
            <p className="text-sm" style={{ color: PALETTE.textMuted }}>Recently Added</p>
            <p className="text-3xl font-extrabold" style={{ color: PALETTE.textMain }}>{stats.recentlyAdded}</p>
          </div>
          <div className="species-card rounded-2xl p-4 md:p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(37,99,235,0.10)", color: PALETTE.blueLight, border: `1px solid rgba(37,99,235,0.18)` }}><Trash2 size={18} /></div>
            <p className="text-sm" style={{ color: PALETTE.textMuted }}>Fully Banned</p>
            <p className="text-3xl font-extrabold" style={{ color: PALETTE.textMain }}>{stats.banned}</p>
          </div>
        </section>

        <section className="species-card mt-5 rounded-3xl overflow-hidden">
          <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6" style={{ borderBottom: `1px solid ${PALETTE.divider}` }}>
            <div>
              <h2 className="text-xl font-extrabold" style={{ color: PALETTE.textMain }}>Species Management</h2>
              <p className="text-sm" style={{ color: PALETTE.textMuted }}>Search, add, edit, and delete species</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-[320px]">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: PALETTE.textMuted }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search species..."
                  className="species-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none transition"
                />
              </div>
              <button onClick={openAddModal} className="species-head-btn hidden shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold md:inline-flex">
                <Plus size={16} /> Add New Species
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="species-table w-full min-w-[1040px] border-collapse">
                  <thead>
                    <tr>
                      <th className="w-[32px]"><input type="checkbox" /></th>
                      <th>Image</th>
                      <th>Common Name</th>
                      <th>Scientific Name</th>
                      <th>Status</th>
                      <th>Body Shape</th>
                      <th>Tail Shape</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSpecies.map((item) => (
                      <tr key={item._id || item.id} className="species-row">
                        <td><input type="checkbox" /></td>
                        <td>
                          {resolveSpeciesImageUrl(item) && !brokenImages[item._id || item.id] ? (
                            <img
                              src={resolveSpeciesImageUrl(item)}
                              alt={item.name || "Species"}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                objectFit: "cover",
                                border: `1px solid ${PALETTE.border}`,
                                background: "rgba(255,255,255,0.04)",
                              }}
                              onError={(e) => {
                                const key = item._id || item.id;
                                if (key) {
                                  setBrokenImages((prev) => ({ ...prev, [key]: true }));
                                }
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${PALETTE.border}`,
                                background: "rgba(255,255,255,0.04)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: PALETTE.textMuted,
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              N/A
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.id}</div>
                        </td>
                        <td className="text-slate-600">{item.scientificName}</td>
                        <td>
                          <span className="species-chip" style={{ background: `${STATUS_BADGES[item.protectionStatus] || "#dbeafe"}22`, color: STATUS_BADGES[item.protectionStatus] || "#334155" }}>
                            {item.protectionStatus}
                          </span>
                        </td>
                        <td style={{ color: PALETTE.textMuted }}>{item.bodyShape}</td>
                        <td style={{ color: PALETTE.textMuted }}>{item.tailShape}</td>
                        <td>
                          <div className="flex items-center gap-3 text-sm font-medium">
                            <button onClick={() => openEditModal(item)} className="inline-flex items-center gap-1" style={{ color: PALETTE.cyanLight }}>
                              <Pencil size={14} /> Edit
                            </button>
                            <button onClick={() => deleteSpecies(item)} className="inline-flex items-center gap-1" style={{ color: "#fb7185" }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pagedSpecies.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-14 text-center" style={{ color: PALETTE.textMuted }}>No species found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-6" style={{ borderTop: `1px solid ${PALETTE.divider}` }}>
                <p className="text-sm" style={{ color: PALETTE.textMuted }}>
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-40"
                    style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.textMuted, background: "rgba(255,255,255,0.04)" }}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-40"
                    style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.textMuted, background: "rgba(255,255,255,0.04)" }}
                    disabled={page >= totalPages}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        </div>
      </div>

      <SpeciesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        setForm={setForm}
        onSubmit={saveSpecies}
        saving={saving}
        error={formError}
        mode={editingId ? "edit" : "create"}
      />
    </div>
  );
}