import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/userRoute.js";
import authenticateUser from "./middlewares/authentication.js";
import cors from "cors";
import dotenv from "dotenv";
import speciesRoutes from "./routes/speciesRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import { isAdmin } from "./controllers/userController.js";

dotenv.config();

const app = express();
function go(){
  console.log("Started...");
}

app.use(cors());
app.use(express.json());
app.use("/api/species", speciesRoutes);
app.use("/api/cases", caseRoutes);

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

app.use("/api/users", userRouter);
//app.use(authenticateUser);
//app.use(isAdmin);

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