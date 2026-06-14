/* ─── theme.js ──────���───────────────────────────────────────────
   Handles light/dark theme toggle and initial theme application.
   Safe to edit: applyTheme(), savedTheme, themeToggles listeners.
   ─────────────────────────────────────────────────────────────── */

const themeToggles = document.querySelectorAll(".theme-toggle, .mobile-theme-toggle");
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("portfolio-theme", theme);
  const isDark = theme === "dark";
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#080c14" : "#f4f3ee");
  themeToggles.forEach((toggle) => {
    toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  });
}

const savedTheme = localStorage.getItem("portfolio-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || preferredTheme);
themeToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
});
document.getElementById("year").textContent = new Date().getFullYear();
