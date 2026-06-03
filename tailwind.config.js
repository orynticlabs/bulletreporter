/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        hindi: ['"Noto Sans Devanagari"', "Inter", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        secondary: "hsl(var(--secondary) / <alpha-value>)",
        "secondary-foreground": "hsl(var(--secondary-foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        destructive: "hsl(var(--destructive) / <alpha-value>)",
        "destructive-foreground": "hsl(var(--destructive-foreground) / <alpha-value>)",
        "news-header": "hsl(var(--news-header) / <alpha-value>)",
        "news-accent": "hsl(var(--news-accent) / <alpha-value>)",
        "breaking-news": "hsl(var(--breaking-news) / <alpha-value>)",
        "category-tag": "hsl(var(--category-tag) / <alpha-value>)",
        "sidebar-background": "hsl(var(--sidebar-background) / <alpha-value>)",
        "sidebar-foreground": "hsl(var(--sidebar-foreground) / <alpha-value>)",
        "sidebar-primary": "hsl(var(--sidebar-primary) / <alpha-value>)",
        "sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
        "sidebar-accent": "hsl(var(--sidebar-accent) / <alpha-value>)",
        "sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
        "sidebar-border": "hsl(var(--sidebar-border) / <alpha-value>)",
        "sidebar-ring": "hsl(var(--sidebar-ring) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
    },
  },
  darkMode: "class",
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
