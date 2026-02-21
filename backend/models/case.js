import mongoose from "mongoose";

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },

  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true
  },

  assignedOfficer: {
    type: String
  },

  status: {
    type: String,
    enum: [
      "OPEN",
      "UNDER_INVESTIGATION",
      "LEGAL_ACTION_STARTED",
      "COURT_PROCEEDING",
      "CLOSED",
      "REJECTED"
    ],
    default: "OPEN"
  },

  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    default: "MEDIUM"
  },

  legalAction: {
    courtName: String,
    courtDate: Date,
    fineAmount: Number,
    jailDuration: String
  },

  evidence: [String],

  notes: String

}, { timestamps: true });

export default mongoose.model("Case", caseSchema);