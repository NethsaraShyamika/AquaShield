// controllers/caseController.js
import Case from "../models/case.js";


// 🔹 CREATE Case
export const createCase = async (req, res) => {
  try {
    const newCase = new Case(req.body);
    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 GET All Cases
export const getAllCases = async (req, res) => {
  try {
    const cases = await Case.find().populate("reportId");
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 GET Single Case
export const getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id).populate("reportId");

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 UPDATE Case
export const updateCase = async (req, res) => {
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


// 🔹 DELETE Case
export const deleteCase = async (req, res) => {
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