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

export default function UserDashboard({
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
}) {
  return (
    <>
      <header className="topbar card-reveal">
        <div className="brand-block">
          <span className="shield-dot" aria-hidden="true" />
          <strong>AquaShield</strong>
        </div>

        <nav className="nav-row" aria-label="Primary">
          <button className="nav-btn nav-btn-active nav-option-animate" type="button" style={{ "--option-delay": "0ms" }}>
            Home
          </button>
          <button className="nav-btn nav-option-animate" type="button" style={{ "--option-delay": "90ms" }}>
            My Reports
          </button>
          <button className="nav-btn nav-option-animate" type="button" onClick={onOpenIdentifyView} style={{ "--option-delay": "180ms" }}>
            Identify Fish
          </button>
          <button className="nav-btn nav-option-animate" type="button" style={{ "--option-delay": "270ms" }}>
            Species
          </button>
        </nav>

        <div className="avatar">{firstName.charAt(0).toUpperCase()}</div>
      </header>

      <section className="hero card-reveal delay-1">
        <div className="hero-copy">
          <p className="hero-kicker">Good Morning, {firstName}</p>
          <h1>Protect Sri Lanka's Ocean Species</h1>
          <p className="hero-sub">Report illegal fishing or identify a species in seconds.</p>

          <div className="hero-actions">
            <button className="solid-btn" type="button" onClick={onOpenComplaintModal}>
              Create Illegal Fish Report
            </button>
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

                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={stage}
                    aria-valuemin="1"
                    aria-valuemax="4"
                  >
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
              <button className="solid-btn identify-btn" type="button" onClick={onOpenIdentifyView}>
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
    </>
  );
}