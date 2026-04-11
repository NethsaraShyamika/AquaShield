import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "icomputers";
const FRONTEND_URL = "http://localhost:5173";


authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);


authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    const user = req.user;

    // ✅ Check if user is blocked
    if (user.isBlocked) {
      return res.redirect(`${FRONTEND_URL}/login?error=blocked`);
    }

    const payload = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      image: user.image,
      uid: user.uid,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "48h" });
    res.redirect(`${FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

export default authRouter;