/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)", card: "var(--card)", well: "var(--well)",
        ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)" },
        neel: { 700: "var(--neel-700)", 600: "var(--neel-600)", 400: "var(--neel-400)" },
        brass: { 600: "var(--brass-600)", 400: "var(--brass-400)", 200: "var(--brass-200)" },
        sage: "var(--sage)", alarm: "var(--alarm)",
        amber: { DEFAULT: "var(--amber)" },     // default amber-50..900 palette is kept; bare `amber` = status colour
        // legacy aliases so screens not yet restyled leave the old teal behind immediately
        brand: { DEFAULT: "var(--neel-600)", dark: "var(--neel-700)", light: "#E4E7F6" },
      },
      fontFamily: { display: ["Fraunces", "Noto Sans Devanagari", "Georgia", "serif"], sans: ["Inter", "Noto Sans Devanagari", "system-ui", "sans-serif"] },
      fontSize: { base: ["18px", "1.55"] },
    },
  },
  plugins: [],
};
