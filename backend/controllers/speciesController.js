import species from "../models/species.js";

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

        console.log('Filter being applied:', filter);

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
        console.error('Error in findSpecies:', error);
        res.status(500).json({ 
            message: "Error searching for species",
            error: error.message 
        });
    }
}