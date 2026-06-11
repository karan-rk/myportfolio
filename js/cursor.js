/* ─── cursor.js ─────────────────────────────────────────────────
   Cursor spotlight glow effect on dark sections.
   Skips touch devices (pointer: coarse).
   CSS: .cursor-glow rule in styles.css section 18 (OVERRIDES).
   ─────────────────────────────────────────────────────────────── */

(function () {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  var targets = document.querySelectorAll(".project-dark, .rag-section, .contact");
  targets.forEach(function (el) {
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    el.appendChild(glow);
    el.addEventListener("mousemove", function (e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left - 350;
      var y = e.clientY - rect.top - 350;
      glow.style.transform = "translate(" + x + "px," + y + "px)";
      glow.style.opacity = "1";
    }, { passive: true });
    el.addEventListener("mouseleave", function () {
      glow.style.opacity = "0";
    });
  });
})();
