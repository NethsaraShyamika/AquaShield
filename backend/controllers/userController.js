import User from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendOtpEmail, sendPasswordResetSuccessEmail } from "../utils/sendEmail.js";

const JWT_SECRET = process.env.JWT_SECRET || "icomputers";

export async function createUser(req, res) {
  const data = req.body;
  try {
    const passwordHash = bcrypt.hashSync(req.body.password, 10);

    const newUser = new User({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: passwordHash,
    });

    await newUser.save();

    try {
      await sendWelcomeEmail(data.email, data.firstName);
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    const payload = {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      isAdmin: newUser.isAdmin,
      isBlocked: newUser.isBlocked,
      isEmailVerified: newUser.isEmailVerified,
      image: newUser.image,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "48h" });

    req.session.user = payload;
    req.session.save((err) => {
      if (err) console.log("Session save error:", err);
    });

    res.json({ message: "User created successfully", token: token, user: payload });

  } catch (error) {
    console.log("Error in createUser:", error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      return res.status(400).json({ message: "A duplicate record was found. Please try again." });
    }
    res.status(403).json({ message: "Error creating user" });
  }
}

export async function loginUser(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);

    if (user == null) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "User is blocked by admin" });
    }

    const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      isEmailVerified: user.isEmailVerified,
      image: user.image,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "48h" });
    console.log(token);

    req.session.user = payload;
    req.session.save((err) => {
      if (err) console.log("Session save error:", err);
    });

    return res.json({ message: "Login successful", token: token });

  } catch (error) {
    res.status(500).json({ message: "Error logging in user" });
  }
}

export async function logoutUser(req, res) {
  try {
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging out" });
  }
}

export async function getMyProfile(req, res) {
  try {
    // ✅ Accept both `id` and `_id`
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated – user ID missing" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching users" });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated – user ID missing" });
    }

    const { email, firstName, lastName, password } = req.body;
    const updateData = {};

    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (req.file) {
      updateData.image = `/uploads/profiles/${req.file.filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    // ✅ Skip password update for OAuth users or empty passwords
    if (password && password.trim() !== "" &&
        !password.startsWith("google_oauth_") &&
        !password.startsWith("facebook_oauth_")) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    if (req.body.isAdmin || req.body.isBlocked) {
      return res.status(403).json({ message: "You cannot change system fields" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const newToken = jwt.sign(
      {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isAdmin: updatedUser.isAdmin,
        isBlocked: updatedUser.isBlocked,
        image: updatedUser.image,
        uid: updatedUser.uid,
      },
      process.env.JWT_SECRET || "icomputers",
      { expiresIn: "48h" }
    );

    // ✅ Update session data to prevent stale session info for normal users
    if (req.session && req.session.user) {
      req.session.user = { 
        ...req.session.user, 
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        image: updatedUser.image,
        uid: updatedUser.uid,
        id: updatedUser._id 
      };
      req.session.save((err) => {
        if (err) console.error("Session update error:", err);
      });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser, token: newToken });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
}

export async function deleteOwnAccount(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.session.destroy((error) => {
      if (error) {
        console.log("Session destroy error:", error);
      }
    });

    res.json({ message: "Account deleted successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting account" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    await sendOtpEmail(user.email, user.firstName, otp);

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error sending OTP" });
  }
}

export async function searchUser(req, res) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Please provide a search query" });
    }

    const users = await User.find({
      $or: [
        { uid: { $regex: `^${query}`, $options: "i" } },
        { email: { $regex: `^${query}`, $options: "i" } },
        { firstName: { $regex: `^${query}`, $options: "i" } },
        { lastName: { $regex: `^${query}`, $options: "i" } },
      ]
    }).select("-password");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error searching user" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    await sendPasswordResetSuccessEmail(user.email, user.firstName);

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error resetting password" });
  }
}

export async function blockUser(req, res) {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.id },
      { isBlocked: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User blocked successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error blocking user" });
  }
}

export async function unblockUser(req, res) {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.id },
      { isBlocked: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User unblocked successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error unblocking user" });
  }
}

export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin only access" });
  }

  next();
}