import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import userRouter from "./routes/userRoute.js";
import speciesRoutes from "./routes/speciesRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import { isAdmin } from "./controllers/userController.js";
import reportRoutes from "./routes/reportRoutes.js";
import session from "express-session";

// Force Google DNS to bypass router/hotspot DNS that can't resolve MongoDB Atlas SRV records
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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

function go() {
  console.log("Started...");
}

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/api/species", speciesRoutes);
app.use("/api/cases", caseRoutes);

app.use("/api/users", userRouter);

app.use("/api/reports", reportRoutes);

app.use("/uploads", express.static("uploads"));

const connectWithRetry = (retries = 5, delay = 5000) => {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connection established successfully.");
    })
    .catch((error) => {
      console.error(`MongoDB connection failed: ${error.message}`);
      if (retries > 0) {
        console.log(`Retrying connection in ${delay / 1000}s... (${retries} attempts left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error("All MongoDB connection attempts failed. Exiting.");
        process.exit(1);
      }
    });
};

connectWithRetry();

app.get("/", (req, res) => {
  res.status(200).json({ message: "AquaShield backend is running." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


export default app;