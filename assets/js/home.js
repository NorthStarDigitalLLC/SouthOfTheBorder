(function () {
  const rotator = document.querySelector("[data-rotator]");
  if (!rotator) return;
  const phrases = [
    "Southern breakfast that starts your morning strong.",
    "Plate lunches built for comfort, speed, and flavor.",
    "A warm small-town stop with big local energy.",
    "Catering and delivery options for hungry crews and families."
  ];
  let index = 0;
  setInterval(() => {
    index = (index + 1) % phrases.length;
    rotator.textContent = phrases[index];
  }, 3400);
})();
