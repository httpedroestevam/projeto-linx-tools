import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{vue,ts,js}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5d2fb1",
          dark: "#3e197d",
          violet: "#813bd3",
          yellow: "#ffc532",
          ink: "#292339",
          muted: "#77738a",
          border: "#e8e4ef",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "DM Sans", "sans-serif"],
      },
      boxShadow: {
        panel: "0 13px 40px rgba(59, 32, 113, .06)",
      },
    },
  },
} satisfies Config;
