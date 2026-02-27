import species from "../models/species.js";
import { searchGBIF, getGBIFSpeciesDetail, getGBIFMedia, getGBIFOccurrences } from "../utils/gbifService.js";

export async function createSpecies(req, res) {
    if (req.user == null) {
        res.status(403).json({ message: "Unauthorized Access - please login first" });
        return;
    }

    if (!req.user.isAdmin) {
        res.status(403).json({ message: "Only Admins can create species" });
        return;
    }

    try {
        const newSpecies = new species({
            id: req.body.id,
            name: req.body.name,
            scientificName: req.body.scientificName,
            bodyShape: req.body.bodyShape,
            tailShape: req.body.tailShape,
            finType: req.body.finType,
            colorPattern: req.body.colorPattern,
            protectionStatus: req.body.protectionStatus,
            isFullyBanned: req.body.isFullyBanned,
            legalMinSizeCm: req.body.legalMinSizeCm,
            legalSeason: req.body.legalSeason,
            regions: req.body.regions,
            image: req.body.image,
            description: req.body.description
        });

        await newSpecies.save();
        res.status(201).json({ message: "Species Created Successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function updateSpecies(req, res) {
    if (req.user == null) {
        res.status(403).json({ message: "Unauthorized Access - please login first" });
        return;
    }

    if (!req.user.isAdmin) {
        res.status(403).json({ message: "Only Admins can update species" });
        return;
    }

    try {
        const updated = await species.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ message: "Species not found" });
        }
        
        res.status(200).json({ 
            message: "Species Updated Successfully",
            species: updated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteSpecies(req, res) {
    try {
        const deleted = await species.findOneAndDelete({ id: req.params.id });
        if (!deleted) {
            return res.status(404).json({ message: "Species not found" });
        }
        res.status(200).json({ message: "Species Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function getSpeciesById(req, res) {
    try {
        const result = await species.findOne({ id: req.params.id });
        if (!result) {
            return res.status(404).json({ message: "Species not found" });
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function getAllSpecies(req, res) {
    try {
        const results = await species.find();
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function findSpecies(req, res) {
    try {
        const { bodyShape, tailShape, finType, colorPattern } = req.query;

        const filter = {};
        
        if (bodyShape) filter.bodyShape = bodyShape;
        if (tailShape) filter.tailShape = tailShape;
        
        if (finType) {
            const finTypes = Array.isArray(finType) ? finType : [finType];
            filter.finType = { $in: finTypes };
        }
        
        if (colorPattern) {
            const colorPatterns = Array.isArray(colorPattern) ? colorPattern : [colorPattern];
            filter.colorPattern = { $in: colorPatterns };
        }

        const results = await species.find(filter);

        if (results.length === 0) {
            return res.status(404).json({ 
                message: "No fish found matching your selection",
                selectedFilters: { bodyShape, tailShape, finType, colorPattern }
            });
        }

        res.status(200).json({
            message: "Species found successfully",
            matchCount: results.length,
            selectedFilters: { bodyShape, tailShape, finType, colorPattern },
            species: results
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Error searching for species",
            error: error.message 
        });
    }
}

// ─── GBIF FUNCTIONS ─────────────────────────────────────────────────────────

export async function searchGBIFSpecies(req, res) {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Query param 'q' is required" });

        const data = await searchGBIF(q);

        const results = data.results.map((s) => ({
            gbifKey: s.key,
            scientificName: s.scientificName,
            canonicalName: s.canonicalName,
            family: s.family,
            order: s.order,
            class: s.class,
            kingdom: s.kingdom,
            status: s.taxonomicStatus,
            rank: s.rank,
        }));

        res.status(200).json({ count: results.length, results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function getGBIFEnrichedData(req, res) {
    try {
        const { gbifKey } = req.params;

        const [detail, media, occurrences] = await Promise.all([
            getGBIFSpeciesDetail(gbifKey),
            getGBIFMedia(gbifKey),
            getGBIFOccurrences(gbifKey),
        ]);

        const images = occurrences.results
            .flatMap((o) => o.media || [])
            .filter((m) => m.type === "StillImage" && m.identifier)
            .map((m) => m.identifier)
            .slice(0, 8);

        res.status(200).json({
            gbifKey: detail.key,
            scientificName: detail.scientificName,
            canonicalName: detail.canonicalName,
            taxonomy: {
                kingdom: detail.kingdom,
                phylum: detail.phylum,
                class: detail.class,
                order: detail.order,
                family: detail.family,
                genus: detail.genus,
            },
            vernacularNames: detail.vernacularName || null,
            extinct: detail.extinct || false,
            media: media.results?.slice(0, 5) || [],
            images,
            occurrenceCount: occurrences.count,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export async function getEnrichedSpeciesById(req, res) {
    try {
        const localSpecies = await species.findOne({ id: req.params.id });
        if (!localSpecies) return res.status(404).json({ message: "Species not found" });

        const gbifSearch = await searchGBIF(localSpecies.scientificName);
        if (!gbifSearch.results?.length) {
            return res.status(200).json({ ...localSpecies.toObject(), gbif: null });
        }

        const topMatch = gbifSearch.results[0];

        const [detail, media, occurrences] = await Promise.all([
            getGBIFSpeciesDetail(topMatch.key),
            getGBIFMedia(topMatch.key),
            getGBIFOccurrences(topMatch.key),
        ]);

        const gbifImages = occurrences.results
            .flatMap((o) => o.media || [])
            .filter((m) => m.type === "StillImage" && m.identifier)
            .map((m) => m.identifier)
            .slice(0, 8);

        res.status(200).json({
            ...localSpecies.toObject(),
            gbif: {
                key: topMatch.key,
                taxonomy: {
                    kingdom: detail.kingdom,
                    phylum: detail.phylum,
                    class: detail.class,
                    order: detail.order,
                    family: detail.family,
                    genus: detail.genus,
                },
                extinct: detail.extinct || false,
                images: gbifImages,
                media: media.results?.slice(0, 5) || [],
                occurrenceCount: occurrences.count,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}