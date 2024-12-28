/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: {
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "0.5rem",
              margin: "1rem 0",
            },
            code: {
              background: "#f5f5f5",
              padding: "0.25rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
