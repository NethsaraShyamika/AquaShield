import jwt from "jsonwebtoken";

export default function authenticateUser(req, res, next) {

    const header = req.headers.authorization;

    console.log("Header:", header);

    // Check header exists
    if (!header) {
        return res.status(401).json({
            message: "No authorization header"
        });
    }

    // Check Bearer format
    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Invalid authorization format"
        });
    }

    // Extract token
    const token = header.split(" ")[1];

    console.log("Token:", token);

    try {
        // Verify token
        const decoded = jwt.verify(token, "icomputers");

        // Attach user to request
        req.user = decoded;

        // Continue to controller
        return next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}
