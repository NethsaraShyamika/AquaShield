/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./index.html",
  "./src/**/*.{js,jsx,ts,tsx}", // ← this line must exist!
],
  theme: {
    extend: {},
  },
  plugins: [],
}