import jwt from "jsonwebtoken";

export default function authenticateUser(req, res, next) {


    const header = req.headers['authorization'];
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Header:", header);

    if (header) {
        const token = header.replace("Bearer ", "");
        console.log("Token:", token);

        jwt.verify(token, "icomputers", (error, decoded) => {

            if (error) {
                return res.status(401).json({
                    message: "Invalid or Expired Token. Please login again."
                });


                console.log("Decoded Token:", decoded);
                console.log("Decoded Token Expiration Time:", decoded.exp);
                console.log("Expires Date:", new Date(decoded.exp * 1000));

                req.user = decoded;
                next();
            } else {

                req.user = decoded
                next();
            }


        });

    } else {
        next(); // allow requests without token
    }
    if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, "icomputers");
    req.user = decoded; // ✅ IMPORTANT
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }


}

