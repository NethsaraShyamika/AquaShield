import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.js";
import speciesRoutes from "./routes/speciesRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import session from "express-session";

dotenv.config();

const app = express();

// Session configuration
app.use(session({
  secret: "aquashield_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 48 // 48 hours
  }
}));

function go(){
  console.log("Started...");
}

app.use(cors());
app.use(express.json());
app.use("/api/species", speciesRoutes);

app.use("/api/users", userRouter);

app.use("/uploads", express.static("uploads"));        // serve evidence files
app.use("/api/reports", reportRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection established successfully.");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.status(200).json({ message: "AquaShield backend is running." });
});




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});



//admin credentials
/*{
  "email": "admin@gmail.com",
  "firstName": "Admin",
  "lastName": "User",
  "password": "admin123",
  "isAdmin": true
}
*/