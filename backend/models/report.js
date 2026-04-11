import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    incidentType: {
      type: String,
      required: [true, "Incident type is required"],
      enum: [
        "Illegal Net Fishing",
        "Dynamite Fishing",
        "Cyanide Fishing",
        "Trawling in Protected Zone",
        "Catching Protected Species",
        "Night Fishing Violation",
        "Other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are required"],
      },
    },
    incidentDate: {
      type: Date,
      default: Date.now,
    },
    evidence: [
      {
        url: { type: String, required: true },
        fileType: { type: String },
        originalName: { type: String },
      },
    ],
    speciesInvolved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Species",
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Verified", "Dismissed", "Resolved"],
      default: "Pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ location: "2dsphere" });

export default mongoose.models.Report || mongoose.model("Report", reportSchema);