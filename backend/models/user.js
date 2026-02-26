import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
         uid: {
            type: String,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            required: true,

        },
        lastName: {
            type: String,
            required: true,

        },
        password: {
            type: String,
            required: true,

        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            required: true,
            default: false,
        },
        image: {
            type: String,
            default: "/images/default-profile.png"
        },
        resetOtp: {
            type: String,
            default: null
        },
        resetOtpExpiry: {
            type: Date,
            default: null
        }
    }
);

userSchema.pre("save", async function () {
    if (this.uid) return;

    if (this.isAdmin) {
        const lastAdmin = await mongoose.model("User")
            .findOne({ isAdmin: true })
            .sort({ uid: -1 });
        
        const lastNum = lastAdmin ? parseInt(lastAdmin.uid.split("-")[1]) : 0;
        this.uid = `AID-${String(lastNum + 1).padStart(4, "0")}`;
    } else {
        const lastUser = await mongoose.model("User")
            .findOne({ isAdmin: false })
            .sort({ uid: -1 });
        
        const lastNum = lastUser ? parseInt(lastUser.uid.split("-")[1]) : 0;
        this.uid = `USR-${String(lastNum + 1).padStart(4, "0")}`;
    }
});

const User = mongoose.model("User", userSchema);

export default User;