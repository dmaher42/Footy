(function () {
  const CATEGORY_META = [
    { id: "effort", label: "Effort", icon: "💪", helper: "Repeat efforts, chase, compete" },
    { id: "defence", label: "Defence", icon: "🛡", helper: "Spoil, stop, defend role" },
    { id: "attack", label: "Attack", icon: "⚡", helper: "Drive, create, score involvement" },
    { id: "teamacts", label: "Team Acts", icon: "🤝", helper: "Support, shepherd, selfless play" },
    { id: "voice", label: "Voice", icon: "🗣", helper: "Talk, organise, direct" },
    { id: "teamacts_old", label: "1%ers", icon: "🧠", helper: "Little efforts that shift contests" },
  ];
  let focusReturnUntil = 0;
  let clearFocusTimer = null;

  function getCategoryMeta(categoryId) {
    return CATEGORY_META.find((category) => category.id === categoryId) || null;
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

  function injectCategoryHelpers() {
    const tracker = document.querySelector("#feedback-tracker");
    if (!tracker) {
      return;
    }

    tracker.querySelectorAll("[data-category-id]").forEach((button) => {
      const categoryId = button.dataset.categoryId;
      const meta = getCategoryMeta(categoryId);
      if (!meta) {
        return;
      }

      const countBadge = button.querySelector("strong");
      if (!countBadge) {
        return;
      }

      let copyWrap = button.querySelector(".feedback-category-copy");
      if (!copyWrap) {
        const existingLeadingSpan = button.querySelector("span");
        if (existingLeadingSpan) {
          existingLeadingSpan.remove();
        }

        copyWrap = document.createElement("span");
        copyWrap.className = "feedback-category-copy";
        button.insertBefore(copyWrap, countBadge);
      }

      copyWrap.innerHTML = `
        <span class="feedback-category-title">${meta.icon} ${meta.label}</span>
        <span class="feedback-category-helper">${meta.helper}</span>
      `;
    });
  }

  function scheduleFocusReturnCue() {
    focusReturnUntil = Date.now() + 1400;

    if (clearFocusTimer) {
      window.clearTimeout(clearFocusTimer);
    }

    const tracker = document.querySelector("#feedback-tracker");
    const switcher = tracker?.querySelector(".feedback-player-switcher");
    if (switcher) {
      switcher.classList.add("attention");
    }

    clearFocusTimer = window.setTimeout(() => {
      focusReturnUntil = 0;
      const feedbackTracker = document.querySelector("#feedback-tracker");
      const feedbackSwitcher = feedbackTracker?.querySelector(".feedback-player-switcher");
      if (feedbackSwitcher) {
        feedbackSwitcher.classList.remove("attention");
      }
    }, 1500);
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
      .sort((a, b) => b.count - a.count);
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
      <h4>Team Category Totals</h4>
      <ul class="summary-metric-list category-totals-list">
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

  function applyFeedbackEnhancements() {
    injectGameNotesReminder();
    injectCategoryHelpers();
  }

  const originalRenderFeedbackTracker = window.renderFeedbackTracker;
  if (typeof originalRenderFeedbackTracker === "function") {
    window.renderFeedbackTracker = function (...args) {
      const result = originalRenderFeedbackTracker.apply(this, args);
      applyFeedbackEnhancements();

      const tracker = document.querySelector("#feedback-tracker");
      const switcher = tracker?.querySelector(".feedback-player-switcher");
      if (switcher && Date.now() < focusReturnUntil) {
        switcher.classList.add("attention");
      }

      return result;
    };
  }

  const originalAddFeedbackMark = window.addFeedbackMark;
  if (typeof originalAddFeedbackMark === "function") {
    window.addFeedbackMark = function (...args) {
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
