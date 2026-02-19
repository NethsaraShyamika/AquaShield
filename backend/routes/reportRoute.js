import express from "express";

import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
} from "../controllers/reportController.js";

import authenticateUser from "../middlewares/authentication.js";

import reportValidation from "../middlewares/validations/reportValidation.js";
import { handleValidationErrors } from "../middlewares/errorHandler.js";

const reportRouter = express.Router();

reportRouter.post(
  "/",
  authenticateUser,
  reportValidation,
  handleValidationErrors,
  createReport,
);

reportRouter.get("/", authenticateUser, getReports);

reportRouter.get("/:id", authenticateUser, getReportById);

reportRouter.put(
  "/:id",
  authenticateUser,
  reportValidation,
  handleValidationErrors,
  updateReport,
);

reportRouter.delete("/:id", authenticateUser, deleteReport);

export default reportRouter;
