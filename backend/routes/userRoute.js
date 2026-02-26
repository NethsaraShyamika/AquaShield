import express from "express"
import {
    createUser,
    loginUser,
    getAllUsers,
    blockUser,
    unblockUser,
    updateMyProfile,
    deleteOwnAccount,
    logoutUser,
    forgotPassword,
    resetPassword,
    searchUser
} from "../controllers/userController.js"
import authenticateUser from "../middlewares/authentication.js";
import { isAdmin } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser)
userRouter.get("/", authenticateUser, isAdmin, getAllUsers) 
userRouter.put("/block/:id", authenticateUser, isAdmin, blockUser);
userRouter.put("/unblock/:id", authenticateUser, isAdmin, unblockUser);
userRouter.post("/login", loginUser)
userRouter.post("/logout", authenticateUser, logoutUser)
userRouter.post("/forgot-password", forgotPassword)
userRouter.post("/reset-password", resetPassword)
userRouter.get("/search", authenticateUser,isAdmin, searchUser);
userRouter.get("/session-test", (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            message: "Session is active",
            user: req.session.user
        });
    } else {
        res.json({ message: "No session found" });
    }
});
userRouter.put("/me", authenticateUser, updateMyProfile); // ✅ user only
userRouter.delete("/me", authenticateUser, deleteOwnAccount); // ✅ user only

export default userRouter;

//made a changed