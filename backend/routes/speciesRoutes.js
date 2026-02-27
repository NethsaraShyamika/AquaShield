import express from "express";
import {
  createSpecies,
  updateSpecies,
  deleteSpecies,
  getSpeciesById,
  getAllSpecies,
  findSpecies,
  // --- ADD THESE ---
  searchGBIFSpecies,
  getGBIFEnrichedData,
  getEnrichedSpeciesById,
} from "../controllers/speciesController.js";
import authenticateUser from "../middlewares/authentication.js";
import { isAdmin } from "../controllers/userController.js";

const router = express.Router();

// ⚠️ GBIF routes FIRST — before /:id to avoid conflicts
router.get("/gbif/search", searchGBIFSpecies);
router.get("/gbif/:gbifKey", getGBIFEnrichedData);

// Existing routes
router.get("/find", findSpecies);
router.get("/", getAllSpecies);
router.get("/:id", getSpeciesById);
router.get("/:id/enrich", getEnrichedSpeciesById); // merged local + GBIF

router.post("/", authenticateUser, isAdmin, createSpecies);
router.put("/:id", authenticateUser, isAdmin, updateSpecies);
router.delete("/:id", authenticateUser, isAdmin, deleteSpecies);

export default router;