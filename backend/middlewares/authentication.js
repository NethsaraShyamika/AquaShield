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

    // Some clients accidentally persist tokens as JSON strings: "<jwt>"
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1);
    }

    return token;
}

export default function authenticateUser(req, res, next) {

    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }
    const header = req.headers['authorization'];

    if (header) {
        const token = normalizeAuthToken(header);
        if (!token) {
            return res.status(401).json({
                message: "Not authenticated"
            });
        }

        jwt.verify(token, JWT_SECRET, (error, decoded) => {
            if (error) {
                return res.status(401).json({
                    message: "Invalid or Expired Token. Please login again."
                });
            }

            req.user = decoded;
            next();
        });

    } else {
        next(); // allow requests without token
    }
}