import express from "express"
import { createUser, loginUser , getAllUsers } from "../controllers/userController.js"

const userRouter = express.Router();

userRouter.post("/" ,createUser)
userRouter.get("/" ,getAllUsers)
userRouter.post("/login" ,loginUser)

export default userRouter;

//made a changed