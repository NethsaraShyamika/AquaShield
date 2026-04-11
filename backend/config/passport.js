import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";
import dotenv from "dotenv";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

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
        
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          
          return done(null, user);
        }

        
        user = new User({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          password: `google_oauth_${profile.id}`, 
          image: profile.photos[0]?.value || "",
        });

        await user.save();

        
        try {
          await sendWelcomeEmail(user.email, user.firstName);
          console.log(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError.message);
          
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;