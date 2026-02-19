import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String,
    required: true,
  },

  violationTypes: {
    type: [String],
    enum: [
      "Banned Gear",
      "Fishing in Restricted Zone",
      "Protected Species Caught",
      "Overfishing",
      "No License",
      "Dynamite Fishing",
      "Poison Fishing",
    ],
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    areaName: {
      type: String,
    },
  },

  species: {
    type: String,
  },

  quantity: {
    type: Number,
  },

  boatDetails: {
    type: String,
  },

  evidence: [
    {
      type: String,
    },
  ],

  authorityNotified: {
    type: Boolean,
    default: false,
  },

  severity: {
    type: String,
    enum: ["Minor", "Moderate", "Severe"],
    default: "Moderate",
  },

  status: {
    type: String,
    enum: ["Pending", "Under Review", "Resolved"],
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
