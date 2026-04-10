import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";

describe("Report API", () => {

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a report", async () => {
    const res = await request(app)
      .post("/api/reports")
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
      .send({
        incidentType: "Illegal Net Fishing"
      });

    console.log("FAIL RESPONSE:", res.body);

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  

});