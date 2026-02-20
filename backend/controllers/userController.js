import User from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
    res.json({ message: "User created successfully" });

  } catch (error) {
    res.status(403).json({ message: "Error creating user" });
  }
}

export async function loginUser(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);

    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "User is blocked by admin" });
    }

    const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
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

    const token = jwt.sign(payload, "icomputers", { expiresIn: "48h" });
    console.log(token);

    return res.json({ message: "Login successful", token: token });

  } catch (error) {
    res.status(500).json({ message: "Error logging in user" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching users" });
  }
}

export async function blockUser(req, res) {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
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
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
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

// ✅ Fixed: proper Express middleware (not a true/false function)
export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin only access" });
  }

  next();
}