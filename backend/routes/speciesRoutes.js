import express from "express";
import {
    createSpecies,
    updateSpecies,
    deleteSpecies,
    getAllSpecies,
    getSpeciesById,
    findSpecies
} from "../controllers/speciesController.js";

const router = express.Router();

// 👑 ADMIN ONLY - protected routes
router.post("/", createSpecies);
router.put("/:id", updateSpecies);
router.delete("/:id", deleteSpecies);

// 👤 PUBLIC - anyone can access
router.get("/", getAllSpecies);
router.get("/filter", findSpecies);
router.get("/:id", getSpeciesById);

export default router;