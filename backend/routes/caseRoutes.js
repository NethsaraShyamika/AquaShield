import express from "express";
import * as caseController from "../controllers/caseController.js";
import authenticateUser from "../middlewares/authentication.js";

const router = express.Router();


// 🔐 Protect ALL case routes with authentication
router.use(authenticateUser);


// CREATE (Admin Only - handled inside controller)
router.post("/", caseController.createCase);

// READ ALL (Admin Only)
router.get("/", caseController.getAllCases);

// READ MY CASES (User) — list cases tied to reports owned by the authenticated user
router.get("/my", caseController.getMyCases);

// READ ONE (Admin OR Owner)
router.get("/:id", caseController.getCaseById);

// UPDATE (Admin Only)
router.put("/:id", caseController.updateCase);

// DELETE (Admin Only)
router.delete("/:id", caseController.deleteCase);


export default router;