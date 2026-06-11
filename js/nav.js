/* ─── nav.js ─────────────────────────────────────────────────────
   Header scroll, mobile menu, active-section tracking, counters.
   Exposes: window.updateActiveNavigation (used by projects.js)
   ─────────────────────────────────────────────────────────────── */

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuLinks = mobileMenu.querySelectorAll("a");
const sectionLinks = document.querySelectorAll('a[href^="#"]');
const trackedSections = document.querySelectorAll("main section[id]");
const counters = document.querySelectorAll("[data-count]");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

function closeMobileMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  mobileMenu.setAttribute("aria-hidden", "true");
  mobileMenu.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
  mobileMenu.setAttribute("aria-hidden", String(!willOpen));
  mobileMenu.classList.toggle("open", willOpen);
  document.body.classList.toggle("menu-open", willOpen);
});

mobileMenuLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 980) closeMobileMenu();
});

function updateActiveNavigation() {
  const marker = window.scrollY + Math.min(window.innerHeight * 0.38, 280);
  let activeSection = null;

  trackedSections.forEach((section) => {
    if (section.offsetTop <= marker) activeSection = section;
  });

  const activeId = activeSection ? `#${activeSection.id}` : "";
  sectionLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === activeId);
  });
}

window.addEventListener("scroll", updateActiveNavigation, { passive: true });
window.addEventListener("hashchange", updateActiveNavigation);
updateActiveNavigation();

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const suffix = counter.dataset.suffix || "";
  const decimals = String(target).includes(".") ? 1 : 0;
  const duration = 1100;
  const started = performance.now();

  counter.classList.add("counting");
  function update(now) {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      counter.textContent = `${target.toFixed(decimals)}${suffix}`;
      counter.classList.remove("counting");
    }
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        entry.target.textContent = `${entry.target.dataset.count}${entry.target.dataset.suffix || ""}`;
      } else {
        animateCounter(entry.target);
      }
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => counterObserver.observe(counter));
