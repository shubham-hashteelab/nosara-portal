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
          bg: "#ffffff",
          hover: "#f3f4f6",
          active: "#eff6ff",
          text: "#4b5563",
          heading: "#111827",
          border: "#e5e7eb",
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
