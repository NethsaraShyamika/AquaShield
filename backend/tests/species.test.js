import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";

describe("Species API", () => {

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should get all species", async () => {
    const res = await request(app)
      .get("/api/species");

    console.log("GET ALL RESPONSE:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return 404 when species not found by id", async () => {
    const res = await request(app)
      .get("/api/species/nonexistent-id-999");

    console.log("NOT FOUND RESPONSE:", res.body);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Species not found");
  });

});