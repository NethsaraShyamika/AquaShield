import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";


jest.setTimeout(10000);


jest.mock("../utils/sendEmail.js", () => ({
  sendWelcomeEmail: jest.fn(),
  sendOtpEmail: jest.fn(),
  sendPasswordResetSuccessEmail: jest.fn(),
}));

describe("User API", () => {


  afterAll(async () => {
    await mongoose.connection.close();
  });

  
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


  it("should fail when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        firstName: "John"
      });

    console.log("FAIL CREATE USER:", res.body);

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it("should fail when email already exists", async () => {

    const email = "duplicate" + Date.now() + "@gmail.com";

  
    await request(app)
      .post("/api/users")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email,
        password: "123456"
      });

    
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