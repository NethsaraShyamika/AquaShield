import { isValidEmail } from "../utils/calculateStatus.js";

test("valid email should pass", () => {
  expect(isValidEmail("test@gmail.com")).toBe(true);
});

test("invalid email should fail", () => {
  expect(isValidEmail("wrongemail")).toBe(false);
});