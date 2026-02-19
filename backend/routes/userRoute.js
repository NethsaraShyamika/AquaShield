import expres from "express"
import { createUser, loginUser } from "../controllers/userController.js"

const userRouter = expres.Router();

userRouter.post("/" ,createUser)
userRouter.post("/login" ,loginUser)

export default userRouter;

//made a changed