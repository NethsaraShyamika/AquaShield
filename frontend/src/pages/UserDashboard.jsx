import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import Footer from "../components/Footer";
import EditProfile from "./EditProfile";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const STATUS_STYLES = {
  Pending: "chip chip-amber",
  "Under Review": "chip chip-blue",
  Verified: "chip chip-green",
  Dismissed: "chip chip-gray",
  Resolved: "chip chip-emerald",
};

const statusStageMap = {
  Pending: 1,
  "Under Review": 2,
  Verified: 3,
  Resolved: 4,
  Dismissed: 4,
};

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const BODY_SHAPES = ["torpedo", "oval", "flat", "eel-like", "box-like"];
const IDENTIFY_BODY_SHAPES = [
  "Fusiform",
  "Compressiform",
  "Depressiform",
  "Anguilliform",
  "Sagittiform",
];
const BODY_SHAPE_REFERENCES = {
  Fusiform: {
    description: "Streamlined, spindle-shaped body. Pointed at both ends, widens in the middle.",
    image: "/fusiform-reference.png",
  },
  Compressiform: {
    description: "Flattened side-to-side, like a pancake. High and narrow body.",
    image: "/compressiform-reference.png",
  },
  Depressiform: {
    description: "Flattened top to bottom, like a stingray. Wide and flat body.",
    image: "/depressiform-reference.png",
  },
  Anguilliform: {
    description: "Snake-like, elongated and thin. Wavy, sinuous body.",
    image: "/anguilliform-reference.png",
  },
  Sagittiform: {
    description: "Arrow-shaped body. Pointed head with triangular tail.",
    image: "/sagittiform-reference.png",
  },
};
const TAIL_SHAPE_REFERENCES = {
  Rounded: { description: "Rounded tail shape with a smooth, curved edge.", image: "/rounded-tail-reference.png" },
  Crescent: { description: "Crescent tail shape with a curved, moon-like edge.", image: "/crescent-tail-reference.png" },
  Forked: { description: "Forked tail shape with a split end.", image: "/forked-tail-reference.png" },
  Square: { description: "Square tail shape with a straight, flat end.", image: "/square-tail-reference.png" },
  Pointed: { description: "Pointed tail shape with a narrow, sharp end.", image: "/pointed-tail-reference.png" },
};
const TAIL_SHAPES = ["crescent", "forked", "rounded", "square", "pointed"];
const INCIDENT_TYPES = [
  "Illegal Net Fishing",
  "Dynamite Fishing",
  "Cyanide Fishing",
  "Trawling in Protected Zone",
  "Catching Protected Species",
  "Night Fishing Violation",
  "Other",
];

function tokenFromStorage() {
  const keys = ["token", "authToken", "accessToken", "jwt"];
  for (const key of keys) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (token) {
      let normalized = token.trim();
      if (normalized.startsWith("Bearer ")) normalized = normalized.slice(7).trim();
      if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
        normalized = normalized.slice(1, -1);
      }
      return normalized;
    }
  }
  return "";
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

async function fetchJson(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function toTitleCase(value) {
  return value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function normalizeIdentifyShape(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSpeciesBodyShape(value) {
  const shape = normalizeIdentifyShape(value);
  if (!shape) return "";
  if (shape === "torpedo" || shape === "fusiform") return "fusiform";
  if (shape === "oval" || shape === "compressiform") return "compressiform";
  if (shape === "flat" || shape === "depressiform") return "depressiform";
  if (shape === "eel-like" || shape === "anguilliform") return "anguilliform";
  if (shape === "sagittiform") return "sagittiform";
  return shape;
}

function formatBodyShapeLabel(value) {
  const normalized = normalizeSpeciesBodyShape(value);
  if (!normalized) return "Unknown";
  if (normalized === "fusiform") return "Fusiform";
  if (normalized === "compressiform") return "Compressiform";
  if (normalized === "depressiform") return "Depressiform";
  if (normalized === "anguilliform") return "Anguilliform";
  if (normalized === "sagittiform") return "Sagittiform";
  return String(value || "").trim() || "Unknown";
}

function toSpeciesKey(item) {
  if (!item) return "";
  return String(item._id || item.id || item.scientificName || item.name || "");
}

function formatMonthRange(legalSeason) {
  if (!legalSeason?.startMonth || !legalSeason?.endMonth) return "Not specified";
  const monthName = (monthIndex) => new Date(2000, monthIndex - 1, 1).toLocaleString(undefined, { month: "long" });
  return `${monthName(legalSeason.startMonth)} - ${monthName(legalSeason.endMonth)}`;
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
  if (value && typeof value === "object") { value = value.url || value.secure_url || value.path || ""; }
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:image")) return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
}

function DashboardHome({
  firstName,
  isLoading,
  reportCount,
  underReviewCount,
  identifiedSpeciesCount,
  recentReports,
  protectedSpecies,
  topMatch,
  last30DaysIncidents,
  onOpenComplaintModal,
  onOpenIdentifyView,
  onViewMyReports,
  onViewReportForm,
  isProfileMenuOpen,
  onToggleProfileMenu,
  onViewProfile,       // ✅ opens EditProfile modal
  onLogout,
  profileMenuRef,
}) {
  return (
    <>
      <header className="topbar card-reveal">
        <div className="brand-block">
          <span className="shield-dot" aria-hidden="true" />
          <strong>AquaShield</strong>
        </div>

        <nav className="nav-row" aria-label="Primary">
          <button className="nav-btn nav-btn-active nav-option-animate" type="button" style={{ "--option-delay": "0ms" }}>Home</button>
          <button className="nav-btn nav-option-animate" type="button" onClick={onViewMyReports} style={{ "--option-delay": "90ms" }}>My Reports</button>
          <button className="nav-btn nav-option-animate" type="button" onClick={onOpenIdentifyView} style={{ "--option-delay": "180ms" }}>Identify Fish</button>
          <button className="nav-btn nav-option-animate" type="button" style={{ "--option-delay": "270ms" }}>Species</button>
        </nav>

        <div className="profile-container" ref={profileMenuRef}>
          <button className="avatar" type="button" onClick={onToggleProfileMenu} aria-label="Profile menu">
            {(firstName?.charAt(0) || "U").toUpperCase()}
          </button>
          {isProfileMenuOpen && (
            <div className="profile-dropdown profile-slidebar" onClick={(e) => e.stopPropagation()}>
              {/* ✅ View Profile opens EditProfile modal */}
              <button className="dropdown-item" type="button" onClick={(e) => { e.stopPropagation(); onViewProfile(); }}>
                View Profile
              </button>
            </div>
          )}
        </div>

        <button className="header-logout-btn" type="button" onClick={onLogout}>Logout</button>
      </header>

      <section className="hero card-reveal delay-1">
        <div className="hero-copy">
          <p className="hero-kicker">Good Morning, {firstName}</p>
          <h1>Protect Sri Lanka&apos;s Ocean Species</h1>
          <p className="hero-sub">Report illegal fishing or identify a species in seconds.</p>
          <div className="hero-actions">
            <button className="solid-btn" type="button" onClick={onViewReportForm}>Create Report</button>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="left-column">
          <div className="activity-metrics card-reveal delay-2">
            <article className="metric-card">
              <h3>Reports filed</h3>
              <p className="metric-value">{isLoading ? "-" : reportCount}</p>
              <small>{reportCount > 0 ? "3 resolved" : "No reports yet"}</small>
            </article>
            <article className="metric-card">
              <h3>Under review</h3>
              <p className="metric-value">{isLoading ? "-" : underReviewCount}</p>
              <small>{underReviewCount > 0 ? "1 escalated" : "All cleared"}</small>
            </article>
            <article className="metric-card">
              <h3>Species identified</h3>
              <p className="metric-value">{isLoading ? "-" : identifiedSpeciesCount}</p>
              <small>Via reports submitted</small>
            </article>
          </div>

          <section className="recent-reports card-reveal delay-4">
            <div className="section-head"><h2>Recent reports</h2></div>
            {recentReports.length === 0 && !isLoading ? <p className="empty-state">No reports submitted yet.</p> : null}
            {recentReports.map((report) => {
              const stage = statusStageMap[report.status] || 1;
              const stageText = `Step ${stage} of 4`;
              const speciesLabel = report.speciesInvolved?.[0]?.name || "Species unidentified";
              return (
                <article key={report._id} className="report-item">
                  <div className="report-head">
                    <h3>{report.incidentType}</h3>
                    <span className={STATUS_STYLES[report.status] || "chip chip-gray"}>{report.status}</span>
                  </div>
                  <p className="report-meta">Filed {formatDate(report.createdAt)}</p>
                  <p className="species-line">{speciesLabel}</p>
                  <div className="progress-track" role="progressbar" aria-valuenow={stage} aria-valuemin="1" aria-valuemax="4">
                    <span style={{ width: `${(stage / 4) * 100}%` }} />
                  </div>
                  <p className="step-label">{stageText}</p>
                </article>
              );
            })}
          </section>
        </div>

        <aside className="right-column">
          <section className="identifier-card card-reveal delay-2">
            <div className="section-head">
              <h2>Quick fish identifier</h2>
              <button className="inline-link" type="button" onClick={onOpenIdentifyView}>Full tool →</button>
            </div>
            <article className="fish-result">
              <h3>{topMatch?.name || "No species selected"}</h3>
              <p>{topMatch?.scientificName || "Adjust filters to find species."}</p>
              <button className="solid-btn identify-btn" type="button" onClick={onOpenIdentifyView}>Identify Species</button>
              <p className="identify-help">Pick a body shape and tail shape to narrow the match quickly.</p>
            </article>
          </section>

          <section className="species-card card-reveal delay-3">
            <div className="section-head"><h2>Protected species nearby</h2></div>
            <div className="species-list">
              {protectedSpecies.map((item) => (
                <article key={item._id || item.id} className="species-item">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.scientificName}</p>
                  </div>
                  <span className={`chip ${item.isFullyBanned ? "chip-red" : "chip-amber"}`}>
                    {item.isFullyBanned ? "Banned" : item.protectionStatus}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="map-card card-reveal delay-4">
            <div className="section-head"><h2>Incident map</h2></div>
            <div className="map-box">
              <p>{last30DaysIncidents} incidents near you</p>
              <small>Sri Lanka · last 30 days</small>
            </div>
          </section>
        </aside>
      </section>

      <Footer />
    </>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [reports, setReports] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [identifierResult, setIdentifierResult] = useState([]);
  const [filters, setFilters] = useState({ bodyShape: "torpedo", tailShape: "crescent" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState({ loading: false, error: "", success: "" });
  const [complaintEvidence, setComplaintEvidence] = useState([]);
  const [complaintGuess, setComplaintGuess] = useState({ bodyShape: "", tailShape: "" });
  const [complaintForm, setComplaintForm] = useState({
    incidentType: INCIDENT_TYPES[0],
    description: "",
    latitude: "",
    longitude: "",
    incidentDate: new Date().toISOString().slice(0, 16),
    speciesId: "",
  });
  const [identifyQuery, setIdentifyQuery] = useState("");
  const [identifyBodyShape, setIdentifyBodyShape] = useState("");
  const [identifyTailShape, setIdentifyTailShape] = useState("");
  const [selectedIdentifySpeciesId, setSelectedIdentifySpeciesId] = useState("");
  const [brokenIdentifyImages, setBrokenIdentifyImages] = useState({});
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // ✅ EditProfile modal state — properly inside the component
  const [showEditProfile, setShowEditProfile] = useState(false);

  const profileMenuRef = useRef(null);

  const token = useMemo(() => tokenFromStorage(), []);
  const userPayload = useMemo(() => decodeJwtPayload(token), [token]);
  const firstName = userPayload?.firstName || "Fisher";

  useEffect(() => {
    if (!token || !userPayload) navigate("/login", { replace: true });
  }, [token, userPayload, navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const speciesData = await fetchJson("/species", token);
      setSpeciesCatalog(Array.isArray(speciesData) ? speciesData : []);
      if (token) {
        const reportsData = await fetchJson("/reports/my", token);
        setReports(Array.isArray(reportsData?.reports) ? reportsData.reports : []);
      } else {
        setReports([]);
      }
    } catch (loadError) {
      setError(loadError.message || "Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  useEffect(() => {
    let ignore = false;
    const findFish = async () => {
      const params = new URLSearchParams(filters);
      try {
        const data = await fetchJson(`/species/find?${params.toString()}`, token);
        if (!ignore) setIdentifierResult(Array.isArray(data?.species) ? data.species : []);
      } catch {
        if (!ignore) setIdentifierResult([]);
      }
    };
    findFish();
    return () => { ignore = true; };
  }, [filters, token]);

  const reportCount = reports.length;
  const underReviewCount = reports.filter((item) => ["Pending", "Under Review"].includes(item.status)).length;

  const identifiedSpeciesCount = useMemo(() => {
    const speciesSet = new Set();
    reports.forEach((report) => {
      (report.speciesInvolved || []).forEach((entry) => {
        const id = entry?._id || entry?.id || entry;
        if (id) speciesSet.add(id);
      });
    });
    return speciesSet.size;
  }, [reports]);

  const recentReports = reports.slice(0, 3);

  const protectedSpecies = useMemo(() =>
    speciesCatalog.filter((item) => ["Protected", "Endangered", "Critically Endangered", "Banned"].includes(item.protectionStatus)).slice(0, 3),
    [speciesCatalog]
  );

  const last30DaysIncidents = useMemo(() => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return reports.filter((item) => new Date(item.createdAt).getTime() >= threshold).length;
  }, [reports]);

  const topMatch = identifierResult[0];

  const identifyMatches = useMemo(() => {
    const query = identifyQuery.trim().toLowerCase();
    const selectedBodyShape = normalizeSpeciesBodyShape(identifyBodyShape);
    const selectedTailShape = normalizeIdentifyShape(identifyTailShape);
    return speciesCatalog.filter((item) => {
      const itemBodyShape = normalizeSpeciesBodyShape(item.bodyShape);
      const itemTailShape = normalizeIdentifyShape(item.tailShape);
      if (selectedBodyShape && itemBodyShape !== selectedBodyShape) return false;
      if (selectedTailShape && itemTailShape !== selectedTailShape) return false;
      if (!query) return true;
      const commonName = (item.name || "").toLowerCase();
      const scientificName = (item.scientificName || "").toLowerCase();
      return commonName.includes(query) || scientificName.includes(query);
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
    const hasSelection = identifyMatches.some((item) => toSpeciesKey(item) === selectedIdentifySpeciesId);
    if (!hasSelection) setSelectedIdentifySpeciesId(toSpeciesKey(identifyMatches[0]));
  }, [identifyMatches, selectedIdentifySpeciesId]);

  const identifyBodyShapeOptions = useMemo(() => IDENTIFY_BODY_SHAPES, []);

  const identifySuggestions = useMemo(() => {
    const query = identifyQuery.trim().toLowerCase();
    if (!query) return [];
    return speciesCatalog.filter((item) => {
      const commonName = (item.name || "").toLowerCase();
      const scientificName = (item.scientificName || "").toLowerCase();
      return commonName.includes(query) || scientificName.includes(query);
    }).sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();
      const aStarts = aName.startsWith(query) ? 0 : 1;
      const bStarts = bName.startsWith(query) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aName.localeCompare(bName);
    }).slice(0, 6);
  }, [identifyQuery, speciesCatalog]);

  const guessedSpeciesMatches = useMemo(() => {
    const byBody = complaintGuess.bodyShape ? speciesCatalog.filter((item) => item.bodyShape === complaintGuess.bodyShape) : speciesCatalog;
    const byTail = complaintGuess.tailShape ? byBody.filter((item) => item.tailShape === complaintGuess.tailShape) : byBody;
    return byTail.slice(0, 6);
  }, [complaintGuess, speciesCatalog]);

  const openComplaintModal = () => { setComplaintStatus({ loading: false, error: "", success: "" }); setIsComplaintOpen(true); };
  const openIdentifyView = () => setActiveView("identify");
  const openDashboardView = () => setActiveView("dashboard");
  const onViewMyReports = () => navigate("/my-reports");
  const onViewReportForm = () => navigate("/report-form");
  const toggleProfileMenu = () => setIsProfileMenuOpen((prev) => !prev);

  // ✅ Opens EditProfile modal
  const handleViewProfile = () => {
    setIsProfileMenuOpen(false);
    setShowEditProfile(true);
  };

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsProfileMenuOpen(false);
    const keys = ["token", "authToken", "accessToken", "jwt", "user", "userData", "role"];
    keys.forEach((key) => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
      if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    fetch(`${API_BASE_URL}/users/logout`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
    navigate("/login", { replace: true });
    window.location.replace("/login");
  };

  const closeComplaintModal = () => { if (complaintStatus.loading) return; setIsComplaintOpen(false); };
  const updateComplaintField = (field, value) => setComplaintForm((prev) => ({ ...prev, [field]: value }));
  const updateComplaintGuess = (field, value) => setComplaintGuess((prev) => ({ ...prev, [field]: value }));
  const updateComplaintEvidence = (files) => setComplaintEvidence(Array.from(files || []).slice(0, 5));

  const setCurrentLocation = () => {
    if (!navigator.geolocation) { setComplaintStatus((prev) => ({ ...prev, error: "Geolocation is not available in this browser." })); return; }
    setComplaintStatus((prev) => ({ ...prev, error: "", success: "" }));
    navigator.geolocation.getCurrentPosition(
      (position) => setComplaintForm((prev) => ({ ...prev, latitude: String(position.coords.latitude.toFixed(6)), longitude: String(position.coords.longitude.toFixed(6)) })),
      () => setComplaintStatus((prev) => ({ ...prev, error: "Unable to fetch your location. Please enter coordinates manually." }))
    );
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    if (complaintForm.description.trim().length < 20) { setComplaintStatus({ loading: false, error: "Description must be at least 20 characters.", success: "" }); return; }
    if (!complaintForm.latitude || !complaintForm.longitude) { setComplaintStatus({ loading: false, error: "Location coordinates are required.", success: "" }); return; }
    setComplaintStatus({ loading: true, error: "", success: "" });
    const formData = new FormData();
    formData.append("incidentType", complaintForm.incidentType);
    formData.append("description", complaintForm.description.trim());
    formData.append("latitude", complaintForm.latitude.trim());
    formData.append("longitude", complaintForm.longitude.trim());
    if (complaintForm.incidentDate) formData.append("incidentDate", new Date(complaintForm.incidentDate).toISOString());
    if (complaintForm.speciesId) formData.append("speciesInvolved", JSON.stringify([complaintForm.speciesId]));
    complaintEvidence.forEach((file) => formData.append("evidence", file));
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/reports`, { method: "POST", headers, body: formData });
      let payload = null;
      try { payload = await response.json(); } catch { payload = null; }
      if (!response.ok) throw new Error(payload?.message || "Failed to submit report.");
      setComplaintStatus({ loading: false, error: "", success: "Report submitted successfully." });
      setComplaintForm({ incidentType: INCIDENT_TYPES[0], description: "", latitude: "", longitude: "", incidentDate: new Date().toISOString().slice(0, 16), speciesId: "" });
      setComplaintGuess({ bodyShape: "", tailShape: "" });
      setComplaintEvidence([]);
      setIsComplaintOpen(false);
      await loadDashboardData();
    } catch (submitError) {
      setComplaintStatus({ loading: false, error: submitError.message || "Failed to submit report.", success: "" });
    }
  };

  return (
    <main className="dashboard-shell">

      {/* ✅ EditProfile Modal — properly placed at the top level */}
      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onUpdated={(updatedUser) => {
            console.log("Profile updated:", updatedUser);
            setShowEditProfile(false);
          }}
        />
      )}

      {activeView === "dashboard" ? (
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
          onOpenComplaintModal={openComplaintModal}
          onOpenIdentifyView={openIdentifyView}
          onViewMyReports={onViewMyReports}
          onViewReportForm={onViewReportForm}
          isProfileMenuOpen={isProfileMenuOpen}
          onToggleProfileMenu={toggleProfileMenu}
          onViewProfile={handleViewProfile}
          onLogout={handleLogout}
          profileMenuRef={profileMenuRef}
        />
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
      {complaintStatus.success ? <p className="success-banner">{complaintStatus.success}</p> : null}

      {activeView === "identify" ? (
        <section className="identify-shell card-reveal delay-2">
          <div className="section-head">
            <h2>Identify Species</h2>
            <button className="inline-link" type="button" onClick={openDashboardView}>Back to dashboard →</button>
          </div>
          <p className="identify-note">Search by fish name. If you are not sure, select body shape to narrow the results.</p>
          <label className="identify-label" htmlFor="identify-search">Search by fish name</label>
          <input id="identify-search" className="identify-input" type="text" placeholder="e.g. Tuna, Mackerel, Coral Trout" value={identifyQuery} onChange={(e) => setIdentifyQuery(e.target.value)} />
          {identifyQuery.trim() && identifySuggestions.length > 0 ? (
            <div className="identify-suggestion-list" role="listbox" aria-label="Species suggestions">
              {identifySuggestions.map((item) => (
                <button key={`identify-suggestion-${item._id || item.id || item.name}`} type="button" className="identify-suggestion-item"
                  onClick={() => { setIdentifyQuery(item.name || ""); setSelectedIdentifySpeciesId(toSpeciesKey(item)); }}>
                  <strong>{item.name}</strong>
                  <span>{item.scientificName}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="identify-filters">
            <p>Body shape</p>
            <div className="pills">
              <button type="button" className={`pill ${identifyBodyShape === "" ? "pill-active" : ""}`} onClick={() => setIdentifyBodyShape("")}>All</button>
              {identifyBodyShapeOptions.map((shape) => (
                <button key={`identify-${shape}`} type="button" className={`pill ${identifyBodyShape === shape ? "pill-active" : ""}`} onClick={() => setIdentifyBodyShape(shape)}>{shape}</button>
              ))}
            </div>
            {identifyBodyShape && BODY_SHAPE_REFERENCES[identifyBodyShape] ? (
              <div className="body-shape-reference">
                <img src={BODY_SHAPE_REFERENCES[identifyBodyShape].image} alt={`${identifyBodyShape} body shape reference`} className="body-shape-reference-image" />
                <p className="body-shape-reference-text">{BODY_SHAPE_REFERENCES[identifyBodyShape].description}</p>
              </div>
            ) : null}
          </div>
          <div className="identify-filters">
            <p>Tail shape</p>
            <div className="pills">
              <button type="button" className={`pill ${identifyTailShape === "" ? "pill-active" : ""}`} onClick={() => setIdentifyTailShape("")}>All</button>
              {TAIL_SHAPES.map((shape) => (
                <button key={`identify-tail-${shape}`} type="button" className={`pill ${identifyTailShape === shape ? "pill-active" : ""}`} onClick={() => setIdentifyTailShape(shape)}>{toTitleCase(shape)}</button>
              ))}
            </div>
            {identifyTailShape && TAIL_SHAPE_REFERENCES[identifyTailShape.charAt(0).toUpperCase() + identifyTailShape.slice(1)] ? (
              <div className="body-shape-reference">
                <img src={TAIL_SHAPE_REFERENCES[identifyTailShape.charAt(0).toUpperCase() + identifyTailShape.slice(1)].image} alt={`${identifyTailShape} tail shape reference`} className="body-shape-reference-image" />
                <p className="body-shape-reference-text">{TAIL_SHAPE_REFERENCES[identifyTailShape.charAt(0).toUpperCase() + identifyTailShape.slice(1)].description}</p>
              </div>
            ) : null}
          </div>
          {identifyMatches.length === 0 ? (
            <p className="empty-state">No species found. Try another name, body shape, or tail shape.</p>
          ) : (
            <>
              {identifyFilterSummary ? <p className="identify-filter-summary">Showing species for {identifyFilterSummary}</p> : null}
              <div className="identify-grid">
                {identifyMatches.map((item) => (
                  <button key={item._id || item.id} type="button" className={`identify-card ${selectedIdentifySpeciesId === toSpeciesKey(item) ? "identify-card-active" : ""}`}
                    onClick={() => setSelectedIdentifySpeciesId(toSpeciesKey(item))}>
                    {resolveSpeciesImageUrl(item) && !brokenIdentifyImages[toSpeciesKey(item)] ? (
                      <img src={resolveSpeciesImageUrl(item)} alt={item.name ? `${item.name} reference` : "Species reference"} className="identify-species-image"
                        onError={() => { const key = toSpeciesKey(item); setBrokenIdentifyImages((prev) => ({ ...prev, [key]: true })); }} />
                    ) : (
                      <div className="identify-species-image identify-species-image-fallback">No Image</div>
                    )}
                    <h3>{item.name}</h3>
                    <p>{item.scientificName}</p>
                    <div className="identify-meta-row">
                      <span className="chip chip-blue">{formatBodyShapeLabel(item.bodyShape)}</span>
                      <span className={`chip ${item.isFullyBanned ? "chip-red" : "chip-amber"}`}>{item.isFullyBanned ? "Banned" : item.protectionStatus || "Status unknown"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          {selectedIdentifySpecies ? (
            <article className="identify-detail-card">
              {resolveSpeciesImageUrl(selectedIdentifySpecies) && !brokenIdentifyImages[toSpeciesKey(selectedIdentifySpecies)] ? (
                <img src={resolveSpeciesImageUrl(selectedIdentifySpecies)} alt={selectedIdentifySpecies.name ? `${selectedIdentifySpecies.name} full reference` : "Selected species"} className="identify-detail-image"
                  onError={() => { const key = toSpeciesKey(selectedIdentifySpecies); setBrokenIdentifyImages((prev) => ({ ...prev, [key]: true })); }} />
              ) : null}
              <div className="section-head">
                <h3>{selectedIdentifySpecies.name}</h3>
                <span className={`chip ${selectedIdentifySpecies.isFullyBanned ? "chip-red" : "chip-amber"}`}>{selectedIdentifySpecies.isFullyBanned ? "Fully Banned" : selectedIdentifySpecies.protectionStatus || "Status unknown"}</span>
              </div>
              <p className="identify-scientific-name">{selectedIdentifySpecies.scientificName}</p>
              <div className="identify-detail-grid">
                <p><strong>Body Shape:</strong> {formatBodyShapeLabel(selectedIdentifySpecies.bodyShape)}</p>
                <p><strong>Tail Shape:</strong> {selectedIdentifySpecies.tailShape ? toTitleCase(selectedIdentifySpecies.tailShape) : "Unknown"}</p>
                <p><strong>Fin Type:</strong> {selectedIdentifySpecies.finType || "Not specified"}</p>
                <p><strong>Color Pattern:</strong> {selectedIdentifySpecies.colorPattern || "Not specified"}</p>
                <p><strong>Legal Min Size:</strong> {selectedIdentifySpecies.legalMinSizeCm ? `${selectedIdentifySpecies.legalMinSizeCm} cm` : "Not specified"}</p>
                <p><strong>Legal Season:</strong> {formatMonthRange(selectedIdentifySpecies.legalSeason)}</p>
                <p className="identify-detail-full"><strong>Regions:</strong> {Array.isArray(selectedIdentifySpecies.regions) && selectedIdentifySpecies.regions.length > 0 ? selectedIdentifySpecies.regions.join(", ") : "Not specified"}</p>
                <p className="identify-detail-full"><strong>Description:</strong> {selectedIdentifySpecies.description?.trim() || "No description available."}</p>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {activeView === "dashboard" && isComplaintOpen ? (
        <section className="report-form-panel card-reveal" role="region" aria-label="Create illegal fish report">
          <div className="complaint-modal complaint-modal-inline">
            <div className="modal-header">
              <h2>Create Illegal Fish Report</h2>
              <button className="modal-close" type="button" onClick={closeComplaintModal}>Cancel</button>
            </div>
            <form className="complaint-form" onSubmit={submitComplaint}>
              <label>Incident Type
                <select value={complaintForm.incidentType} onChange={(e) => updateComplaintField("incidentType", e.target.value)}>
                  {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label>Description
                <textarea rows={4} minLength={20} placeholder="Describe what happened, vessel type, time, and severity..." value={complaintForm.description} onChange={(e) => updateComplaintField("description", e.target.value)} required />
              </label>
              <div className="form-row">
                <label>Latitude <input type="number" step="any" placeholder="6.9271" value={complaintForm.latitude} onChange={(e) => updateComplaintField("latitude", e.target.value)} required /></label>
                <label>Longitude <input type="number" step="any" placeholder="79.8612" value={complaintForm.longitude} onChange={(e) => updateComplaintField("longitude", e.target.value)} required /></label>
              </div>
              <div className="form-row form-row-bottom">
                <label>Incident Date <input type="datetime-local" value={complaintForm.incidentDate} onChange={(e) => updateComplaintField("incidentDate", e.target.value)} /></label>
                <label>Species (optional)
                  <select value={complaintForm.speciesId} onChange={(e) => updateComplaintField("speciesId", e.target.value)}>
                    <option value="">Not sure</option>
                    {speciesCatalog.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>)}
                  </select>
                </label>
              </div>
              <section className="species-helper">
                <h3>Not sure which species?</h3>
                <p>Use body shape and tail shape to find likely species, then select one.</p>
                <div className="helper-filter-block">
                  <span>Body shape</span>
                  <div className="pills">
                    {BODY_SHAPES.map((shape) => (
                      <button key={`complaint-${shape}`} type="button" onClick={() => updateComplaintGuess("bodyShape", shape)} className={`pill ${complaintGuess.bodyShape === shape ? "pill-active" : ""}`}>{toTitleCase(shape)}</button>
                    ))}
                  </div>
                </div>
                <div className="helper-filter-block">
                  <span>Tail shape</span>
                  <div className="pills">
                    {TAIL_SHAPES.map((shape) => (
                      <button key={`complaint-tail-${shape}`} type="button" onClick={() => updateComplaintGuess("tailShape", shape)} className={`pill ${complaintGuess.tailShape === shape ? "pill-active" : ""}`}>{toTitleCase(shape)}</button>
                    ))}
                  </div>
                </div>
                <div className="helper-results">
                  {guessedSpeciesMatches.length === 0 ? (
                    <p className="file-hint">No species matches for this shape combination.</p>
                  ) : (
                    guessedSpeciesMatches.map((item) => {
                      const selected = complaintForm.speciesId === (item._id || item.id);
                      return (
                        <button key={item._id || item.id} type="button" className={`guess-item ${selected ? "guess-item-selected" : ""}`} onClick={() => updateComplaintField("speciesId", item._id || item.id)}>
                          <strong>{item.name}</strong>
                          <span>{item.scientificName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
              <label>Evidence (optional, up to 5 files)
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => updateComplaintEvidence(e.target.files)} />
              </label>
              {complaintEvidence.length > 0 ? <p className="file-hint">Selected: {complaintEvidence.map((file) => file.name).join(", ")}</p> : <p className="file-hint">No evidence selected.</p>}
              {complaintStatus.error ? <p className="form-error">{complaintStatus.error}</p> : null}
              <div className="form-actions">
                <button type="button" className="ghost-btn" onClick={setCurrentLocation}>Use My Location</button>
                <button type="submit" className="solid-btn" disabled={complaintStatus.loading}>{complaintStatus.loading ? "Submitting..." : "Submit Report"}</button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </main>
  );
}