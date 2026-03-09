(async function () {
  const board = document.querySelector("[data-menu-app]");
  if (!board) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const formatDate = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const iso = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const weekday = (date) => date.toLocaleDateString("en-US", { weekday: "long" });

  const list = (items) => Array.isArray(items) ? items.filter(Boolean) : [];
  const pickDayHours = (hours, day) => (hours || []).find((entry) => entry.day === day) || null;

  let data;
  try {
    const response = await fetch("assets/data/menu.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Menu data could not be loaded.");
    data = await response.json();
  } catch (error) {
    board.innerHTML = `<div class="notice-card"><strong>Menu unavailable right now.</strong><span>${error.message}</span></div>`;
    return;
  }

  const days = [0, 1].map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const key = iso(date);
    const name = weekday(date);
    const menu = data.menus[key] || data.defaults || {};
    const hours = pickDayHours(data.hours.weekly, name);
    return { offset, key, name, date, menu, hours };
  });

  const switcher = $("[data-day-switcher]", board);
  const panelWrap = $("[data-day-panels]", board);
  const quickNav = $("[data-menu-sidebar-links]", board);

  switcher.innerHTML = days.map((day, index) => `
    <button class="day-pill ${index === 0 ? "is-active" : ""}" type="button" data-day-trigger="${index}">${day.name}<br><small>${formatDate(day.date)}</small></button>
  `).join("");

  panelWrap.innerHTML = days.map((day, index) => {
    const breakfast = day.menu.breakfast || data.defaults.breakfast || {};
    const lunch = day.menu.lunch || data.defaults.lunch || {};
    const crawfish = day.menu.crawfish || data.defaults.crawfish || {};
    const salad = day.menu.salad || data.defaults.salad || {};
    const drinks = day.menu.drinks || data.defaults.drinks || {};
    const dessert = day.menu.dessert || data.defaults.dessert || {};
    const sections = [
      {
        id: `breakfast-${index}`,
        title: "Breakfast",
        subtitle: breakfast.subtitle || "Breakfast favorites served hot and ready.",
        groups: [
          { label: "Plates", items: list(breakfast.plates) },
          { label: "Available Items", items: list(breakfast.items) }
        ]
      },
      {
        id: `lunch-${index}`,
        title: "Lunch",
        subtitle: lunch.subtitle || "Comfort-heavy lunch plates and rotating Southern sides.",
        groups: [
          { label: "Plates", items: list(lunch.plates) },
          { label: `${day.name} Lunch Items`, items: list(lunch.items).map((item) => typeof item === "string" ? { name: item, desc: "" } : item) }
        ]
      },
      {
        id: `crawfish-${index}`,
        title: "Crawfish",
        subtitle: crawfish.subtitle || "Seasonal availability — call ahead for current pricing.",
        groups: [
          { label: "Boil Options", items: list(crawfish.items) }
        ]
      },
      {
        id: `salad-${index}`,
        title: "Salad Bar",
        subtitle: salad.subtitle || "Fresh build-your-own options with Southern add-ons.",
        groups: [
          { label: "Pricing", items: list(salad.items) },
          { label: "Lettuce", items: list((salad.saladBar || {}).lettuce) },
          { label: "Toppings", items: list((salad.saladBar || {}).toppings) },
          { label: "Dressings", items: list((salad.saladBar || {}).dressing) }
        ]
      },
      {
        id: `drinks-${index}`,
        title: "Drinks",
        subtitle: "House favorites and cold classics.",
        groups: [
          { label: "Available Drinks", items: list(drinks.items) }
        ]
      },
      {
        id: `dessert-${index}`,
        title: "Dessert",
        subtitle: dessert.subtitle || "Sweet finishes that rotate with the day.",
        groups: [
          { label: "Dessert Case", items: list(dessert.items) }
        ]
      }
    ];

    return `
      <section class="menu-day-panel" ${index !== 0 ? 'hidden' : ''} data-day-panel="${index}">
        <div class="notice-card" style="margin-bottom:16px;">
          <strong>${day.name} • ${formatDate(day.date)}</strong>
          <span>${day.hours ? `${day.name} Hours: ${day.hours.open} - ${day.hours.close} • Breakfast ${day.hours.breakfast} • Lunch ${day.hours.lunch}` : data.hours.note}</span>
        </div>
        ${sections.map((section) => `
          <article class="menu-section" id="${section.id}">
            <h3>${section.title}</h3>
            <p>${section.subtitle}</p>
            ${section.groups.map((group) => `
              <div class="stack-sm" style="margin-top:16px;">
                <h4>${group.label}</h4>
                <ul class="menu-list">
                  ${group.items.length ? group.items.map((item) => {
                    if (typeof item === "object") {
                      return `<li><strong>${item.name}</strong>${item.desc ? `<span>${item.desc}</span>` : ""}</li>`;
                    }
                    return `<li><strong>${item}</strong></li>`;
                  }).join("") : `<li><strong>Call for current availability.</strong></li>`}
                </ul>
              </div>
            `).join("")}
          </article>
        `).join("")}
      </section>
    `;
  }).join("");

  quickNav.innerHTML = [
    ["breakfast", "Breakfast"],
    ["lunch", "Lunch"],
    ["crawfish", "Crawfish"],
    ["salad", "Salad Bar"],
    ["drinks", "Drinks"],
    ["dessert", "Dessert"]
  ].map(([slug, label], index) => `<a href="#${slug}-0" ${index === 0 ? 'class="is-active"' : ''} data-sidebar-link>${label}</a>`).join("");

  const updateSidebarTargets = (dayIndex) => {
    $$('[data-sidebar-link]', quickNav).forEach((link) => {
      const slug = link.getAttribute('href').split('#')[1].split('-')[0];
      link.setAttribute('href', `#${slug}-${dayIndex}`);
    });
  };

  switcher.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-day-trigger]');
    if (!trigger) return;
    const dayIndex = trigger.dataset.dayTrigger;
    $$('[data-day-trigger]', switcher).forEach((btn) => btn.classList.toggle('is-active', btn === trigger));
    $$('[data-day-panel]', panelWrap).forEach((panel) => { panel.hidden = panel.dataset.dayPanel !== dayIndex; });
    updateSidebarTargets(dayIndex);
    document.querySelector('.menu-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
