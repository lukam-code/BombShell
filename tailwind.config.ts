import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: "#E8A0B4", // primarna roze
          dark: "#D4789A", // dugmad, hover
          // #D4789A sa belim tekstom ima kontrast 3.0:1 (ne prolazi WCAG AA),
          // zato dugmad sa belim tekstom koriste malo dublju nijansu iste roze.
          deep: "#B5507A", // 4.8:1 sa belim tekstom
          deeper: "#A8426A", // 5.8:1 – hover i tekstualni linkovi
          light: "#FCE8EE", // pozadine sekcija
          50: "#FFF4F7",
        },
        cream: "#FFF9FA",
        ink: { DEFAULT: "#2D2D2D", soft: "#6B6B6B" },
        gold: { DEFAULT: "#C9A96E", light: "#E6D5B0", dark: "#8A6D35" },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(212, 120, 154, 0.25)",
        card: "0 4px 24px -6px rgba(45, 45, 45, 0.08)",
        glow: "0 12px 32px -8px rgba(212, 120, 154, 0.55)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rise: {
          "0%": { transform: "translateY(18px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        // CSS (ne JS) animacije za hero – tekst je vidljiv odmah, bez čekanja hidratacije (bolji LCP)
        "fade-up": "fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both",
        rise: "rise 0.9s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
