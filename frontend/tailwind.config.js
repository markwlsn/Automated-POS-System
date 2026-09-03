/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          bg: "#EDEAE3",
          card: "#F7F5F0",
          line: "#D8D3C7",
        },
        charcoal: "#2B2620",
        oxblood: {
          DEFAULT: "#A13D2B",
          dark: "#7E2F20",
          light: "#C2694F",
        },
        sage: {
          DEFAULT: "#6B8F71",
          dark: "#4F6D55",
        },
        mustard: {
          DEFAULT: "#C98A2B",
          dark: "#A66F1E",
        },
      },
      fontFamily: {
        display: ["'Zilla Slab'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
