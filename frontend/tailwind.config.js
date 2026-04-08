/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff", 100: "#d9edff", 200: "#bce0ff", 300: "#8ecdff",
          400: "#59b0ff", 500: "#338dfc", 600: "#1d6ef1", 700: "#1558de",
          800: "#1848b4", 900: "#1a3f8e", 950: "#152856",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
