import React from "react";
import { Fish, Search } from "lucide-react";

// Standalone helpers
const IDENTIFY_BODY_SHAPES = ["Fusiform", "Compressiform", "Depressiform", "Anguilliform", "Sagittiform"];
const BODY_SHAPE_REFERENCES = {
  Fusiform:       { description: "Streamlined, spindle-shaped body. Pointed at both ends, widens in the middle.", image: "/fusiform-reference.png" },
  Compressiform:  { description: "Flattened side-to-side, like a pancake. High and narrow body.",                image: "/compressiform-reference.png" },
  Depressiform:   { description: "Flattened top to bottom, like a stingray. Wide and flat body.",                image: "/depressiform-reference.png" },
  Anguilliform:   { description: "Snake-like, elongated and thin. Wavy, sinuous body.",                          image: "/anguilliform-reference.png" },
  Sagittiform:    { description: "Arrow-shaped body. Pointed head with triangular tail.",                        image: "/sagittiform-reference.png" },
};
const TAIL_SHAPES = ["crescent", "forked", "rounded", "square", "pointed"];
const TAIL_SHAPE_REFERENCES = {
  Rounded: { description: "Rounded tail shape with a smooth, curved edge.",    image: "/rounded-tail-reference.png"  },
  Crescent:{ description: "Crescent tail shape with a curved, moon-like edge.",image: "/crescent-tail-reference.png" },
  Forked:  { description: "Forked tail shape with a split end.",                image: "/forked-tail-reference.png"   },
  Square:  { description: "Square tail shape with a straight, flat end.",       image: "/square-tail-reference.png"   },
  Pointed: { description: "Pointed tail shape with a narrow, sharp end.",       image: "/pointed-tail-reference.png"  },
};
function toSpeciesKey(item) {
  return String(item?._id || item?.id || item?.scientificName || item?.name || "");
}
function toTitleCase(value) {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function normalizeIdentifyShape(value)   { return String(value || "").trim().toLowerCase(); }
function normalizeSpeciesBodyShape(value) {
  const s = normalizeIdentifyShape(value);
  if (!s) return "";
  if (s === "torpedo" || s === "fusiform")       return "fusiform";
  if (s === "oval"    || s === "compressiform")  return "compressiform";
  if (s === "flat"    || s === "depressiform")   return "depressiform";
  if (s === "eel-like"|| s === "anguilliform")   return "anguilliform";
  if (s === "sagittiform")                       return "sagittiform";
  return s;
}
function formatBodyShapeLabel(value) {
  const n = normalizeSpeciesBodyShape(value);
  if (!n) return "Unknown";
  const map = { fusiform:"Fusiform", compressiform:"Compressiform", depressiform:"Depressiform", anguilliform:"Anguilliform", sagittiform:"Sagittiform" };
  return map[n] || (String(value||"").trim() || "Unknown");
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
  if (value && typeof value === "object") value = value.url || value.secure_url || value.path || "";
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:image")) return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
}

export default function IdentifyView({
  speciesCatalog, identifyQuery, setIdentifyQuery,
  identifyBodyShape, setIdentifyBodyShape,
  identifyTailShape, setIdentifyTailShape,
  identifyMatches, identifyFilterSummary, identifySuggestions,
  selectedIdentifySpeciesId, setSelectedIdentifySpeciesId,
  selectedIdentifySpecies, brokenIdentifyImages, setBrokenIdentifyImages,
  onBack,
}) {
  const identifyBodyShapeOptions = IDENTIFY_BODY_SHAPES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] relative">
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-[1180px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 mb-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
                <Fish size={12} /> Species Identifier
              </div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-white">Identify Species</h1>
              <p className="text-sm text-white/40 mt-1">Search by name or filter by body and tail shape</p>
            </div>
            <button type="button" onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all">
              Back
            </button>
          </div>
        </div>

       
        <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl p-6 mb-6 shadow-xl">
          {/* Search */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text" value={identifyQuery} onChange={(e) => setIdentifyQuery(e.target.value)}
              placeholder="Search by fish name e.g. Tuna, Mackerel, Coral Trout…"
              className="w-full rounded-2xl py-3 pl-10 pr-4 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
            />
            {identifyQuery.trim() && identifySuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[rgba(6,15,30,0.97)] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-20">
                {identifySuggestions.map((item) => (
                  <button key={toSpeciesKey(item)} type="button"
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-all text-white/70 hover:text-white"
                    onClick={() => { setIdentifyQuery(item.name || ""); setSelectedIdentifySpeciesId(toSpeciesKey(item)); }}>
                    <strong className="font-semibold text-white">{item.name}</strong>
                    <span className="text-xs text-white/35 italic">{item.scientificName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          
          <div className="mb-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Body Shape</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIdentifyBodyShape("")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!identifyBodyShape ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                All
              </button>
              {identifyBodyShapeOptions.map((shape) => (
                <button key={shape} type="button" onClick={() => setIdentifyBodyShape(shape)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${identifyBodyShape === shape ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                  {shape}
                </button>
              ))}
            </div>
            {identifyBodyShape && BODY_SHAPE_REFERENCES[identifyBodyShape] && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <img src={BODY_SHAPE_REFERENCES[identifyBodyShape].image} alt={`${identifyBodyShape} reference`} className="w-16 h-12 object-cover rounded-xl" />
                <p className="text-xs text-white/50">{BODY_SHAPE_REFERENCES[identifyBodyShape].description}</p>
              </div>
            )}
          </div>

          {/* Tail shape filter */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Tail Shape</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIdentifyTailShape("")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!identifyTailShape ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                All
              </button>
              {TAIL_SHAPES.map((shape) => (
                <button key={shape} type="button" onClick={() => setIdentifyTailShape(shape)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${identifyTailShape === shape ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                  {toTitleCase(shape)}
                </button>
              ))}
            </div>
            {identifyTailShape && TAIL_SHAPE_REFERENCES[toTitleCase(identifyTailShape)] && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <img src={TAIL_SHAPE_REFERENCES[toTitleCase(identifyTailShape)].image} alt={`${identifyTailShape} reference`} className="w-16 h-12 object-cover rounded-xl" />
                <p className="text-xs text-white/50">{TAIL_SHAPE_REFERENCES[toTitleCase(identifyTailShape)].description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {identifyMatches.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-16 text-center shadow-xl">
            <Fish size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No species found. Try another name, body shape, or tail shape.</p>
          </div>
        ) : (
          <>
            {identifyFilterSummary && (
              <p className="text-xs text-white/30 mb-3 px-1">Showing species for {identifyFilterSummary}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
              {identifyMatches.map((item) => {
                const key      = toSpeciesKey(item);
                const isActive = selectedIdentifySpeciesId === key;
                const imgUrl   = resolveSpeciesImageUrl(item);
                return (
                  <button key={key} type="button" onClick={() => setSelectedIdentifySpeciesId(key)}
                    className={`flex flex-col rounded-2xl overflow-hidden border transition-all text-left ${
                      isActive
                        ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_0_2px_rgba(34,211,238,0.2)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                    }`}>
                    {imgUrl && !brokenIdentifyImages[key] ? (
                      <img src={imgUrl} alt={item.name || "Species"} className="w-full h-24 object-cover"
                        onError={() => setBrokenIdentifyImages((p) => ({ ...p, [key]: true }))} />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-white/5 text-white/15 text-xs">No Image</div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-white/35 italic truncate mb-2">{item.scientificName}</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">{formatBodyShapeLabel(item.bodyShape)}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.isFullyBanned ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                          {item.isFullyBanned ? "Banned" : item.protectionStatus || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Detail card */}
        {selectedIdentifySpecies && (
          <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {resolveSpeciesImageUrl(selectedIdentifySpecies) && !brokenIdentifyImages[toSpeciesKey(selectedIdentifySpecies)] && (
                  <img
                    src={resolveSpeciesImageUrl(selectedIdentifySpecies)}
                    alt={selectedIdentifySpecies.name || "Species"}
                    className="w-full md:w-48 h-40 object-cover rounded-2xl flex-shrink-0"
                    onError={() => { const k = toSpeciesKey(selectedIdentifySpecies); setBrokenIdentifyImages((p) => ({ ...p, [k]: true })); }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-xl font-extrabold text-white">{selectedIdentifySpecies.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${selectedIdentifySpecies.isFullyBanned ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {selectedIdentifySpecies.isFullyBanned ? "Fully Banned" : selectedIdentifySpecies.protectionStatus || "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 italic mb-4">{selectedIdentifySpecies.scientificName}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Body Shape",   value: formatBodyShapeLabel(selectedIdentifySpecies.bodyShape) },
                      { label: "Tail Shape",   value: selectedIdentifySpecies.tailShape ? toTitleCase(selectedIdentifySpecies.tailShape) : "Unknown" },
                      { label: "Fin Type",     value: selectedIdentifySpecies.finType || "Not specified" },
                      { label: "Color Pattern",value: selectedIdentifySpecies.colorPattern || "Not specified" },
                      { label: "Legal Min Size",value: selectedIdentifySpecies.legalMinSizeCm ? `${selectedIdentifySpecies.legalMinSizeCm} cm` : "Not specified" },
                      { label: "Legal Season", value: selectedIdentifySpecies.legalSeason ? `${selectedIdentifySpecies.legalSeason.startMonth || "?"} – ${selectedIdentifySpecies.legalSeason.endMonth || "?"}` : "Not specified" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                        <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-white/80">{value}</p>
                      </div>
                    ))}
                  </div>
                  {(selectedIdentifySpecies.regions?.length > 0 || selectedIdentifySpecies.description) && (
                    <div className="mt-4 space-y-2">
                      {selectedIdentifySpecies.regions?.length > 0 && (
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                          <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-0.5">Regions</p>
                          <p className="text-sm text-white/70">{selectedIdentifySpecies.regions.join(", ")}</p>
                        </div>
                      )}
                      {selectedIdentifySpecies.description && (
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                          <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-0.5">Description</p>
                          <p className="text-sm text-white/70 leading-relaxed">{selectedIdentifySpecies.description.trim()}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
