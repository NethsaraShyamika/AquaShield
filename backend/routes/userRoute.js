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
    searchUser,
    getMyProfile,
} from "../controllers/userController.js"
import authenticateUser from "../middlewares/authentication.js";
import { createUserValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, updateProfileValidation, validate } from "../middlewares/userValidation.js";
import { isAdmin } from "../controllers/userController.js";
import uploadProfile from "../middlewares/uploadProfile.js";

const userRouter = express.Router();

userRouter.post("/", createUserValidation, validate, createUser)
userRouter.get("/", authenticateUser, isAdmin, getAllUsers) 
userRouter.put("/block/:id", authenticateUser, isAdmin, blockUser);
userRouter.put("/unblock/:id", authenticateUser, isAdmin, unblockUser);
userRouter.post("/login", loginValidation, validate, loginUser)
userRouter.post("/logout", authenticateUser, logoutUser)
userRouter.post("/forgot-password", forgotPasswordValidation, validate, forgotPassword)
userRouter.post("/reset-password", resetPasswordValidation, validate, resetPassword)
userRouter.get("/search", authenticateUser, isAdmin, searchUser);
userRouter.get("/me", authenticateUser, getMyProfile);
userRouter.put("/me", authenticateUser, uploadProfile.single("image"), updateMyProfile);
userRouter.delete("/me", authenticateUser, deleteOwnAccount);

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

export default userRouter;