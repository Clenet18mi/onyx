/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ONYX Color Palette - Dark, elegant, modern
        onyx: {
          DEFAULT: "#0A0A0B",
          50: "#18181B",
          100: "#1F1F23",
          200: "#27272A",
          300: "#3F3F46",
          400: "#52525B",
          500: "#71717A",
          600: "#A1A1AA",
          700: "#D4D4D8",
          800: "#E4E4E7",
          900: "#F4F4F5",
          950: "#FAFAFA",
        },
        // Accent colors
        accent: {
          primary: "#6366F1",    // Indigo vibrant
          secondary: "#8B5CF6",  // Violet
          success: "#10B981",    // Emerald
          warning: "#F59E0B",    // Amber
          danger: "#EF4444",     // Red
          info: "#3B82F6",       // Blue
        },
        // Glassmorphism
        glass: {
          light: "rgba(255, 255, 255, 0.05)",
          medium: "rgba(255, 255, 255, 0.10)",
          heavy: "rgba(255, 255, 255, 0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.4)",
      },
    },
  },
  plugins: [],
};
