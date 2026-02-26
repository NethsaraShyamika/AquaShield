import { body, validationResult } from "express-validator";

// ✅ Validation runner middleware
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export const createUserValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  body("firstName")
    .notEmpty().withMessage("First name is required")
    .bail()
    .isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),

  body("lastName")
    .notEmpty().withMessage("Last name is required")
    .bail()
    .isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .bail()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const loginValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
];

export const resetPasswordValidation = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const updateProfileValidation = [
  body("email")
    .optional()
    .isEmail().withMessage("Invalid email format"),

  body("firstName")
    .optional()
    .isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),

  body("lastName")
    .optional()
    .isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),

  body("password")
    .optional()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];