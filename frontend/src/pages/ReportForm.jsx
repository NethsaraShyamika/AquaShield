import { useState, useRef, useEffect } from "react";
import LeafletMap from "../components/LeafletMap";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  "Illegal Net Fishing",
  "Dynamite Fishing",
  "Cyanide Fishing",
  "Trawling in Protected Zone",
  "Catching Protected Species",
  "Night Fishing Violation",
  "Other",
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const inputBase = {
  width: "100%",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  appearance: "none",
  colorScheme: "dark",
  transition: "border-color 0.2s",
};

const focusOn = (e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)");
const focusOff = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function FieldLabel({ children, required, hint }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 500,
        color: "rgba(103,232,249,0.8)",
        marginBottom: 6,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      {children}
      {required && <span style={{ color: "#f43f5e", marginLeft: 3 }}>*</span>}
      {hint && (
        <span
          style={{
            fontWeight: 400,
            color: "rgba(255,255,255,0.3)",
            fontSize: 11,
            textTransform: "none",
            letterSpacing: 0,
            marginLeft: 6,
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CoordinatesDisplay — shows lat/lng below the map
// ─────────────────────────────────────────────────────────────────────────────
function CoordinatesDisplay({ lat, lng }) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginTop: 8,
        }}
      >
        {[
          ["Latitude", lat],
          ["Longitude", lng],
        ].map(([lbl, val]) => (
          <div
            key={lbl}
            style={{
              background:
                val != null ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${val != null ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "8px 14px",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(103,232,249,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              {lbl}
            </div>
            <div
              style={{
                fontSize: 13,
                color: val != null ? "#22d3ee" : "rgba(255,255,255,0.2)",
                fontFamily: "monospace",
              }}
            >
              {val != null ? Number(val).toFixed(6) : "— click map —"}
            </div>
          </div>
        ))}
      </div>

      {lat == null && (
        <p
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Click anywhere on the map to drop a pin. Drag to fine-tune the
          position.
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpeciesSelect — searchable multi-select backed by /api/species
// Expects: [{ _id, commonName, scientificName? }]
// ─────────────────────────────────────────────────────────────────────────────
function SpeciesSelect({ selected, onChange }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/species", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(
    (s) =>
      s.commonName?.toLowerCase().includes(query.toLowerCase()) ||
      s.scientificName?.toLowerCase().includes(query.toLowerCase()),
  );

  const isSelected = (id) => selected.some((s) => s._id === id);

  const toggle = (species) =>
    onChange(
      isSelected(species._id)
        ? selected.filter((s) => s._id !== species._id)
        : [...selected, species],
    );

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        placeholder={
          loading ? "Loading species…" : "Search by common or scientific name…"
        }
        disabled={loading}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          focusOn(e);
        }}
        onBlur={focusOff}
        style={inputBase}
      />

      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 100,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#041828",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            overflow: "hidden",
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {filtered.map((s) => {
            const sel = isSelected(s._id);
            return (
              <div
                key={s._id}
                onMouseDown={() => toggle(s)}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  background: sel ? "rgba(6,182,212,0.12)" : "transparent",
                  color: sel ? "#22d3ee" : "rgba(255,255,255,0.75)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!sel)
                    e.currentTarget.style.background = "rgba(6,182,212,0.07)";
                }}
                onMouseLeave={(e) => {
                  if (!sel) e.currentTarget.style.background = "transparent";
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{s.commonName}</div>
                  {s.scientificName && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        fontStyle: "italic",
                        marginTop: 1,
                      }}
                    >
                      {s.scientificName}
                    </div>
                  )}
                </div>
                {sel && (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && query.length > 0 && filtered.length === 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 100,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#041828",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          No species found for "{query}"
        </div>
      )}

      {selected.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}
        >
          {selected.map((s) => (
            <span
              key={s._id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px 4px 12px",
                background: "rgba(6,182,212,0.1)",
                border: "1px solid rgba(6,182,212,0.25)",
                borderRadius: 20,
                fontSize: 12,
                color: "#67e8f9",
              }}
            >
              {s.commonName}
              <span
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(s);
                }}
                style={{
                  cursor: "pointer",
                  color: "rgba(103,232,249,0.4)",
                  fontSize: 11,
                  lineHeight: 1,
                  padding: "0 2px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#f43f5e")}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(103,232,249,0.4)")
                }
              >
                ✕
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportForm — main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportForm() {
  const [form, setForm] = useState({
    incidentType: "",
    description: "",
    incidentDate: "",
    latitude: null,
    longitude: null,
  });
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFiles = (incoming) =>
    setFiles((prev) => [...prev, ...Array.from(incoming)].slice(0, 5));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.latitude == null || form.longitude == null) {
      setError("Please drop a pin on the map to set the incident location.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      data.append("incidentType", form.incidentType);
      data.append("description", form.description);

      // GeoJSON — MongoDB stores coordinates as [longitude, latitude]
      data.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [form.longitude, form.latitude],
        }),
      );

      if (form.incidentDate) data.append("incidentDate", form.incidentDate);

      selectedSpecies.forEach((s) => data.append("speciesInvolved[]", s._id));

      files.forEach((f) => data.append("evidence", f));

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: data,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed.");
      }

      setSuccess(true);
      setForm({
        incidentType: "",
        description: "",
        incidentDate: "",
        latitude: null,
        longitude: null,
      });
      setSelectedSpecies([]);
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#020e1f" }}
      >
        <div className="text-center space-y-6 px-8">
          <div className="relative inline-flex">
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center border"
              style={{
                background: "rgba(20,184,166,0.1)",
                borderColor: "rgba(20,184,166,0.4)",
              }}
            >
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2
            className="text-3xl font-bold"
            style={{
              background: "linear-gradient(to right, #22d3ee, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Report Submitted
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Your incident report has been received and is under review.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            style={{
              background: "linear-gradient(to right, #06b6d4, #2563eb)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(6,182,212,0.3)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#020e1f" }}>
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.07), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{
              background: "rgba(6,182,212,0.08)",
              borderColor: "rgba(6,182,212,0.2)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#06b6d4" }}
            />
            <span
              className="text-sm tracking-widest uppercase"
              style={{ color: "#22d3ee" }}
            >
              Secure Report Channel
            </span>
          </div>
          <h1
            className="text-4xl font-bold mb-3"
            style={{
              background: "linear-gradient(to right, #22d3ee, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Report Illegal Fishing
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>
            Help protect marine ecosystems by reporting violations.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(to right, #06b6d4, #2563eb)",
            }}
          />

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Incident Type */}
            <div>
              <FieldLabel required>Incident Type</FieldLabel>
              <select
                name="incidentType"
                value={form.incidentType}
                onChange={handleChange}
                required
                onFocus={focusOn}
                onBlur={focusOff}
                style={{
                  ...inputBase,
                  color: form.incidentType ? "#fff" : "rgba(255,255,255,0.25)",
                }}
              >
                <option value="" disabled style={{ background: "#041828" }}>
                  Select incident type
                </option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: "#041828" }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <FieldLabel required>Description</FieldLabel>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                placeholder="Describe what you witnessed in detail… (min. 20 characters)"
                onFocus={focusOn}
                onBlur={focusOff}
                style={{ ...inputBase, resize: "none" }}
              />
              <div
                style={{
                  textAlign: "right",
                  marginTop: 4,
                  fontSize: 11,
                  color:
                    form.description.length > 1800
                      ? "rgba(244,63,94,0.7)"
                      : "rgba(255,255,255,0.2)",
                }}
              >
                {form.description.length} / 2000
              </div>
            </div>

            {/* Incident Date */}
            <div>
              <FieldLabel hint="(defaults to now if left blank)">
                Incident Date &amp; Time
              </FieldLabel>
              <input
                type="datetime-local"
                name="incidentDate"
                value={form.incidentDate}
                onChange={handleChange}
                onFocus={focusOn}
                onBlur={focusOff}
                style={inputBase}
              />
            </div>

            {/* Location — Leaflet Map */}
            <div>
              <FieldLabel required hint="click the map to drop a pin">
                Incident Location
              </FieldLabel>

              {/* Wrapper gives the map a border matching the rest of the form */}
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  // z-index context so Leaflet controls don't bleed over dropdowns
                  position: "relative",
                  zIndex: 0,
                }}
              >
                <LeafletMap
                  lat={form.latitude}
                  lng={form.longitude}
                  onChange={(lat, lng) =>
                    setForm((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                    }))
                  }
                />
              </div>

              {/* Coordinate readout sits outside the map wrapper */}
              <CoordinatesDisplay lat={form.latitude} lng={form.longitude} />
            </div>

            {/* Species Involved */}
            <div>
              <FieldLabel hint="(optional — select all that apply)">
                Species Involved
              </FieldLabel>
              <SpeciesSelect
                selected={selectedSpecies}
                onChange={setSelectedSpecies}
              />
            </div>

            {/* Evidence Upload */}
            <div>
              <FieldLabel hint="(max 5 files — images or video)">
                Evidence
              </FieldLabel>
              <div
                style={{
                  background: dragActive
                    ? "rgba(6,182,212,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: `2px dashed ${dragActive ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 12,
                  padding: "24px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <svg
                  className="w-10 h-10 mx-auto mb-3"
                  fill="none"
                  stroke="rgba(6,182,212,0.6)"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 1.092A4.5 4.5 0 0117.25 19.5H6.75z"
                  />
                </svg>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  Drop files here or click to browse
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.2)",
                    marginTop: 4,
                  }}
                >
                  Images and videos accepted
                </p>
              </div>

              {files.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {files.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "rgba(6,182,212,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "rgba(255,255,255,0.7)",
                              maxWidth: 280,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            {f.type || "unknown"} · {(f.size / 1024).toFixed(0)}{" "}
                            KB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(244,63,94,0.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontSize: 13,
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  color: "#fb7185",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(to right, #06b6d4, #2563eb)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.2s",
                boxShadow: "0 0 30px rgba(6,182,212,0.25)",
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    style={{ width: 20, height: 20 }}
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting report…
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Submit Report
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}