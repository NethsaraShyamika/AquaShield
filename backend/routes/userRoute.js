import express from "express"
import { createUser, loginUser , getAllUsers, blockUser , unblockUser } from "../controllers/userController.js"
import authenticateUser from "../middlewares/authentication.js";
import { isAdmin } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/" ,createUser)
userRouter.get("/" ,getAllUsers)
userRouter.put("/block/:id", authenticateUser, isAdmin, blockUser);
userRouter.put("/unblock/:id", authenticateUser, isAdmin, unblockUser);
userRouter.post("/login" ,loginUser)

export default userRouter;

//made a changed