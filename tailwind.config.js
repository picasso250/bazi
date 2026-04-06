/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./public/main.js", "./public/src/**/*.js"],
  theme: {
    extend: {
      colors: {
        background: "#f9f8f4",
        surface: "#faf9f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f4f0",
        "surface-container": "#efeeea",
        "surface-container-high": "#e9e8e4",
        "surface-container-highest": "#e3e2df",
        "on-surface": "#1b1c1a",
        "on-surface-variant": "#42474c",
        outline: "#72787d",
        "outline-variant": "#c2c7cc",
        primary: "#214457",
        "primary-container": "#3a5b6f",
        "on-primary": "#ffffff",
        "on-primary-container": "#dbe8ef",
        tertiary: "#685432",
        secondary: "#a23c3c",
        error: "#ba1a1a",
        "error-container": "#ffdad6"
      },
      fontFamily: {
        headline: ["\"STSong\"", "\"Songti SC\"", "\"Source Han Serif SC\"", "\"Noto Serif CJK SC\"", "serif"],
        body: ["system-ui", "\"PingFang SC\"", "\"Microsoft YaHei\"", "\"Noto Sans CJK SC\"", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 50px rgba(27, 28, 26, 0.06)",
        glow: "0 18px 45px rgba(33, 68, 87, 0.14)"
      }
    }
  },
  plugins: []
};
