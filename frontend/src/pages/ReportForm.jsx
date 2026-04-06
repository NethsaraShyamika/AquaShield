import { useState, useRef } from "react";

const INCIDENT_TYPES = [
  "Illegal Net Fishing",
  "Dynamite Fishing",
  "Cyanide Fishing",
  "Trawling in Protected Zone",
  "Catching Protected Species",
  "Night Fishing Violation",
  "Other",
];

export default function ReportForm() {
  const [form, setForm] = useState({
    incidentType: "",
    description: "",
    latitude: "",
    longitude: "",
    incidentDate: "",
    speciesInvolved: "",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFiles = (incoming) => {
    const arr = Array.from(incoming).slice(0, 5);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.latitude || !form.longitude) {
      setError("Location coordinates are required.");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
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
      setForm({ incidentType: "", description: "", latitude: "", longitude: "", incidentDate: "", speciesInvolved: "" });
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020e1f" }}>
        <div className="text-center space-y-6 px-8">
          <div className="relative inline-flex">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: "radial-gradient(circle, #14b8a6, #06b6d4)" }} />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center border" style={{ background: "rgba(20,184,166,0.1)", borderColor: "rgba(20,184,166,0.4)" }}>
              <svg className="w-12 h-12" fill="none" stroke="#14b8a6" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold" style={{ background: "linear-gradient(to right, #22d3ee, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Report Submitted
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Your incident report has been received and is under review.</p>
          <button
            onClick={() => setSuccess(false)}
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
            style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)", color: "#fff", boxShadow: "0 0 20px rgba(6,182,212,0.3)" }}
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#020e1f" }}>
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07), transparent 70%)", filter: "blur(60px)" }} />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)", filter: "blur(60px)" }} />

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border" style={{ background: "rgba(6,182,212,0.08)", borderColor: "rgba(6,182,212,0.2)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#06b6d4" }} />
            <span className="text-sm tracking-widest uppercase" style={{ color: "#22d3ee" }}>Secure Report Channel</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ background: "linear-gradient(to right, #22d3ee, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Report Illegal Fishing
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Help protect marine ecosystems by reporting violations.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(to right, #06b6d4, #2563eb)" }} />
          <form onSubmit={handleSubmit} className="p-8 space-y-6">

            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>
                Incident Type <span style={{ color: "#f43f5e" }}>*</span>
              </label>
              <select
                name="incidentType"
                value={form.incidentType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 appearance-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: form.incidentType ? "#fff" : "rgba(255,255,255,0.2)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              >
                <option value="" disabled style={{ background: "#041828" }}>Select incident type</option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: "#041828" }}>{t}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>
                Description <span style={{ color: "#f43f5e" }}>*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                placeholder="Describe what you witnessed in detail... (min. 20 characters)"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 resize-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <div className="text-right mt-1 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                {form.description.length}/2000
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "latitude", label: "Latitude", placeholder: "e.g. 6.9271" },
                { name: "longitude", label: "Longitude", placeholder: "e.g. 79.8612" },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>
                    {label} <span style={{ color: "#f43f5e" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              ))}
            </div>

            {/* Incident Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>Incident Date</label>
              <input
                type="datetime-local"
                name="incidentDate"
                value={form.incidentDate}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  colorScheme: "dark",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {/* Species Involved */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>Species Involved (IDs, comma-separated)</label>
              <input
                type="text"
                name="speciesInvolved"
                value={form.speciesInvolved}
                onChange={handleChange}
                placeholder="e.g. 664abc123, 664abc456"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(34,211,238,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(103,232,249,0.8)" }}>Evidence (max 5 files)</label>
              <div
                className="rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                style={{
                  background: dragActive ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.02)",
                  border: `2px dashed ${dragActive ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.1)"}`,
                }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="rgba(6,182,212,0.6)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 1.092A4.5 4.5 0 0117.25 19.5H6.75z" />
                </svg>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Drop files here or click to browse</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Images and videos accepted</p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
                          <svg className="w-4 h-4" fill="none" stroke="#06b6d4" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                        <span className="text-sm truncate max-w-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{f.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="#f43f5e" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 relative overflow-hidden group"
              style={{
                background: "linear-gradient(to right, #06b6d4, #2563eb)",
                color: "#fff",
                boxShadow: "0 0 30px rgba(6,182,212,0.3)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Report
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}