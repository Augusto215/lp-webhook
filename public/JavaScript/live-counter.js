const startCount = 20000;
const endCount = 30000;
const startDate = new Date("2025-05-05T00:00:00");
const endDate = new Date("2025-06-05T23:59:59");

function getCurrentCount() {
  const now = new Date();
  const totalDuration = endDate - startDate;
  let elapsed = now - startDate;
  if (elapsed < 0) elapsed = 0;
  if (elapsed > totalDuration) elapsed = totalDuration;
  const fraction = elapsed / totalDuration;
  return Math.floor(startCount + fraction * (endCount - startCount));
}

function animateCounter(finalValue, duration) {
  const counterEl = document.querySelector(".subs-counter");
  if (!counterEl) return;

  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const fraction = Math.min(progress / duration, 1);
    const currentValue = Math.floor(finalValue * fraction);
    counterEl.textContent = `+ ${currentValue} Inscritos`;
    
    if (fraction < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

const finalCount = getCurrentCount();
animateCounter(finalCount, 1500);