// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Purge CSS no utilizado
  purge: {
    enabled: true,
    content: ['./src/**/*.{js,jsx,ts,tsx}']
  }
}