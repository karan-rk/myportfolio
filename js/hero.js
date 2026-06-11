/* ─── hero.js ────────────────────────────────────────────────────
   Hero card parallax tilt, scroll-reveal IntersectionObserver,
   and initial hash-target handling.
   ─────────────────────────────────────────────────────────────── */

const reveals = document.querySelectorAll(".reveal");

const hero = document.querySelector(".hero");
const heroCard = document.querySelector(".hero-card");
if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroCard.style.transform = `rotate(${2 + x * 2}deg) translate(${x * 5}px, ${y * 5}px)`;
  });
  hero.addEventListener("pointerleave", () => {
    heroCard.style.transform = "";
  });
}
window.addEventListener("resize", () => {
  if (window.innerWidth <= 980) heroCard.style.transform = "";
}, { passive: true });

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

const initialHashTarget = location.hash ? document.querySelector(location.hash) : null;
if (initialHashTarget) {
  initialHashTarget.classList.add("hash-target-ready");
  initialHashTarget.classList.add("visible");
  initialHashTarget.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}
reveals.forEach((element) => {
  if (!element.classList.contains("visible")) observer.observe(element);
});
