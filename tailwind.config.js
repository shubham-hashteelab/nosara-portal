/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e8f0fe",
          100: "#d2e3fc",
          200: "#a8c7fa",
          300: "#7cacf8",
          400: "#4e91f5",
          500: "#1a73e8",
          600: "#1557b0",
          700: "#104080",
          800: "#0b2a55",
          900: "#06152b",
        },
        sidebar: {
          bg: "#1e293b",
          hover: "#334155",
          active: "#1a73e8",
          text: "#cbd5e1",
          heading: "#f1f5f9",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
