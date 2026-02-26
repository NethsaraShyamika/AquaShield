
import Case from "../models/case.js";
import Report from "../models/report.js";
import { getLocationName } from "../utils/geocodeService.js";


// CREATE CASE (ADMIN ONLY)

export const createCase = async (req, res) => {

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {

    //  Find report using reportId
    const report = await Report.findById(req.body.reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Get latitude & longitude from report
    const longitude = report.location.coordinates[0];
    const latitude = report.location.coordinates[1];

    // Convert coordinates → readable address
    const locationName = await getLocationName(latitude, longitude);

    // Create case with locationName
    const newCase = new Case({
      ...req.body,
      locationName
    });

    await newCase.save();

    res.status(201).json(newCase);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//  GET ALL CASES (ADMIN ONLY)

export const getAllCases = async (req, res) => {

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const cases = await Case.find().populate("reportId");
    res.json(cases);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




//  Admin → Can View All
// User → Can View Only Their Report Case

export const getCaseById = async (req, res) => {

  if (!req.user) {
    return res.status(401).json({ message: "Login required" });
  }

  try {

    const caseData = await Case.findById(req.params.id)
      .populate("reportId");

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    //  Admin can access
    if (req.user.isAdmin) {
      return res.json(caseData);
    }

    // Normal User — Check Report Ownership
    if (
      caseData.reportId.userId &&
      caseData.reportId.userId.toString() !== req.user._id
    ) {
      return res.status(403).json({
        message: "You can only view cases related to your reports"
      });
    }

    res.json(caseData);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE CASE 

export const updateCase = async (req, res) => {

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json(updatedCase);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//  DELETE CASE

export const deleteCase = async (req, res) => {

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {

    const deletedCase = await Case.findByIdAndDelete(req.params.id);

    if (!deletedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json({ message: "Case deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};