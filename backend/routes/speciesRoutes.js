import express from "express";
import {
    createSpecies,
    updateSpecies,
    deleteSpecies,
    getAllSpecies,
    getSpeciesById,
    findSpecies
} from "../controllers/speciesController.js";
import authenticateUser from "../middlewares/authentication.js";
import { isAdmin } from "../controllers/userController.js";

const router = express.Router();

// 👑 ADMIN ONLY - protected routes
router.post("/", authenticateUser, createSpecies);
router.put("/:id", authenticateUser, updateSpecies);
router.delete("/:id", authenticateUser, deleteSpecies);

// 👤 PUBLIC - anyone can access
router.get("/", getAllSpecies);
router.get("/filter", findSpecies);
router.get("/:id", getSpeciesById);

export default router;