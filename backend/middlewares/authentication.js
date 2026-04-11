import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "icomputers";

function normalizeAuthToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return "";
  }
  let token = headerValue.trim();
  if (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, "");
  }
  token = token.trim();
  // Remove accidental quotes
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1);
  }
  return token;
}

export default function authenticateUser(req, res, next) {
  // 1. Check session first
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // 2. Check Authorization header
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(401).json({ message: "Not authenticated – no token provided" });
  }

  const token = normalizeAuthToken(header);
  if (!token) {
    return res.status(401).json({ message: "Not authenticated – invalid token format" });
  }

  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }
    // decoded contains the JWT payload (id, email, firstName, etc.)
    req.user = decoded;
    next();
  });
}