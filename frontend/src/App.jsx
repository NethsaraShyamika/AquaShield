import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const STATUS_STYLES = {
  Pending: "chip chip-amber",
  "Under Review": "chip chip-blue",
  Verified: "chip chip-green",
  Dismissed: "chip chip-gray",
  Resolved: "chip chip-emerald",
};

const BODY_SHAPES = ["torpedo", "oval", "flat", "eel-like", "box-like"];
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

const statusStageMap = {
  Pending: 1,
  "Under Review": 2,
  Verified: 3,
  Resolved: 4,
  Dismissed: 4,
};

function tokenFromStorage() {
  const keys = ["token", "authToken", "accessToken", "jwt"];
  for (const key of keys) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (token) {
      let normalized = token.trim();
      if (normalized.startsWith("Bearer ")) {
        normalized = normalized.slice(7).trim();
      }
      if (
        (normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))
      ) {
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
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchJson(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

function toTitleCase(value) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function App() {
  const [reports, setReports] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [identifierResult, setIdentifierResult] = useState([]);
  const [filters, setFilters] = useState({ bodyShape: "torpedo", tailShape: "crescent" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [complaintEvidence, setComplaintEvidence] = useState([]);
  const [complaintGuess, setComplaintGuess] = useState({
    bodyShape: "",
    tailShape: "",
  });
  const [complaintForm, setComplaintForm] = useState({
    incidentType: INCIDENT_TYPES[0],
    description: "",
    latitude: "",
    longitude: "",
    incidentDate: new Date().toISOString().slice(0, 16),
    speciesId: "",
  });

  const token = useMemo(() => tokenFromStorage(), []);
  const userPayload = useMemo(() => decodeJwtPayload(token), [token]);
  const firstName = userPayload?.firstName || "Fisher";

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

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    let ignore = false;

    const findFish = async () => {
      const params = new URLSearchParams(filters);

      try {
        const data = await fetchJson(`/species/find?${params.toString()}`, token);
        if (!ignore) {
          setIdentifierResult(Array.isArray(data?.species) ? data.species : []);
        }
      } catch {
        if (!ignore) {
          setIdentifierResult([]);
        }
      }
    };

    findFish();

    return () => {
      ignore = true;
    };
  }, [filters, token]);

  const reportCount = reports.length;
  const underReviewCount = reports.filter((item) =>
    ["Pending", "Under Review"].includes(item.status)
  ).length;

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

  const protectedSpecies = useMemo(
    () =>
      speciesCatalog
        .filter((item) =>
          ["Protected", "Endangered", "Critically Endangered", "Banned"].includes(
            item.protectionStatus
          )
        )
        .slice(0, 3),
    [speciesCatalog]
  );

  const last30DaysIncidents = useMemo(() => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return reports.filter((item) => new Date(item.createdAt).getTime() >= threshold).length;
  }, [reports]);

  const topMatch = identifierResult[0];

  const guessedSpeciesMatches = useMemo(() => {
    const byBody = complaintGuess.bodyShape
      ? speciesCatalog.filter((item) => item.bodyShape === complaintGuess.bodyShape)
      : speciesCatalog;

    const byTail = complaintGuess.tailShape
      ? byBody.filter((item) => item.tailShape === complaintGuess.tailShape)
      : byBody;

    return byTail.slice(0, 6);
  }, [complaintGuess, speciesCatalog]);

  const openComplaintModal = () => {
    setComplaintStatus({ loading: false, error: "", success: "" });
    setIsComplaintOpen(true);
  };

  const closeComplaintModal = () => {
    if (complaintStatus.loading) return;
    setIsComplaintOpen(false);
  };

  const updateComplaintField = (field, value) => {
    setComplaintForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateComplaintGuess = (field, value) => {
    setComplaintGuess((prev) => ({ ...prev, [field]: value }));
  };

  const updateComplaintEvidence = (files) => {
    const next = Array.from(files || []).slice(0, 5);
    setComplaintEvidence(next);
  };

  const setCurrentLocation = () => {
    if (!navigator.geolocation) {
      setComplaintStatus((prev) => ({ ...prev, error: "Geolocation is not available in this browser." }));
      return;
    }

    setComplaintStatus((prev) => ({ ...prev, error: "", success: "" }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setComplaintForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude.toFixed(6)),
          longitude: String(position.coords.longitude.toFixed(6)),
        }));
      },
      () => {
        setComplaintStatus((prev) => ({
          ...prev,
          error: "Unable to fetch your location. Please enter coordinates manually.",
        }));
      }
    );
  };

  const submitComplaint = async (event) => {
    event.preventDefault();

    if (complaintForm.description.trim().length < 20) {
      setComplaintStatus({
        loading: false,
        error: "Description must be at least 20 characters.",
        success: "",
      });
      return;
    }

    if (!complaintForm.latitude || !complaintForm.longitude) {
      setComplaintStatus({
        loading: false,
        error: "Location coordinates are required.",
        success: "",
      });
      return;
    }

    setComplaintStatus({ loading: true, error: "", success: "" });

    const formData = new FormData();
    formData.append("incidentType", complaintForm.incidentType);
    formData.append("description", complaintForm.description.trim());
    formData.append("latitude", complaintForm.latitude.trim());
    formData.append("longitude", complaintForm.longitude.trim());
    if (complaintForm.incidentDate) {
      formData.append("incidentDate", new Date(complaintForm.incidentDate).toISOString());
    }
    if (complaintForm.speciesId) {
      formData.append("speciesInvolved", JSON.stringify([complaintForm.speciesId]));
    }
    complaintEvidence.forEach((file) => {
      formData.append("evidence", file);
    });

    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: "POST",
        headers,
        body: formData,
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to submit report.");
      }

      setComplaintStatus({
        loading: false,
        error: "",
        success: "Report submitted successfully.",
      });

      setComplaintForm({
        incidentType: INCIDENT_TYPES[0],
        description: "",
        latitude: "",
        longitude: "",
        incidentDate: new Date().toISOString().slice(0, 16),
        speciesId: "",
      });
      setComplaintGuess({ bodyShape: "", tailShape: "" });
      setComplaintEvidence([]);

      setIsComplaintOpen(false);
      await loadDashboardData();
    } catch (submitError) {
      setComplaintStatus({
        loading: false,
        error: submitError.message || "Failed to submit report.",
        success: "",
      });
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="topbar card-reveal">
        <div className="brand-block">
          <span className="shield-dot" aria-hidden="true" />
          <strong>AquaShield</strong>
        </div>

        <nav className="nav-row" aria-label="Primary">
          <button className="nav-btn nav-btn-active" type="button">
            Home
          </button>
          <button className="nav-btn" type="button">
            My Reports
          </button>
          <button className="nav-btn" type="button">
            Identify Fish
          </button>
          <button className="nav-btn" type="button">
            Species
          </button>
        </nav>

        <div className="avatar">{firstName.charAt(0).toUpperCase()}</div>
      </header>

      <section className="hero card-reveal delay-1">
        <div className="hero-copy">
          <p className="hero-kicker">Good Morning, {firstName}</p>
          <h1>Protect Sri Lanka&apos;s Ocean Species</h1>
          <p className="hero-sub">Report illegal fishing or identify a species in seconds.</p>

          <div className="hero-actions">
            <button className="solid-btn" type="button" onClick={openComplaintModal}>
              Create Illegal Fish Report
            </button>
          </div>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}
      {complaintStatus.success ? <p className="success-banner">{complaintStatus.success}</p> : null}

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
            <div className="section-head">
              <h2>Recent reports</h2>
            </div>

            {recentReports.length === 0 && !isLoading ? (
              <p className="empty-state">No reports submitted yet.</p>
            ) : null}

            {recentReports.map((report) => {
              const stage = statusStageMap[report.status] || 1;
              const stageText = `Step ${stage} of 4`;
              const speciesLabel = report.speciesInvolved?.[0]?.name || "Species unidentified";

              return (
                <article key={report._id} className="report-item">
                  <div className="report-head">
                    <h3>{report.incidentType}</h3>
                    <span className={STATUS_STYLES[report.status] || "chip chip-gray"}>
                      {report.status}
                    </span>
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
              <button className="inline-link" type="button">
                Full tool →
              </button>
            </div>

            <article className="fish-result">
              <h3>{topMatch?.name}</h3>
              <p>{topMatch?.scientificName || "Adjust filters to find species."}</p>
              <button className="solid-btn identify-btn" type="button">
                Identify Species
              </button>
              <p className="identify-help">
                Pick a body shape and tail shape to narrow the match quickly.
              </p>
            </article>
          </section>

          <section className="species-card card-reveal delay-3">
            <div className="section-head">
              <h2>Protected species nearby</h2>
              <button className="inline-link" type="button">
                View all →
              </button>
            </div>

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
            <div className="section-head">
              <h2>Incident map</h2>
              <button className="inline-link" type="button">
                Open map →
              </button>
            </div>

            <div className="map-box">
              <p>{last30DaysIncidents} incidents near you</p>
              <small>Sri Lanka · last 30 days</small>
            </div>
          </section>
        </aside>
      </section>

      {isComplaintOpen ? (
        <section className="report-form-panel card-reveal" role="region" aria-label="Create illegal fish report">
          <div className="complaint-modal complaint-modal-inline">
            <div className="modal-header">
              <h2>Create Illegal Fish Report</h2>
              <button className="modal-close" type="button" onClick={closeComplaintModal}>
                Cancel
              </button>
            </div>

            <form className="complaint-form" onSubmit={submitComplaint}>
              <label>
                Incident Type
                <select
                  value={complaintForm.incidentType}
                  onChange={(e) => updateComplaintField("incidentType", e.target.value)}
                >
                  {INCIDENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  rows={4}
                  minLength={20}
                  placeholder="Describe what happened, vessel type, time, and severity..."
                  value={complaintForm.description}
                  onChange={(e) => updateComplaintField("description", e.target.value)}
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    placeholder="6.9271"
                    value={complaintForm.latitude}
                    onChange={(e) => updateComplaintField("latitude", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    placeholder="79.8612"
                    value={complaintForm.longitude}
                    onChange={(e) => updateComplaintField("longitude", e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-row form-row-bottom">
                <label>
                  Incident Date
                  <input
                    type="datetime-local"
                    value={complaintForm.incidentDate}
                    onChange={(e) => updateComplaintField("incidentDate", e.target.value)}
                  />
                </label>

                <label>
                  Species (optional)
                  <select
                    value={complaintForm.speciesId}
                    onChange={(e) => updateComplaintField("speciesId", e.target.value)}
                  >
                    <option value="">Not sure</option>
                    {speciesCatalog.map((item) => (
                      <option key={item._id || item.id} value={item._id || item.id}>
                        {item.name}
                      </option>
                    ))}
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
                      <button
                        key={`complaint-${shape}`}
                        type="button"
                        onClick={() => updateComplaintGuess("bodyShape", shape)}
                        className={`pill ${complaintGuess.bodyShape === shape ? "pill-active" : ""}`}
                      >
                        {toTitleCase(shape)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="helper-filter-block">
                  <span>Tail shape</span>
                  <div className="pills">
                    {TAIL_SHAPES.map((shape) => (
                      <button
                        key={`complaint-tail-${shape}`}
                        type="button"
                        onClick={() => updateComplaintGuess("tailShape", shape)}
                        className={`pill ${complaintGuess.tailShape === shape ? "pill-active" : ""}`}
                      >
                        {toTitleCase(shape)}
                      </button>
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
                        <button
                          key={item._id || item.id}
                          type="button"
                          className={`guess-item ${selected ? "guess-item-selected" : ""}`}
                          onClick={() => updateComplaintField("speciesId", item._id || item.id)}
                        >
                          <strong>{item.name}</strong>
                          <span>{item.scientificName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              <label>
                Evidence (optional, up to 5 files)
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => updateComplaintEvidence(e.target.files)}
                />
              </label>

              {complaintEvidence.length > 0 ? (
                <p className="file-hint">Selected: {complaintEvidence.map((file) => file.name).join(", ")}</p>
              ) : (
                <p className="file-hint">No evidence selected.</p>
              )}

              {complaintStatus.error ? <p className="form-error">{complaintStatus.error}</p> : null}

              <div className="form-actions">
                <button type="button" className="ghost-btn" onClick={setCurrentLocation}>
                  Use My Location
                </button>
                <button type="submit" className="solid-btn" disabled={complaintStatus.loading}>
                  {complaintStatus.loading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </main>
  );
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './index.css'
import AdminDashboard from "./pages/AdminDashboard"
import AdminRoute from "./components/AdminRoute"
import AdminLogin from "./pages/AdminLogin"
import CaseManagement from "./pages/CaseManagement"

function App() {
  const [count, setCount] = useState(0)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Home Page */}
        <Route path="/" element={
          <>
            <section id="center" className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
              <div className="hero flex flex-col items-center gap-4 mb-6">
                <img src={heroImg} className="w-40 h-40" alt="Hero" />
                <div className="flex gap-4">
                  <img src={reactLogo} className="w-12 h-12" alt="React logo" />
                  <img src={viteLogo} className="w-12 h-12" alt="Vite logo" />
                </div>
              </div>
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold mb-2">Get started</h1>
                <p className="text-gray-700">
                  Edit <code className="bg-gray-200 px-1 rounded">src/App.jsx</code> and save to test <code className="bg-gray-200 px-1 rounded">HMR</code>
                </p>
              </div>
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => setCount(count + 1)}
              >
                Count is {count}
              </button>
            </section>
            <section id="next-steps" className="p-6 bg-white">
              <div id="docs" className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Documentation</h2>
                <p className="text-gray-600 mb-4">Your questions, answered</p>
                <ul className="flex gap-4">
                  <li>
                    <a href="https://vite.dev/" target="_blank" className="flex items-center gap-2 hover:text-blue-500">
                      <img className="w-6 h-6" src={viteLogo} alt="Vite" />
                      Explore Vite
                    </a>
                  </li>
                  <li>
                    <a href="https://react.dev/" target="_blank" className="flex items-center gap-2 hover:text-blue-500">
                      <img className="w-6 h-6" src={reactLogo} alt="React" />
                      Learn more
                    </a>
                  </li>
                </ul>
              </div>
            </section>
          </>
        } />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        {/* Case Management */}
        <Route path="/admin/cases" element={
          <AdminRoute>
            <CaseManagement />
          </AdminRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}

export default App;