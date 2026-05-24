// Tailwind v4 — theme is configured in globals.css via @theme blocks.
// This file is kept for IDE tooling / legacy plugin support only.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  darkMode: "class",
};

export default config;
