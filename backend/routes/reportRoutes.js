import express from "express";
import {
  createReport,
  getMyReports,
  getMyReportById,
  updateMyReport,
  deleteMyReport,
  getAllReports,
  getReportById,
  updateReportStatus,
} from "../controllers/reportController.js";
import authenticateUser from "../middlewares/authentication.js";
import { isAdmin } from "../controllers/userController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/", authenticateUser, upload.array("evidence", 5), createReport);
router.get("/my", authenticateUser, getMyReports);
router.get("/my/:id", authenticateUser, getMyReportById);
router.put("/my/:id", authenticateUser, upload.array("evidence", 5), updateMyReport);
router.delete("/my/:id", authenticateUser, deleteMyReport);

router.get("/", authenticateUser, isAdmin, getAllReports);
router.get("/:id", authenticateUser, isAdmin, getReportById);
router.patch("/:id/status", authenticateUser, isAdmin, updateReportStatus);

export default router;