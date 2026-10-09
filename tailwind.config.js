/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          desk: "#000000",        // Negro real base
          panel: "#0A0A0A",       // Superficie principal de rack
          slot: "#121212",        // Contenedores técnicos y ranuras
          hover: "#181818",       // Hover sobrio
          active: "#222222",      // Estado presionado
          border: "#1C1C1C",      // División 1px técnica
          divider: "#151515",
        },
        tally: {
          live: "#E11D48",        // Rojo broadcast puro
          liveMuted: "rgba(225, 29, 72, 0.12)",
          black: "#D97706",       // Ámbar para blackout
          blackMuted: "rgba(217, 119, 6, 0.12)",
          preview: "#71717A",     // Preparación en gris neutro
          previewMuted: "rgba(113, 113, 122, 0.15)",
        },
        accent: {
          DEFAULT: "#F4F4F5",     // Blanco hueso / acero de alto contraste
          hover: "#E4E4E7",
          subtle: "rgba(255, 255, 255, 0.08)",
        },
        txt: {
          primary: "#F4F4F5",     // Blanco técnico de lectura
          secondary: "#A1A1AA",   // Gris claro secundario
          muted: "#71717A",       // Gris medio para metadatos
          dark: "#09090B",        // Texto oscuro sobre botón Take
        },
        workspace: {
          bg: "#000000",
          surface: "#0A0A0A",
          elevated: "#121212",
          border: "#1C1C1C",
        }
      },
      fontFamily: {
        sans: [
          "'Segoe UI Variable'",
          "'Segoe UI'",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ],
        display: [
          "'Space Grotesk Variable'",
          "'Segoe UI Variable'",
          "'Segoe UI'",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "'Cascadia Code'",
          "'Consolas'",
          "'Courier New'",
          "monospace"
        ]
      },
      transitionDuration: {
        DEFAULT: "80ms",
        fast: "50ms",
      }
    },
  },
  plugins: [],
}