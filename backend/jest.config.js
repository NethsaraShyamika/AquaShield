export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  setupFiles: ["<rootDir>/tests/setup.js"]
};