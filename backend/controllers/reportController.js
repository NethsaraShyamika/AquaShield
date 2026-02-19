import Report from "../models/report.js";
import { getAreaName } from "../utils/geocode.js";

// Create new report
export const createReport = async (req, res) => {
  try {
    const { latitude, longitude } = req.body.location;

    const areaName = await getAreaName(latitude, longitude);

    const report = new Report({
      ...req.body,
      location: { latitude, longitude, areaName },
    });

    await report.save();

    return res.status(201).json({
      message: "Report submitted successfully",
      report,
    });

  } catch (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
};


// Get all reports
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find();

    return res.status(200).json(reports);

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};


// Get single report
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    return res.status(200).json(report);

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};


// Update report
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    return res.status(200).json({
      message: "Report updated",
      report,
    });

  } catch (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
};


// Delete report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    return res.status(200).json({
      message: "Report deleted",
      report,
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};
