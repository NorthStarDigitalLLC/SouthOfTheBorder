const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const body = document.body;

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open");
    body.classList.toggle("menu-open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      body.classList.remove("menu-open");
    });
  });
}

const currentPage = body.dataset.page;
document.querySelectorAll(".site-nav > a:not(.button)").forEach((link) => {
  const href = link.getAttribute("href");
  if (
    (currentPage === "home" && href === "#home") ||
    (currentPage === "menu" && href === "#menu-sections")
  ) {
    link.classList.add("active");
  }
});

const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

reveals.forEach((item) => observer.observe(item));

async function loadMenu() {
  const filtersHost = document.getElementById("menu-filters");
  const grid = document.getElementById("menu-data-grid");
  if (!filtersHost || !grid) return;

  try {
    const response = await fetch("data/menu.json");
    const menu = await response.json();
    const sections = menu.sections || [];

    let active = "all";

    const renderFilters = () => {
      filtersHost.innerHTML = "";
      const all = document.createElement("button");
      all.className = `filter-btn ${active === "all" ? "active" : ""}`;
      all.textContent = "All";
      all.addEventListener("click", () => {
        active = "all";
        renderFilters();
        renderGrid();
      });
      filtersHost.appendChild(all);

      sections.forEach((section) => {
        const button = document.createElement("button");
        button.className = `filter-btn ${active === section.slug ? "active" : ""}`;
        button.textContent = section.name;
        button.addEventListener("click", () => {
          active = section.slug;
          renderFilters();
          renderGrid();
        });
        filtersHost.appendChild(button);
      });
    };

    const renderGrid = () => {
      grid.innerHTML = "";
      const visibleSections = active === "all"
        ? sections
        : sections.filter((section) => section.slug === active);

      visibleSections.forEach((section) => {
        const article = document.createElement("article");
        article.className = "menu-section-card reveal visible";

        const title = document.createElement("div");
        title.innerHTML = `<p class="menu-label">${section.name}</p><h3>${section.heading}</h3><p>${section.description}</p>`;

        const list = document.createElement("ul");
        list.className = "menu-item-list";

        section.items.forEach((item) => {
          const li = document.createElement("li");
          li.className = "menu-item";
          li.innerHTML = `<strong>${item.name}</strong><span>${item.note}</span>`;
          list.appendChild(li);
        });

        article.appendChild(title);
        article.appendChild(list);
        grid.appendChild(article);
      });
    };

    renderFilters();
    renderGrid();
  } catch (error) {
    grid.innerHTML = '<article class="visit-card"><p class="eyebrow">Menu data</p><h2>Could not load menu.json</h2><p>Keep the file path as <code>data/menu.json</code> and make sure it is uploaded to the repo.</p></article>';
  }
}

loadMenu();
