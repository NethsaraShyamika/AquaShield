import { body } from "express-validator";

const allowedViolations = [
  "Banned Gear",
  "Fishing in Restricted Zone",
  "Protected Species Caught",
  "Overfishing",
  "No License",
  "Dynamite Fishing",
  "Poison Fishing",
];

const reportValidation = [
  body("reporterId").notEmpty().withMessage("Reporter ID is required"),

  body("violationTypes")
    .isArray({ min: 1 })
    .withMessage("At least one violation type must be selected")
    .custom((arr) => arr.every((v) => allowedViolations.includes(v)))
    .withMessage("Invalid violation type"),

  body("description")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),

  body("location.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be valid"),

  body("location.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be valid"),

  body("severity")
    .optional()
    .isIn(["Minor", "Moderate", "Severe"])
    .withMessage("Invalid severity level"),

  body("status")
    .optional()
    .isIn(["Pending", "Under Review", "Resolved"])
    .withMessage("Invalid status"),
];

export default reportValidation;
