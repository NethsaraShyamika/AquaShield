import { useEffect, useMemo, useState } from "react";
import "../App.css";

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
  return new Date(value).toLocaleDateString();
}

// ✅ Get token
function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

// ✅ Decode JWT
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function UserDashboard() {
  const [reports, setReports] = useState([]);
  const [species, setSpecies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = getToken();
  const user = decodeToken(token);
  const firstName = user?.firstName || "User";

  // ✅ Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsRes, speciesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/reports/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/species`),
        ]);

        const reportsData = await reportsRes.json();
        const speciesData = await speciesRes.json();

        setReports(reportsData?.reports || []);
        setSpecies(speciesData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ Calculations
  const reportCount = reports.length;

  const underReviewCount = reports.filter((r) =>
    ["Pending", "Under Review"].includes(r.status)
  ).length;

  const identifiedSpeciesCount = useMemo(() => {
    const set = new Set();
    reports.forEach((r) =>
      r.speciesInvolved?.forEach((s) => set.add(s?._id))
    );
    return set.size;
  }, [reports]);

  const recentReports = reports.slice(0, 3);

  const protectedSpecies = species
    .filter((s) =>
      ["Protected", "Endangered", "Banned"].includes(s.protectionStatus)
    )
    .slice(0, 3);

  const last30DaysIncidents = reports.filter(
    (r) =>
      new Date(r.createdAt) >
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <main className="dashboard-shell">
      {/* HEADER */}
      <header className="topbar">
        <strong>AquaShield</strong>
        <div className="avatar">
          {firstName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <h1>Welcome, {firstName}</h1>
        <p>Protect Sri Lanka's Ocean Species</p>
      </section>

      {/* METRICS */}
      <section className="dashboard-grid">
        <div>
          <h3>Reports: {isLoading ? "-" : reportCount}</h3>
          <h3>Under Review: {underReviewCount}</h3>
          <h3>Species Identified: {identifiedSpeciesCount}</h3>
        </div>

        {/* RECENT REPORTS */}
        <div>
          <h2>Recent Reports</h2>

          {recentReports.length === 0 && !isLoading && (
            <p>No reports yet</p>
          )}

          {recentReports.map((report) => {
            const stage = statusStageMap[report.status] || 1;

            return (
              <div key={report._id}>
                <h4>{report.incidentType}</h4>
                <p>{formatDate(report.createdAt)}</p>
                <span className={STATUS_STYLES[report.status]}>
                  {report.status}
                </span>

                <div>
                  Progress: {(stage / 4) * 100}%
                </div>
              </div>
            );
          })}
        </div>

        {/* PROTECTED SPECIES */}
        <div>
          <h2>Protected Species</h2>
          {protectedSpecies.map((s) => (
            <div key={s._id}>
              <h4>{s.name}</h4>
              <p>{s.scientificName}</p>
            </div>
          ))}
        </div>

        {/* MAP */}
        <div>
          <h2>Incidents</h2>
          <p>{last30DaysIncidents} in last 30 days</p>
        </div>
      </section>
    </main>
  );
}