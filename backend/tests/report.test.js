import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../index.js";

const token = jwt.sign(
  { _id: "507f1f77bcf86cd799439011", isAdmin: false },
  process.env.JWT_SECRET || "icomputers"
);

describe("Report API", () => {

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a report", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        incidentType: "Illegal Net Fishing",
        description: "This is a valid test report with enough characters",
        latitude: 6.9271,
        longitude: 79.8612
      });

    console.log("CREATE RESPONSE:", res.body);

    expect(res.statusCode).toBe(201);

    // ✅ FIX HERE
    expect(res.body.report).toHaveProperty("_id");
  });

  it("should fail when data is missing", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        incidentType: "Illegal Net Fishing"
      });

    console.log("FAIL RESPONSE:", res.body);

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  

});