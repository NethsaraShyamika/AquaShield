import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";

// ✅ Increase timeout (avoid slow test failures)
jest.setTimeout(10000);

// ✅ MOCK email functions (VERY IMPORTANT to prevent timeout)
jest.mock("../utils/sendEmail.js", () => ({
  sendWelcomeEmail: jest.fn(),
  sendOtpEmail: jest.fn(),
  sendPasswordResetSuccessEmail: jest.fn(),
}));

describe("User API", () => {

  // ✅ Close DB connection after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ✅ 1. CREATE USER SUCCESS
  it("should create a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john" + Date.now() + "@gmail.com", // avoid duplicates
        password: "123456"
      });

    console.log("CREATE USER RESPONSE:", res.body);

    expect(res.statusCode).toBe(200); // your controller returns 200
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
  });

  // ❌ 2. FAIL WHEN DATA IS MISSING
  it("should fail when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        firstName: "John"
      });

    console.log("FAIL CREATE USER:", res.body);

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // ❌ 3. DUPLICATE EMAIL TEST
  it("should fail when email already exists", async () => {

    const email = "duplicate" + Date.now() + "@gmail.com";

    // First user
    await request(app)
      .post("/api/users")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email,
        password: "123456"
      });

    // Second user with same email
    const res = await request(app)
      .post("/api/users")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email,
        password: "123456"
      });

    console.log("DUPLICATE EMAIL RESPONSE:", res.body);

    expect(res.statusCode).toBe(400);
  });

});