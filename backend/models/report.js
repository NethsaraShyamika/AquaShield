import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Incident details
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

    // Location — auto-captured or manually pinned on map
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Location coordinates are required"],
      },
      placeName: {
        type: String, // Human-readable label (optional, from reverse geocode)
        default: "",
      },
    },

    // Timestamp is auto-captured via createdAt (timestamps: true)
    incidentDate: {
      type: Date,
      default: Date.now, // fallback if frontend doesn't send
    },

    // Evidence uploads (file paths / URLs from cloud/local storage)
    evidence: [
      {
        url: { type: String, required: true },
        fileType: { type: String }, // "image/jpeg", "video/mp4", etc.
        originalName: { type: String },
      },
    ],

    // Species involved (optional — links to your species DB)
    speciesInvolved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Species",
      },
    ],

    // Admin-managed status
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
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Enable geospatial queries
reportSchema.index({ location: "2dsphere" });

const Report = mongoose.model("Report", reportSchema);
export default Report;