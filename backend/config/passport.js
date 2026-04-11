import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";
import dotenv from "dotenv";
import { sendWelcomeEmail } from "../utils/sendEmail.js"; // ✅ ADDED

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User exists — just return them
          return done(null, user);
        }

        // New user — create account
        user = new User({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          password: `google_oauth_${profile.id}`, // placeholder
          image: profile.photos[0]?.value || "",
        });

        await user.save();

        // ✅ Send welcome email to new Google user
        try {
          await sendWelcomeEmail(user.email, user.firstName);
          console.log(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError.message);
          // Don't block authentication – user is already created
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;