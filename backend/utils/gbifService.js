const GBIF_BASE = "https://api.gbif.org/v1";

export async function searchGBIF(scientificName) {
  const res = await fetch(
    `${GBIF_BASE}/species/search?q=${encodeURIComponent(scientificName)}&rank=SPECIES&limit=5`
  );
  if (!res.ok) throw new Error("GBIF search failed");
  return res.json();
}

export async function getGBIFSpeciesDetail(gbifKey) {
  const res = await fetch(`${GBIF_BASE}/species/${gbifKey}`);
  if (!res.ok) throw new Error("GBIF detail fetch failed");
  return res.json();
}

export async function getGBIFMedia(gbifKey) {
  const res = await fetch(`${GBIF_BASE}/species/${gbifKey}/media?limit=5`);
  if (!res.ok) throw new Error("GBIF media fetch failed");
  return res.json();
}

export async function getGBIFOccurrences(gbifKey) {
  const res = await fetch(
    `${GBIF_BASE}/occurrence/search?taxonKey=${gbifKey}&limit=10&mediaType=StillImage`
  );
  if (!res.ok) throw new Error("GBIF occurrences fetch failed");
  return res.json();
}