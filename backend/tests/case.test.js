jest.mock("../utils/geocodeService.js", () => ({
  getLocationName: jest.fn().mockResolvedValue("Test Location Name"),
}));

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../index.js";

jest.setTimeout(20000);

describe("Case API", () => {
  
    beforeEach(async () => {
      await mongoose.connection.collection("cases").deleteMany({});
    });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a case (admin only)", async () => {
    const reportRes = await request(app).post("/api/reports").send({
      incidentType: "Illegal Net Fishing",
      description: "Report for case creation test",
      latitude: 6.9271,
      longitude: 79.8612,
    });

    expect(reportRes.statusCode).toBe(201);

    const reportId = reportRes.body.report._id;

    const token = jwt.sign(
      { _id: "admin-id", isAdmin: true },
      process.env.JWT_SECRET || "icomputers",
    );

    const res = await request(app)
      .post("/api/cases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        caseNumber: `CASE-${Date.now()}`,
        reportId,
      });

    console.log("CREATE CASE RESPONSE:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body).toHaveProperty("locationName", "Test Location Name");
  });

  it("should reject case creation for non-admin users", async () => {
    const token = jwt.sign(
      { _id: "user-id", isAdmin: false },
      process.env.JWT_SECRET || "icomputers",
    );

    const res = await request(app)
      .post("/api/cases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        caseNumber: `CASE-${Date.now()}`,
        reportId: "000000000000000000000000",
      });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});