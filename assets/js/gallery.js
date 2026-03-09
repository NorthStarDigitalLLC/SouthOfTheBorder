(function () {
  const wrap = document.querySelector("[data-gallery-filter]");
  const items = document.querySelectorAll("[data-gallery-item]");
  if (!wrap || !items.length) return;
  wrap.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-filter]");
    if (!target) return;
    const filter = target.dataset.filter;
    wrap.querySelectorAll("button[data-filter]").forEach((btn) => btn.classList.toggle("is-active", btn === target));
    items.forEach((item) => {
      const match = filter === "all" || item.dataset.galleryItem === filter;
      item.hidden = !match;
    });
  });
})();
