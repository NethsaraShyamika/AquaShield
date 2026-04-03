import { useCallback, useEffect, useMemo, useState } from "react";
import UserDashboard from "./pages/UserDashboard";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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

function App() {
  const [activeView, setActiveView] = useState("dashboard");
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
  const [identifyQuery, setIdentifyQuery] = useState("");
  const [identifyBodyShape, setIdentifyBodyShape] = useState("");

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

  const identifyMatches = useMemo(() => {
    const query = identifyQuery.trim().toLowerCase();

    return speciesCatalog
      .filter((item) => {
        const shapeMatch = identifyBodyShape ? item.bodyShape === identifyBodyShape : true;
        if (!shapeMatch) return false;
        if (!query) return true;

        const commonName = (item.name || "").toLowerCase();
        const scientificName = (item.scientificName || "").toLowerCase();
        return commonName.includes(query) || scientificName.includes(query);
      })
      .slice(0, 18);
  }, [identifyBodyShape, identifyQuery, speciesCatalog]);

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

  const openIdentifyView = () => {
    setActiveView("identify");
  };

  const openDashboardView = () => {
    setActiveView("dashboard");
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
      {activeView === "dashboard" ? (
        <UserDashboard
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
        />
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
      {complaintStatus.success ? <p className="success-banner">{complaintStatus.success}</p> : null}

      {activeView === "identify" ? (
        <section className="identify-shell card-reveal delay-2">
          <div className="section-head">
            <h2>Identify Species</h2>
            <button className="inline-link" type="button" onClick={openDashboardView}>
              Back to dashboard →
            </button>
          </div>

          <p className="identify-note">
            Search by fish name. If you are not sure, select body shape to narrow the results.
          </p>

          <label className="identify-label" htmlFor="identify-search">
            Search by fish name
          </label>
          <input
            id="identify-search"
            className="identify-input"
            type="text"
            placeholder="e.g. Tuna, Mackerel, Coral Trout"
            value={identifyQuery}
            onChange={(e) => setIdentifyQuery(e.target.value)}
          />

          <div className="identify-filters">
            <p>Body shape</p>
            <div className="pills">
              <button
                type="button"
                className={`pill ${identifyBodyShape === "" ? "pill-active" : ""}`}
                onClick={() => setIdentifyBodyShape("")}
              >
                All
              </button>
              {BODY_SHAPES.map((shape) => (
                <button
                  key={`identify-${shape}`}
                  type="button"
                  className={`pill ${identifyBodyShape === shape ? "pill-active" : ""}`}
                  onClick={() => setIdentifyBodyShape(shape)}
                >
                  {toTitleCase(shape)}
                </button>
              ))}
            </div>
          </div>

          {identifyMatches.length === 0 ? (
            <p className="empty-state">No species found. Try another name or body shape.</p>
          ) : (
            <div className="identify-grid">
              {identifyMatches.map((item) => (
                <article key={item._id || item.id} className="identify-card">
                  <h3>{item.name}</h3>
                  <p>{item.scientificName}</p>
                  <div className="identify-meta-row">
                    <span className="chip chip-blue">{toTitleCase(item.bodyShape || "unknown")}</span>
                    <span className={`chip ${item.isFullyBanned ? "chip-red" : "chip-amber"}`}>
                      {item.isFullyBanned ? "Banned" : item.protectionStatus || "Status unknown"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeView === "dashboard" && isComplaintOpen ? (
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
}

export default App;