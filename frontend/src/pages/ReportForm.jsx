import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LeafletMap from "../components/LeafletMap";
import {
  Fish,
  Shield,
  MapPin,
  Upload,
  X,
  Check,
  ChevronDown,
  ArrowLeft,
  Send,
  Loader2,
  Paperclip,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────
const INCIDENT_TYPES = [
  "Illegal Net Fishing",
  "Dynamite Fishing",
  "Cyanide Fishing",
  "Trawling in Protected Zone",
  "Catching Protected Species",
  "Night Fishing Violation",
  "Other",
];

// ─── SHARED FIELD LABEL ───────────────────────────────────────
function FieldLabel({ children, required, hint }) {
  return (
    <label className="block text-xs font-semibold text-cyan-400/80 uppercase tracking-widest mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
      {hint && (
        <span className="text-white/30 text-[10px] normal-case tracking-normal font-normal ml-1.5">
          {hint}
        </span>
      )}
    </label>
  );
}

// ─── SHARED INPUT CLASSES ─────────────────────────────────────
const inputCls =
  "w-full rounded-2xl py-2.5 px-3 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none";

// ─── COORDINATES DISPLAY ──────────────────────────────────────
function CoordinatesDisplay({ lat, lng }) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Latitude", lat],
          ["Longitude", lng],
        ].map(([label, val]) => (
          <div
            key={label}
            className={`rounded-2xl px-4 py-2.5 border transition-all ${
              val != null
                ? "bg-cyan-500/8 border-cyan-500/30"
                : "bg-white/[0.03] border-white/8"
            }`}
          >
            <p className="text-[10px] text-cyan-400/50 uppercase tracking-widest mb-0.5">
              {label}
            </p>
            <p
              className={`text-sm font-mono font-semibold ${val != null ? "text-cyan-400" : "text-white/20"}`}
            >
              {val != null ? Number(val).toFixed(6) : "— click map —"}
            </p>
          </div>
        ))}
      </div>
      {lat == null && (
        <p className="text-xs text-white/25 mt-2">
          Click anywhere on the map to drop a pin. Drag to fine-tune the
          position.
        </p>
      )}
    </div>
  );
}

// ─── SPECIES SELECT ───────────────────────────────────────────
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
    <div ref={wrapRef} className="relative">
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
        onFocus={() => setOpen(true)}
        className={inputCls}
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[rgba(6,15,30,0.97)] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-52 overflow-y-auto">
          {filtered.map((s) => {
            const sel = isSelected(s._id);
            return (
              <div
                key={s._id}
                onMouseDown={() => toggle(s)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer border-b border-white/5 last:border-0 transition-all ${
                  sel
                    ? "bg-cyan-500/12 text-cyan-400"
                    : "text-white/70 hover:bg-cyan-500/8 hover:text-white"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{s.commonName}</p>
                  {s.scientificName && (
                    <p className="text-[11px] text-white/35 italic">
                      {s.scientificName}
                    </p>
                  )}
                </div>
                {sel && (
                  <Check size={13} className="text-cyan-400 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && query.length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[rgba(6,15,30,0.97)] border border-white/15 rounded-2xl px-4 py-3 text-sm text-white/30 backdrop-blur-xl shadow-2xl">
          No species found for "{query}"
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {selected.map((s) => (
            <span
              key={s._id}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"
            >
              {s.commonName}
              <span
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(s);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer text-cyan-400/50 hover:text-red-400 hover:bg-red-500/15 transition-all"
              >
                <X size={9} />
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────
function SuccessScreen({ onReset, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] flex items-center justify-center relative overflow-hidden">
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10 text-center px-8 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center bg-teal-500/10 border border-teal-500/30">
          <Check size={36} className="text-teal-400" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-4">
          <Shield size={12} /> Submitted
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          Report Submitted
        </h2>
        <p className="text-sm text-white/40 mb-8">
          Your incident report has been received and is under review.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all"
          >
            Submit Another Report
          </button>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ReportForm() {
  const navigate = useNavigate();
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
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleFiles = (incoming) =>
    setFiles((p) => [...p, ...Array.from(incoming)].slice(0, 5));
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
      data.append("latitude", form.latitude);
      data.append("longitude", form.longitude);
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

  if (success)
    return (
      <SuccessScreen
        onReset={() => setSuccess(false)}
        onBack={() => navigate(-1)}
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none" />

      <div className="relative z-10">
        {/* ── TOPBAR ──────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] border-b border-white/10">
          <div className="max-w-[720px] mx-auto px-6 h-16 flex items-center gap-4 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                <Fish size={14} className="text-cyan-400" />
              </div>
              <span className="text-sm font-extrabold text-white">
                AquaShield
              </span>
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

        <div className="max-w-[720px] mx-auto px-6 py-8">
          {/* ── HEADER CARD ─────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 mb-6 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
              <Shield size={12} /> Secure Report Channel
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-white">
              Report Illegal Fishing
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Help protect marine ecosystems by reporting violations.
            </p>
          </div>

          {/* ── FORM CARD ───────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {/* Incident Type */}
              <div>
                <FieldLabel required>Incident Type</FieldLabel>
                <select
                  name="incidentType"
                  value={form.incidentType}
                  onChange={handleChange}
                  required
                  className={`${inputCls} ${!form.incidentType ? "text-white/25" : "text-white"}`}
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
                  className={`${inputCls} resize-none`}
                />
                <p
                  className={`text-right text-[11px] mt-1 ${form.description.length > 1800 ? "text-red-400/70" : "text-white/20"}`}
                >
                  {form.description.length} / 2000
                </p>
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
                  className={inputCls}
                />
              </div>

              {/* Location — Leaflet Map */}
              <div>
                <FieldLabel required hint="click the map to drop a pin">
                  Incident Location
                </FieldLabel>
                <div className="rounded-2xl overflow-hidden border border-white/10 relative z-0">
                  <LeafletMap
                    lat={form.latitude}
                    lng={form.longitude}
                    onChange={(lat, lng) =>
                      setForm((p) => ({ ...p, latitude: lat, longitude: lng }))
                    }
                  />
                </div>
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

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "bg-cyan-500/8 border-cyan-500/50"
                      : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Upload size={28} className="mx-auto mb-3 text-cyan-400/50" />
                  <p className="text-sm text-white/40">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-white/20 mt-1">
                    Images and videos accepted
                  </p>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/8"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Paperclip size={13} className="text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white/70 truncate font-medium">
                              {f.name}
                            </p>
                            <p className="text-[11px] text-white/30">
                              {f.type || "unknown"} ·{" "}
                              {(f.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/15 transition-all flex-shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_30px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting
                    report…
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
