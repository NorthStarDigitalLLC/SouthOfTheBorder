(function () {
  const current = document.body.dataset.page || "";
  const navLinks = document.querySelectorAll("[data-nav-link]");
  navLinks.forEach((link) => {
    if (link.dataset.navLink === current) {
      link.setAttribute("aria-current", "page");
    }
  });

  const mobileToggle = document.querySelector("[data-mobile-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", String(open));
      mobileToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
  }

  document.querySelectorAll("[data-scroll-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const year = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = year; });

  document.querySelectorAll("[data-faux-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = form.querySelector("[data-form-result]");
      if (result) {
        result.hidden = false;
        result.textContent = "Thanks — this static demo is ready for GitHub Pages. Hook this form to Formspree, Netlify Forms, or your own endpoint when you go live.";
      }
      form.reset();
    });
  });
})();
