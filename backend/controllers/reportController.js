import Report from "../models/Report.js";

const getUserId = (req) => req.user?._id || req.user?.id;

export const createReport = async (req, res) => {
  try {
    const {
      incidentType,
      description,
      latitude,
      longitude,
      incidentDate,
      speciesInvolved,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Location coordinates are required.",
      });
    }

    const evidence = req.files
      ? req.files.map((file) => ({
          url: file.path,
          fileType: file.mimetype,
          originalName: file.originalname,
        }))
      : [];

    const report = await Report.create({
      reportedBy: getUserId(req),
      incidentType,
      description,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      incidentDate: incidentDate || Date.now(),
      evidence,
      speciesInvolved:
        typeof speciesInvolved === "string"
          ? JSON.parse(speciesInvolved)
          : speciesInvolved || [],
    });

    res.status(201).json({
      message: "Report submitted successfully.",
      report,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit report.",
      error: error.message,
    });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: getUserId(req) })
      .populate("speciesInvolved", "name commonName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reports.",
      error: error.message,
    });
  }
};

export const getMyReportById = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      reportedBy: getUserId(req),
    }).populate("speciesInvolved", "name commonName");

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch report.",
      error: error.message,
    });
  }
};

export const updateMyReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      reportedBy: getUserId(req),
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (report.status !== "Pending") {
      return res.status(403).json({
        message: "Only Pending reports can be edited.",
      });
    }

    const {
      incidentType,
      description,
      latitude,
      longitude,
      incidentDate,
      speciesInvolved,
    } = req.body;

    if (incidentType) report.incidentType = incidentType;
    if (description) report.description = description;

    if (latitude && longitude) {
      report.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    if (incidentDate) report.incidentDate = incidentDate;

    if (speciesInvolved) {
      report.speciesInvolved =
        typeof speciesInvolved === "string"
          ? JSON.parse(speciesInvolved)
          : speciesInvolved;
    }

    if (req.files?.length > 0) {
      const newEvidence = req.files.map((file) => ({
        url: file.path,
        fileType: file.mimetype,
        originalName: file.originalname,
      }));
      report.evidence.push(...newEvidence);
    }

    await report.save();

    res.status(200).json({
      message: "Report updated successfully.",
      report,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update report.",
      error: error.message,
    });
  }
};

export const deleteMyReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      reportedBy: getUserId(req),
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (report.status !== "Pending") {
      return res.status(403).json({
        message: "Only Pending reports can be deleted.",
      });
    }

    await report.deleteOne();

    res.status(200).json({ message: "Report deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete report.",
      error: error.message,
    });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .populate("reportedBy", "firstName lastName email")
      .populate("speciesInvolved", "name commonName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reports.",
      error: error.message,
    });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reportedBy", "firstName lastName email")
      .populate("speciesInvolved", "name commonName");

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch report.",
      error: error.message,
    });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const validStatuses = [
      "Pending",
      "Under Review",
      "Verified",
      "Dismissed",
      "Resolved",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || "" },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    res.status(200).json({
      message: "Report status updated.",
      report,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update status.",
      error: error.message,
    });
  }
};