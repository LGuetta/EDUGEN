/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bgPrimary: "var(--bg-primary)",
        bgSecondary: "var(--bg-secondary)",
        bgTertiary: "var(--bg-tertiary)",
        bgHover: "var(--bg-hover)",
        borderPrimary: "var(--border-primary)",
        borderAccent: "var(--border-accent)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        accentPrimary: "var(--accent-primary)",
        accentSecondary: "var(--accent-secondary)",
        accentSuccess: "var(--accent-success)",
        accentWarning: "var(--accent-warning)",
        accentInfo: "var(--accent-info)",
      },
      boxShadow: {
        soft: "var(--shadow-sm)",
        panel: "var(--shadow-md)",
        deep: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};
