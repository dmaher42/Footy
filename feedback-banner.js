(function () {
  const recentPlayerIds = [];
  const CATEGORY_META = [
    { id: "effort", label: "Effort" },
    { id: "defence", label: "Defence" },
    { id: "attack", label: "Attack" },
    { id: "teamacts", label: "Team Acts" },
    { id: "voice", label: "Voice" },
    { id: "teamacts_old", label: "1%ers" },
  ];
  let focusReturnUntil = 0;
  let clearFocusTimer = null;

  function rememberPlayer(playerId) {
    if (!playerId) {
      return;
    }

    const existingIndex = recentPlayerIds.indexOf(playerId);
    if (existingIndex >= 0) {
      recentPlayerIds.splice(existingIndex, 1);
    }

    recentPlayerIds.unshift(playerId);

    if (recentPlayerIds.length > 6) {
      recentPlayerIds.length = 6;
    }
  }

  function getPlayerNameFromSelect(playerSelect, playerId) {
    const option = Array.from(playerSelect.options || []).find((entry) => entry.value === playerId);
    return option ? option.textContent.trim() : "";
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

  function injectRecentPlayersRow() {
    const tracker = document.querySelector("#feedback-tracker");
    if (!tracker) {
      return;
    }

    const switcher = tracker.querySelector(".feedback-player-switcher");
    const playerSelect = tracker.querySelector("#feedback-player-select");
    if (!switcher || !playerSelect) {
      return;
    }

    rememberPlayer(playerSelect.value);

    const existingRow = tracker.querySelector(".recent-players-row");
    if (existingRow) {
      existingRow.remove();
    }

    const row = document.createElement("div");
    row.className = "recent-players-row";

    if (Date.now() < focusReturnUntil) {
      row.classList.add("attention");
      switcher.classList.add("attention");
    } else {
      switcher.classList.remove("attention");
    }

    const header = document.createElement("div");
    header.className = "recent-players-header";

    const title = document.createElement("span");
    title.className = "recent-players-title";
    title.textContent = "Recent Players";

    const hint = document.createElement("span");
    hint.className = "recent-players-hint";
    hint.textContent = "Tap to switch fast";

    header.append(title, hint);

    const chipList = document.createElement("div");
    chipList.className = "recent-player-chip-list";

    recentPlayerIds
      .filter((playerId) => Array.from(playerSelect.options || []).some((option) => option.value === playerId))
      .forEach((playerId) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "recent-player-chip";
        if (playerId === playerSelect.value) {
          chip.classList.add("active");
        }
        chip.dataset.playerId = playerId;
        chip.textContent = getPlayerNameFromSelect(playerSelect, playerId);
        chip.addEventListener("click", () => {
          if (playerSelect.value === playerId) {
            return;
          }

          playerSelect.value = playerId;
          playerSelect.dispatchEvent(new Event("change", { bubbles: true }));
        });
        chipList.appendChild(chip);
      });

    row.append(header, chipList);
    const banner = tracker.querySelector(".selected-player-banner");
    if (banner) {
      banner.insertAdjacentElement("afterend", row);
    } else {
      switcher.insertAdjacentElement("afterend", row);
    }
  }

  function injectGameNotesReminder() {
    const tracker = document.querySelector("#feedback-tracker");
    if (!tracker) {
      return;
    }

    const notesPanel = tracker.querySelector(".game-notes-panel");
    if (!notesPanel) {
      return;
    }

    const existingHelper = notesPanel.querySelector(".game-notes-helper");
    if (existingHelper) {
      existingHelper.remove();
    }

    const heading = notesPanel.querySelector("h3");
    if (!heading) {
      return;
    }

    const helper = document.createElement("p");
    helper.className = "game-notes-helper";
    helper.textContent = "Best used during breaks or quarter-time.";
    heading.insertAdjacentElement("afterend", helper);
  }

  function scheduleFocusReturnCue() {
    focusReturnUntil = Date.now() + 2000;

    if (clearFocusTimer) {
      window.clearTimeout(clearFocusTimer);
    }

    clearFocusTimer = window.setTimeout(() => {
      focusReturnUntil = 0;
      const tracker = document.querySelector("#feedback-tracker");
      if (!tracker) {
        return;
      }
      const row = tracker.querySelector(".recent-players-row");
      const switcher = tracker.querySelector(".feedback-player-switcher");
      if (row) {
        row.classList.remove("attention");
      }
      if (switcher) {
        switcher.classList.remove("attention");
      }
    }, 2100);
  }

  function buildSpokenSnippet(playerName, summaryText) {
    const text = `${summaryText || ""}`.trim();
    if (!text) {
      return "";
    }

    const withoutName = text.startsWith(`${playerName}:`)
      ? text.slice(playerName.length + 1).trim()
      : text;
    const beforeNotes = withoutName.split("Match notes:")[0].trim();
    const firstSentence = beforeNotes.split(".").map((part) => part.trim()).filter(Boolean)[0] || beforeNotes;
    if (!firstSentence) {
      return "";
    }

    return `${playerName} — ${firstSentence}.`;
  }

  function buildQuarterCategoryTotals(quarterNumber, entries) {
    if (typeof getPlayerQuarterFeedback !== "function") {
      return [];
    }

    const totals = CATEGORY_META.map((category) => ({
      ...category,
      count: 0,
    }));

    entries.forEach((entry) => {
      const feedback = getPlayerQuarterFeedback(entry.playerId, quarterNumber);
      totals.forEach((category) => {
        category.count += feedback?.counts?.[category.id] || 0;
      });
    });

    return totals
      .filter((category) => category.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  function injectQuarterSummaryBlock() {
    const report = document.querySelector("#post-game-report");
    if (!report) {
      return;
    }

    const existing = report.querySelector(".report-quarter-summary");
    if (existing) {
      existing.remove();
    }

    if (typeof getSelectedFeedbackQuarter !== "function" || typeof buildQuarterReportEntries !== "function") {
      return;
    }

    const quarterNumber = getSelectedFeedbackQuarter();
    const entries = buildQuarterReportEntries(quarterNumber);
    if (!entries.length) {
      return;
    }

    const notesField = report.querySelector("#report-quarter-notes");
    const quarterNotes = notesField ? notesField.value.trim() : "";
    const categoryTotals = buildQuarterCategoryTotals(quarterNumber, entries);
    const notesPreview = quarterNotes
      ? quarterNotes.length > 180
        ? `${quarterNotes.slice(0, 177).trim()}...`
        : quarterNotes
      : "No quarter notes yet.";

    const summaryBlock = document.createElement("article");
    summaryBlock.className = "feedback-panel report-quarter-summary";

    const heading = document.createElement("div");
    heading.className = "section-heading report-card-header";
    heading.innerHTML = `
      <div>
        <h3>Quarter-Time Snapshot</h3>
        <p class="report-quarter-summary-helper">Fast recall for who stood out and what to say.</p>
      </div>
    `;

    const grid = document.createElement("div");
    grid.className = "report-quarter-summary-grid";

    const topPlayersCard = document.createElement("section");
    topPlayersCard.className = "summary-metric-card";
    topPlayersCard.innerHTML = `
      <h4>Top Marked Players</h4>
      <ul class="summary-metric-list">
        ${entries.slice(0, 3).map((entry) => `<li><strong>${entry.playerName}</strong><span>${entry.totalMarks} marks</span></li>`).join("")}
      </ul>
    `;

    const topCategoriesCard = document.createElement("section");
    topCategoriesCard.className = "summary-metric-card";
    topCategoriesCard.innerHTML = `
      <h4>Strongest Positives</h4>
      <ul class="summary-metric-list">
        ${categoryTotals.length
          ? categoryTotals.map((entry) => `<li><strong>${entry.label}</strong><span>${entry.count}</span></li>`).join("")
          : `<li><strong>No category totals yet</strong><span>—</span></li>`}
      </ul>
    `;

    const notesCard = document.createElement("section");
    notesCard.className = "summary-metric-card";
    notesCard.innerHTML = `
      <h4>Notes Preview</h4>
      <p class="summary-note-preview">${notesPreview}</p>
    `;

    grid.append(topPlayersCard, topCategoriesCard, notesCard);
    summaryBlock.append(heading, grid);

    const notesPanel = report.querySelector(".report-notes-panel");
    if (notesPanel) {
      notesPanel.insertAdjacentElement("afterend", summaryBlock);
    } else {
      report.prepend(summaryBlock);
    }
  }

  function injectQuarterSpokenSnippets() {
    const report = document.querySelector("#post-game-report");
    if (!report) {
      return;
    }

    const reportGrids = report.querySelectorAll(".report-grid");
    if (!reportGrids.length) {
      return;
    }

    const quarterGrid = reportGrids[0];
    quarterGrid.querySelectorAll(".report-card").forEach((card) => {
      const existing = card.querySelector(".report-spoken-snippet");
      if (existing) {
        existing.remove();
      }

      const name = card.querySelector("h3")?.textContent?.trim() || "Player";
      const summaryText = card.querySelector(".feedback-summary-text")?.textContent?.trim() || "";
      const snippetText = buildSpokenSnippet(name, summaryText);
      if (!snippetText) {
        return;
      }

      const snippet = document.createElement("p");
      snippet.className = "report-spoken-snippet";
      snippet.innerHTML = `<span>Say:</span> ${snippetText}`;
      card.appendChild(snippet);
    });
  }

  function applyReportEnhancements() {
    injectQuarterSummaryBlock();
    injectQuarterSpokenSnippets();
  }

  function bindEnhancementEvents() {
    const tracker = document.querySelector("#feedback-tracker");
    if (!tracker) {
      return;
    }

    const playerSelect = tracker.querySelector("#feedback-player-select");
    if (playerSelect) {
      playerSelect.addEventListener("change", () => {
        rememberPlayer(playerSelect.value);
      });
    }

    tracker.querySelectorAll("[data-category-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const currentSelect = document.querySelector("#feedback-player-select");
        if (currentSelect) {
          rememberPlayer(currentSelect.value);
        }
        scheduleFocusReturnCue();
      });
    });
  }

  function applyFeedbackEnhancements() {
    injectSelectedPlayerBanner();
    injectRecentPlayersRow();
    injectGameNotesReminder();
    bindEnhancementEvents();
  }

  const originalRenderFeedbackTracker = window.renderFeedbackTracker;
  if (typeof originalRenderFeedbackTracker === "function") {
    window.renderFeedbackTracker = function (...args) {
      const result = originalRenderFeedbackTracker.apply(this, args);
      applyFeedbackEnhancements();
      return result;
    };
  }

  const originalAddFeedbackMark = window.addFeedbackMark;
  if (typeof originalAddFeedbackMark === "function") {
    window.addFeedbackMark = function (...args) {
      const playerSelect = document.querySelector("#feedback-player-select");
      if (playerSelect) {
        rememberPlayer(playerSelect.value);
      }
      const result = originalAddFeedbackMark.apply(this, args);
      scheduleFocusReturnCue();
      window.requestAnimationFrame(() => {
        applyFeedbackEnhancements();
        applyReportEnhancements();
      });
      return result;
    };
  }

  const originalRenderPostGameReport = window.renderPostGameReport;
  if (typeof originalRenderPostGameReport === "function") {
    window.renderPostGameReport = function (...args) {
      const result = originalRenderPostGameReport.apply(this, args);
      applyReportEnhancements();
      return result;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyFeedbackEnhancements();
      applyReportEnhancements();
    }, { once: true });
  } else {
    applyFeedbackEnhancements();
    applyReportEnhancements();
  }
})();
