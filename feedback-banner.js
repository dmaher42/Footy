(function () {
  const originalRenderFeedbackTracker = window.renderFeedbackTracker;

  if (typeof originalRenderFeedbackTracker !== "function") {
    return;
  }

  function injectSelectedPlayerBanner() {
    const tracker = document.querySelector("#feedback-tracker");
    if (!tracker) {
      return;
    }

    const switcher = tracker.querySelector(".feedback-player-switcher");
    const playerSelect = tracker.querySelector("#feedback-player-select");
    const quarterLabel = tracker.querySelector(".quarter-label");

    if (!switcher || !playerSelect) {
      return;
    }

    const existingBanner = tracker.querySelector(".selected-player-banner");
    if (existingBanner) {
      existingBanner.remove();
    }

    const selectedOption = playerSelect.selectedOptions && playerSelect.selectedOptions[0];
    const playerName = selectedOption ? selectedOption.textContent.trim() : "No player selected";
    const currentQuarterLabel = quarterLabel ? quarterLabel.textContent.trim() : "";

    const banner = document.createElement("article");
    banner.className = "selected-player-banner";
    banner.setAttribute("aria-live", "polite");

    const label = document.createElement("span");
    label.className = "selected-player-banner-label";
    label.textContent = "Recording for";

    const name = document.createElement("strong");
    name.className = "selected-player-banner-name";
    name.textContent = playerName;

    const meta = document.createElement("span");
    meta.className = "selected-player-banner-meta";
    meta.textContent = currentQuarterLabel;

    banner.append(label, name, meta);
    switcher.insertAdjacentElement("afterend", banner);
  }

  window.renderFeedbackTracker = function (...args) {
    const result = originalRenderFeedbackTracker.apply(this, args);
    injectSelectedPlayerBanner();
    return result;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSelectedPlayerBanner, { once: true });
  } else {
    injectSelectedPlayerBanner();
  }
})();
