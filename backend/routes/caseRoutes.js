import express from "express";

const router = express.Router();
import * as caseController from "../controllers/caseController.js";

// CREATE
router.post("/", caseController.createCase);

// READ ALL
router.get("/", caseController.getAllCases);

// READ ONE
router.get("/:id", caseController.getCaseById);

// UPDATE
router.put("/:id", caseController.updateCase);

// DELETE
router.delete("/:id", caseController.deleteCase);

export default router;