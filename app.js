const STORAGE_KEY = "footy-player-manager-state";
const APP_VERSION = "2026.04.16.1";
const CHECK_UPDATE_BUTTON_LABEL = "Check for Update";
const FEEDBACK_CATEGORIES = [
  {
    id: "effort",
    label: "Effort",
    title: "Effort",
    icon: "💪",
    prompts: [
      "Ran hard all day and kept competing.",
      "Worked hard in repeat efforts and kept turning up.",
      "Set the tone with effort and work rate."
    ]
  },
  {
    id: "defence",
    label: "Defence",
    title: "Defence",
    icon: "🛡",
    prompts: [
      "Defended strongly and made their opponent work.",
      "Read the play well and helped stop the opposition.",
      "Won important defensive moments for the team."
    ]
  },
  {
    id: "attack",
    label: "Attack",
    title: "Attack",
    icon: "⚡",
    prompts: [
      "Created attacking opportunities and drove the team forward.",
      "Worked hard to be an option and helped us attack.",
      "Had real impact in our attacking play."
    ]
  },
  {
    id: "teamacts",
    label: "Team Acts",
    title: "Team Acts",
    icon: "🤝",
    prompts: [
      "Played for the team and made others better.",
      "Did strong team-first things that helped us play well.",
      "Supported teammates and contributed to the group."
    ]
  },
  {
    id: "voice",
    label: "Voice",
    title: "Voice",
    icon: "🗣",
    prompts: [
      "Used their voice well and helped organise the team.",
      "Communicated strongly and lifted those around them.",
      "Brought good voice and leadership to the game."
    ]
  },
  {
    id: "teamacts_old",
    label: "1%ers",
    title: "1%ers",
    icon: "🧠",
    prompts: [
      "Did the little things that really matter in games.",
      "Produced strong one-percent efforts for the team.",
      "Showed discipline and team-first habits in key moments."
    ]
  }
];

const state = {
  players: [],
  settings: {
    periodLabel: "Quarter",
    periodCount: 4,
    playersOnField: 18,
  },
  feedback: {
    selectedPlayerId: null,
    currentQuarter: 1,
    byPlayerId: {},
  },
  notepad: {
    currentQuarter: 1,
    byQuarter: {},
    reflection: "",
  },
  gameReviews: {
    selectedReviewId: null,
    draft: createEmptyGameReviewDraft(),
    items: [],
  },
  trainingPlans: {
    selectedPlanId: null,
    draft: createEmptyTrainingPlanDraft(),
    items: [],
  },
  weeklyFocus: {
    selectedFocusId: null,
    draft: createEmptyWeeklyFocusDraft(),
    items: [],
  },
  seasonHub: {
    selectedHubId: null,
    draft: createEmptySeasonHubDraft(),
    items: [],
  },
  playerNotes: {
    selectedPlayerId: null,
    draft: createEmptyPlayerNoteDraft(),
    items: [],
  },
};

const elements = {
  updatePanel: document.querySelector("#update-panel"),
  toggleUpdateMenuBtn: document.querySelector("#toggle-update-menu-btn"),
  updatePanelCard: document.querySelector("#update-panel-card"),
  updateStatusPanel: document.querySelector("#update-status-panel"),
  updateTitle: document.querySelector("#update-title"),
  updateText: document.querySelector("#update-text"),
  checkUpdateBtn: document.querySelector("#check-update-btn"),
  applyUpdateBtn: document.querySelector("#apply-update-btn"),
  gameViewButtons: document.querySelectorAll("[data-game-view]"),
  rotationSection: document.querySelector("#rotation-section"),
  feedbackSection: document.querySelector("#feedback-section"),
  gameReviewsSection: document.querySelector("#game-reviews-section"),
  trainingPlansSection: document.querySelector("#training-plans-section"),
  weeklyFocusSection: document.querySelector("#weekly-focus-section"),
  seasonHubSection: document.querySelector("#season-hub-section"),
  playerNotesSection: document.querySelector("#player-notes-section"),
  notepadSection: document.querySelector("#notepad-section"),
  reportSection: document.querySelector("#report-section"),
  periodLabel: document.querySelector("#period-label"),
  periodCount: document.querySelector("#period-count"),
  playersOnField: document.querySelector("#players-on-field"),
  bulkInput: document.querySelector("#bulk-player-input"),
  addPlayersBtn: document.querySelector("#add-players-btn"),
  clearAllBtn: document.querySelector("#clear-all-btn"),
  toggleBenchRulesBtn: document.querySelector("#toggle-bench-rules-btn"),
  editSetupBtn: document.querySelector("#edit-setup-btn"),
  closeSetupBtn: document.querySelector("#close-setup-btn"),
  generateCloseBtn: document.querySelector("#generate-close-btn"),
  generateBtn: document.querySelector("#generate-btn"),
  printBtn: document.querySelector("#print-btn"),
  setupBackdrop: document.querySelector("#setup-backdrop"),
  setupPanel: document.querySelector("#setup-panel"),
  copyFeedbackBtn: document.querySelector("#copy-feedback-btn"),
  gameReviewsContent: document.querySelector("#game-reviews-content"),
  trainingPlansContent: document.querySelector("#training-plans-content"),
  weeklyFocusContent: document.querySelector("#weekly-focus-content"),
  seasonHubContent: document.querySelector("#season-hub-content"),
  playerNotesContent: document.querySelector("#player-notes-content"),
  toggleFullReportBtn: document.querySelector("#toggle-full-report-btn"),
  copyReportBtn: document.querySelector("#copy-report-btn"),
  feedbackTracker: document.querySelector("#feedback-tracker"),
  notepadContent: document.querySelector("#notepad-content"),
  postGameReport: document.querySelector("#post-game-report"),
  tableBody: document.querySelector("#player-table-body"),
  messages: document.querySelector("#messages"),
  rotationOutput: document.querySelector("#rotation-output"),
  playerTableWrap: document.querySelector("#player-table-wrap"),
  playerRowTemplate: document.querySelector("#player-row-template"),
};

let currentRotationPlan = null;
let isSetupOpen = false;
let activeGameView = "feedback";
let activeRotationPeriod = 0;
let selectedFieldPlayerId = "";
let selectedBenchPlayerId = "";
let showRotationSummary = false;
let showBenchRules = false;
let showFullGameReport = false;
let serviceWorkerRegistration = null;
let waitingServiceWorker = null;
let shouldReloadForUpdate = false;
let pendingVersion = null;
let updateButtonResetTimer = null;
let isUpdateMenuOpen = false;

registerServiceWorker();
loadState();
bindEvents();
render();

function bindEvents() {
  elements.addPlayersBtn.addEventListener("click", addPlayersFromBulkInput);
  elements.clearAllBtn.addEventListener("click", clearAllPlayers);
  elements.toggleBenchRulesBtn.addEventListener("click", toggleBenchRulesVisibility);
  elements.editSetupBtn.addEventListener("click", () => {
    setUpdateMenuOpen(false);
    openSetupPanel();
  });
  elements.closeSetupBtn.addEventListener("click", closeSetupPanel);
  elements.generateCloseBtn.addEventListener("click", refreshPlanAndCloseSetup);
  elements.generateBtn.addEventListener("click", () => {
    setUpdateMenuOpen(false);
    refreshPlanAndCloseSetup();
  });
  elements.printBtn.addEventListener("click", () => {
    setUpdateMenuOpen(false);
    window.print();
  });
  elements.setupBackdrop.addEventListener("click", closeSetupPanel);
  elements.checkUpdateBtn.addEventListener("click", checkForAppUpdate);
  elements.applyUpdateBtn.addEventListener("click", applyAppUpdate);
  elements.toggleUpdateMenuBtn.addEventListener("click", toggleUpdateMenu);
  elements.copyFeedbackBtn.addEventListener("click", copySelectedFeedbackSummary);
  elements.toggleFullReportBtn.addEventListener("click", toggleFullGameReportVisibility);
  elements.copyReportBtn.addEventListener("click", copyFullPostGameReport);

  elements.gameViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeGameView = button.dataset.gameView;
      setUpdateMenuOpen(false);
      syncGameView();
    });
  });

  elements.periodLabel.addEventListener("input", handleSettingsChange);
  elements.periodCount.addEventListener("input", handleSettingsChange);
  elements.playersOnField.addEventListener("input", handleSettingsChange);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSetupOpen) {
      closeSetupPanel();
    }

    if (event.key === "Escape" && isUpdateMenuOpen) {
      setUpdateMenuOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!isUpdateMenuOpen) {
      return;
    }

    if (elements.updatePanel.contains(event.target)) {
      return;
    }

    setUpdateMenuOpen(false);
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    showUpdateState("", false);
    setCheckUpdateButtonState("Updates Unavailable", true);
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`, {
      updateViaCache: "none",
    }).then((registration) => {
      serviceWorkerRegistration = registration;
      monitorServiceWorker(registration);

      if (registration.waiting) {
        waitingServiceWorker = registration.waiting;
        showUpdateState("A new version is ready. Tap Refresh App to load it.", true);
      } else {
        showUpdateState("", false);
      }
    }).catch((error) => {
      console.error("Could not register service worker.", error);
      showUpdateState("", false);
      setCheckUpdateButtonState("Try Again", false, 2200);
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!shouldReloadForUpdate) {
        return;
      }

      window.location.reload();
    });
  });
}

function monitorServiceWorker(registration) {
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (!newWorker) {
      return;
    }

    setCheckUpdateButtonState("Checking...", true);

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed") {
        if (navigator.serviceWorker.controller) {
          waitingServiceWorker = registration.waiting || newWorker;
          showUpdateState("A new version is ready. Tap Refresh App to load it.", true);
          setCheckUpdateButtonState("Update Ready", false);
        } else {
          showUpdateState("", false);
          setCheckUpdateButtonState(CHECK_UPDATE_BUTTON_LABEL, false);
        }
      }
    });
  });
}

function checkForAppUpdate() {
  if (!navigator.onLine) {
    showUpdateState("", false);
    setCheckUpdateButtonState("Offline", false, 2200);
    return;
  }

  if (!serviceWorkerRegistration) {
    showUpdateState("", false);
    setCheckUpdateButtonState("Try Again", false, 2200);
    return;
  }

  setCheckUpdateButtonState("Checking...", true);

  Promise.all([
    serviceWorkerRegistration.update(),
    fetchLatestVersionInfo(),
  ]).then(([, latestVersionInfo]) => {
    if (serviceWorkerRegistration.waiting) {
      waitingServiceWorker = serviceWorkerRegistration.waiting;
      showUpdateState("A new version is ready. Tap Refresh App to load it.", true);
      setCheckUpdateButtonState("Update Ready", false);
      return;
    }

    if (latestVersionInfo?.version && latestVersionInfo.version !== APP_VERSION) {
      pendingVersion = latestVersionInfo.version;
      showUpdateState(`A newer version (${latestVersionInfo.version}) is available. Tap Refresh App to load it.`, true);
      setCheckUpdateButtonState("Update Ready", false);
      return;
    }

    pendingVersion = null;
    showUpdateState("", false);
    setCheckUpdateButtonState("Up to Date", false, 2200);
  }).catch((error) => {
    console.error("Could not check for app updates.", error);
    showUpdateState("", false);
    setCheckUpdateButtonState("Try Again", false, 2200);
  });
}

function applyAppUpdate() {
  if (!waitingServiceWorker && !pendingVersion) {
    showUpdateState("", false);
    setCheckUpdateButtonState(CHECK_UPDATE_BUTTON_LABEL, false);
    return;
  }

  showUpdateState("Refreshing to the newest version...", true);
  setCheckUpdateButtonState("Refreshing...", true);

  clearAppCaches().then(() => {
    if (waitingServiceWorker) {
      shouldReloadForUpdate = true;
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    forceRefreshToLatestVersion();
  }).catch((error) => {
    console.error("Could not refresh app caches.", error);
    forceRefreshToLatestVersion();
  });
}

function showUpdateState(message, isVisible) {
  elements.updateStatusPanel.hidden = !isVisible;
  elements.updateText.textContent = message;
  elements.applyUpdateBtn.hidden = !message.includes("Refresh App");

  if (!isVisible) {
    setUpdateMenuOpen(false);
    elements.toggleUpdateMenuBtn.textContent = "Menu";
    elements.toggleUpdateMenuBtn.setAttribute("aria-label", "Menu");
    return;
  }

  elements.toggleUpdateMenuBtn.textContent = elements.applyUpdateBtn.hidden ? "Menu" : "Update Ready";
  elements.toggleUpdateMenuBtn.setAttribute("aria-label", elements.toggleUpdateMenuBtn.textContent);
}

function toggleUpdateMenu() {
  setUpdateMenuOpen(!isUpdateMenuOpen);
}

function setUpdateMenuOpen(isOpen) {
  isUpdateMenuOpen = isOpen;
  elements.updatePanelCard.hidden = !isOpen;
  elements.toggleUpdateMenuBtn.setAttribute("aria-expanded", String(isOpen));
}

function setCheckUpdateButtonState(label, disabled, resetAfterMs = 0) {
  elements.checkUpdateBtn.textContent = label;
  elements.checkUpdateBtn.disabled = disabled;

  if (updateButtonResetTimer) {
    window.clearTimeout(updateButtonResetTimer);
    updateButtonResetTimer = null;
  }

  if (resetAfterMs > 0) {
    updateButtonResetTimer = window.setTimeout(() => {
      elements.checkUpdateBtn.textContent = CHECK_UPDATE_BUTTON_LABEL;
      elements.checkUpdateBtn.disabled = false;
      updateButtonResetTimer = null;
    }, resetAfterMs);
  }
}

function fetchLatestVersionInfo() {
  return fetch(`./version.json?ts=${Date.now()}`, {
    cache: "no-store",
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Version request failed with status ${response.status}`);
    }

    return response.json();
  });
}

function clearAppCaches() {
  if (!("caches" in window)) {
    return Promise.resolve();
  }

  return caches.keys().then((cacheNames) =>
    Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("footy-player-manager"))
        .map((cacheName) => caches.delete(cacheName))
    )
  );
}

function forceRefreshToLatestVersion() {
  const unregisterPromise = "serviceWorker" in navigator
    ? navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister()))
    )
    : Promise.resolve();

  unregisterPromise
    .catch((error) => {
      console.error("Could not unregister service workers during refresh.", error);
    })
    .finally(() => {
      window.location.replace(buildReloadUrl());
    });
}

function buildReloadUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("refresh", Date.now().toString());
  return url.toString();
}

function handleSettingsChange() {
  state.settings.periodLabel = normalizePeriodLabel(elements.periodLabel.value);
  state.settings.periodCount = normalizePositiveNumber(elements.periodCount.value, 4);
  state.settings.playersOnField = normalizePositiveNumber(elements.playersOnField.value, 18);
  saveState();
  refreshPlanAndRender();
}

function addPlayersFromBulkInput() {
  const lines = elements.bulkInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    showMessages([{ type: "warn", text: "Add at least one player name before pressing Add Players." }]);
    return;
  }

  const existingNames = new Set(state.players.map((player) => player.name.toLowerCase()));
  let addedCount = 0;

  lines.forEach((name) => {
    if (existingNames.has(name.toLowerCase())) {
      return;
    }

    state.players.push({
      id: createId(),
      name,
      preferredPosition: "",
      active: true,
      canBench: true,
      benchFirst: false,
      maxBenchPeriods: "",
    });
    existingNames.add(name.toLowerCase());
    addedCount += 1;
  });

  sortPlayersAlphabetically();
  elements.bulkInput.value = "";
  saveState();
  refreshPlanAndRender();
  renderPlayerTable();

  const messageText = addedCount
    ? `${addedCount} player${addedCount === 1 ? "" : "s"} added.`
    : "No new players were added because those names are already in the squad list.";

  showMessages([{ type: addedCount ? "info" : "warn", text: messageText }]);
}

function clearAllPlayers() {
  if (!state.players.length) {
    return;
  }

  const confirmed = window.confirm("Remove every player from the squad list?");
  if (!confirmed) {
    return;
  }

  state.players = [];
  state.feedback = {
    selectedPlayerId: null,
    currentQuarter: 1,
    byPlayerId: {},
  };
  state.notepad.currentQuarter = 1;
  currentRotationPlan = null;
  saveState();
  render();
  showMessages([{ type: "info", text: "All players cleared." }]);
}

function render() {
  syncSettingsInputs();
  syncSetupPanel();
  syncGameView();
  syncBenchRulesVisibility();
  syncSelectedFeedbackPlayer();
  renderPlayerTable();
  if (activeGameView === "rotation") {
    renderRotation();
  } else {
    currentRotationPlan = null;
  }
  renderFeedbackTracker();
  renderGameReviews();
  renderTrainingPlans();
  renderWeeklyFocus();
  renderSeasonHub();
  renderPlayerNotes();
  renderNotepad();
  renderPostGameReport();
}

function syncSettingsInputs() {
  elements.periodLabel.value = state.settings.periodLabel;
  elements.periodCount.value = state.settings.periodCount;
  elements.playersOnField.value = state.settings.playersOnField;
}

function renderPlayerTable() {
  elements.tableBody.innerHTML = "";

  if (!state.players.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="7" class="muted">No players added yet.</td>';
    elements.tableBody.appendChild(row);
    return;
  }

  state.players.forEach((player) => {
    const fragment = elements.playerRowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");
    const nameInput = fragment.querySelector(".player-name");
    const positionInput = fragment.querySelector(".player-position");
    const activeInput = fragment.querySelector(".player-active");
    const canBenchInput = fragment.querySelector(".player-can-bench");
    const benchFirstInput = fragment.querySelector(".player-bench-first");
    const maxBenchInput = fragment.querySelector(".player-max-bench");
    const removeButton = fragment.querySelector(".remove-player-btn");

    nameInput.value = player.name;
    positionInput.value = player.preferredPosition;
    activeInput.checked = player.active;
    canBenchInput.checked = player.canBench !== false;
    benchFirstInput.checked = player.benchFirst === true;
    maxBenchInput.value = player.maxBenchPeriods ?? "";

    nameInput.addEventListener("input", (event) => {
      player.name = event.target.value.trimStart();
      saveState();
      refreshPlanAndRender();
    });

    nameInput.addEventListener("change", () => {
      sortPlayersAlphabetically();
      currentRotationPlan = buildRotationPlan();
      saveState();
      render();
    });

    positionInput.addEventListener("input", (event) => {
      player.preferredPosition = event.target.value.trimStart();
      saveState();
      refreshPlanAndRender();
    });

    activeInput.addEventListener("change", (event) => {
      player.active = event.target.checked;
      saveState();
      refreshPlanAndRender();
    });

    canBenchInput.addEventListener("change", (event) => {
      player.canBench = event.target.checked;
      saveState();
      refreshPlanAndRender();
    });

    benchFirstInput.addEventListener("change", (event) => {
      player.benchFirst = event.target.checked;
      saveState();
      refreshPlanAndRender();
    });

    maxBenchInput.addEventListener("input", (event) => {
      player.maxBenchPeriods = normalizeMaxBenchValue(event.target.value);
      saveState();
      refreshPlanAndRender();
    });

    removeButton.addEventListener("click", () => {
      state.players = state.players.filter((entry) => entry.id !== player.id);
      delete state.feedback.byPlayerId[player.id];
      if (state.feedback.selectedPlayerId === player.id) {
        state.feedback.selectedPlayerId = null;
      }
      saveState();
      refreshPlanAndRender();
      render();
    });

    row.dataset.playerId = player.id;
    elements.tableBody.appendChild(fragment);
  });
}

function renderRotation() {
  if (!currentRotationPlan) {
    currentRotationPlan = buildRotationPlan();
  }

  const rotationPlan = currentRotationPlan;
  showMessages(getPlanMessages(rotationPlan));

  if (!rotationPlan.periods.length) {
    const placeholderText = state.players.length
      ? 'The current setup cannot generate a valid rotation yet. Adjust the player settings and try again.'
      : 'Add players, then press <strong>Generate Rotation</strong>.';

    elements.rotationOutput.innerHTML = `<p class="placeholder">${placeholderText}</p>`;
    return;
  }

  activeRotationPeriod = Math.min(activeRotationPeriod, rotationPlan.periods.length - 1);
  const activePeriod = rotationPlan.periods[activeRotationPeriod];
  const activeFieldIds = new Set(activePeriod.onField.map((player) => player.id));
  const activeBenchIds = new Set(activePeriod.bench.map((player) => player.id));

  if (!activeFieldIds.has(selectedFieldPlayerId)) {
    selectedFieldPlayerId = "";
  }

  if (!activeBenchIds.has(selectedBenchPlayerId)) {
    selectedBenchPlayerId = "";
  }

  const periodButtons = rotationPlan.periods
    .map((period, index) => `
      <button class="period-tab ${index === activeRotationPeriod ? "active" : ""}" type="button" data-period-tab="${index}">
        ${escapeHtml(period.label)}
      </button>
    `)
    .join("");

  const fieldBoardMarkup = renderFieldBoard(activePeriod);
  const benchCards = activePeriod.bench.length
    ? activePeriod.bench
      .map((player) => renderRotationBoardPlayer(player, "bench", activePeriod.index, player.id === selectedBenchPlayerId))
      .join("")
    : '<p class="board-empty muted">No bench this period.</p>';
  const summaryRows = rotationPlan.summary
    .map((player) => `
      <tr>
        <td>${escapeHtml(player.name)}</td>
        <td>${player.onFieldCount}/${rotationPlan.settings.periodCount}</td>
        <td>${player.benchCount}</td>
      </tr>
    `)
    .join("");
  const boardStatus = getRotationBoardStatus(activePeriod);

  elements.rotationOutput.innerHTML = `
    <div class="period-toolbar">
      <div class="period-tabs">${periodButtons}</div>
    </div>

    <article class="rotation-card focus-card">
      <div class="section-heading focus-card-header">
        <div>
          <h3>${escapeHtml(activePeriod.label)}</h3>
          <p class="helper">Tap a field player, then a bench player, to make a swap.</p>
        </div>
        <button class="compact-toggle-btn" type="button" id="toggle-rotation-summary-btn">${showRotationSummary ? "Hide Totals" : "Show Totals"}</button>
      </div>

      <div class="rotation-board-meta">
        <p class="board-status">${escapeHtml(boardStatus)}</p>
        <div class="board-counts" aria-label="Current rotation counts">
          <span class="board-count-pill">On Field: ${activePeriod.onField.length}</span>
          <span class="board-count-pill bench-count-pill">Bench: ${activePeriod.bench.length}</span>
        </div>
      </div>

      <div class="rotation-board">
        <section class="board-zone field-zone">
          <div class="board-zone-header">
            <h4>On Field</h4>
            <span>${activePeriod.onField.length} players</span>
          </div>
          ${fieldBoardMarkup}
        </section>
        <section class="board-zone bench-zone">
          <div class="board-zone-header">
            <h4>Bench</h4>
            <span>${activePeriod.bench.length} players</span>
          </div>
          <div class="player-board bench-board">
            ${benchCards}
          </div>
        </section>
      </div>
    </article>

    ${showRotationSummary ? `
      <article class="summary-card">
        <h3>Player Totals</h3>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>On Field</th>
              <th>Bench</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </article>
    ` : ""}
  `;

  bindSwapButtons();
  bindRotationControls();
}

function bindRotationControls() {
  elements.rotationOutput.querySelectorAll("[data-period-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeRotationPeriod = Number.parseInt(button.dataset.periodTab, 10);
      clearRotationSelection();
      renderRotation();
    });
  });

  const toggleSummaryButton = elements.rotationOutput.querySelector("#toggle-rotation-summary-btn");
  if (toggleSummaryButton) {
    toggleSummaryButton.addEventListener("click", () => {
      showRotationSummary = !showRotationSummary;
      renderRotation();
    });
  }
}

function buildRotationPlan() {
  const activePlayers = state.players
    .map((player) => ({
      ...player,
      name: player.name.trim(),
      preferredPosition: player.preferredPosition.trim(),
      canBench: player.canBench !== false,
      benchFirst: player.benchFirst === true,
      maxBenchPeriods: normalizeNullableNonNegativeNumber(player.maxBenchPeriods),
    }))
    .filter((player) => player.active && player.name);

  const periodLabel = normalizePeriodLabel(state.settings.periodLabel);
  const periodCount = normalizePositiveNumber(state.settings.periodCount, 4);
  const playersOnField = normalizePositiveNumber(state.settings.playersOnField, 18);

  const messages = [];

  if (!activePlayers.length) {
    return {
      periods: [],
      summary: [],
      messages: [{ type: "warn", text: "There are no available players yet." }],
      settings: { periodLabel, periodCount, playersOnField },
    };
  }

  if (activePlayers.length <= playersOnField) {
    messages.push({
      type: "info",
      text: "You have the same number of available players as on-field spots, or fewer. Everyone will play every period.",
    });
  }

  const trackers = activePlayers.map((player, index) => ({
    ...player,
    onFieldCount: 0,
    benchCount: 0,
    consecutiveField: 0,
    consecutiveBench: 0,
    orderSeed: index,
  }));

  const periods = [];
  const benchSpots = Math.max(trackers.length - playersOnField, 0);
  const lockedOnPlayers = trackers.filter((player) => !player.canBench);
  const benchEligiblePlayers = trackers.filter((player) => player.canBench);
  const totalBenchDemand = benchSpots * periodCount;
  const totalBenchCapacity = benchEligiblePlayers.reduce((total, player) => {
    if (player.maxBenchPeriods === null) {
      return total + periodCount;
    }

    return total + Math.min(player.maxBenchPeriods, periodCount);
  }, 0);

  if (lockedOnPlayers.length > playersOnField) {
    return {
      periods: [],
      summary: [],
      messages: [{
        type: "warn",
        text: `You have ${lockedOnPlayers.length} players marked Keep On, but only ${playersOnField} on-field spots. Either increase Players On Field or allow some of those players to bench.`,
      }],
      settings: { periodLabel, periodCount, playersOnField },
    };
  }

  if (benchSpots > benchEligiblePlayers.length) {
    return {
      periods: [],
      summary: [],
      messages: [{
        type: "warn",
        text: `You need ${benchSpots} bench spots each period, but only ${benchEligiblePlayers.length} players are allowed to bench. Tick Can Bench for more players.`,
      }],
      settings: { periodLabel, periodCount, playersOnField },
    };
  }

  if (totalBenchDemand > totalBenchCapacity) {
    return {
      periods: [],
      summary: [],
      messages: [{
        type: "warn",
        text: `You need ${totalBenchDemand} total bench spots across the game, but your player limits only allow ${totalBenchCapacity}. Increase a player's Max Bench or allow more players to bench.`,
      }],
      settings: { periodLabel, periodCount, playersOnField },
      baseMessages: [],
      manualEdited: false,
    };
  }

  for (let periodIndex = 0; periodIndex < periodCount; periodIndex += 1) {
    let bench = [];

    if (benchSpots > 0) {
      const benchCandidates = benchEligiblePlayers
        .filter((player) => player.maxBenchPeriods === null || player.benchCount < player.maxBenchPeriods)
        .sort((a, b) => {
          if (a.benchFirst !== b.benchFirst) {
            return a.benchFirst ? -1 : 1;
          }

        if (b.onFieldCount !== a.onFieldCount) {
          return b.onFieldCount - a.onFieldCount;
        }

        if (b.consecutiveField !== a.consecutiveField) {
          return b.consecutiveField - a.consecutiveField;
        }

        if (a.consecutiveBench !== b.consecutiveBench) {
          return a.consecutiveBench - b.consecutiveBench;
        }

        return a.orderSeed - b.orderSeed;
      });

      if (benchCandidates.length < benchSpots) {
        return {
          periods: [],
          summary: [],
          messages: [{
            type: "warn",
            text: `By ${periodLabel.toLowerCase()} ${periodIndex + 1}, there are not enough players left who are allowed to bench. Raise a Max Bench limit or tick Can Bench for more players.`,
          }],
          settings: { periodLabel, periodCount, playersOnField },
          baseMessages: [],
          manualEdited: false,
        };
      }

      bench = benchCandidates.slice(0, benchSpots);
    }

    const benchIds = new Set(bench.map((player) => player.id));
    const onField = trackers
      .filter((player) => !benchIds.has(player.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    bench = [...bench].sort((a, b) => a.name.localeCompare(b.name));

    trackers.forEach((player) => {
      if (benchIds.has(player.id)) {
        player.benchCount += 1;
        player.consecutiveBench += 1;
        player.consecutiveField = 0;
        return;
      }

      player.onFieldCount += 1;
      player.consecutiveField += 1;
      player.consecutiveBench = 0;
    });

    periods.push({
      index: periodIndex,
      label: `${periodLabel} ${periodIndex + 1}`,
      onField,
      bench,
    });
  }

  const summary = buildPlanSummary(periods, trackers, periodCount);

  if (benchSpots > 0) {
    const highestBenchCount = Math.max(...summary.map((player) => player.benchCount));
    const lowestBenchCount = Math.min(...summary.map((player) => player.benchCount));

    if (highestBenchCount - lowestBenchCount > 1) {
      messages.push({
        type: "warn",
        text: "The benching could not be perfectly even with your current numbers, but the app has balanced it as closely as possible.",
      });
    } else {
      messages.push({
        type: "info",
        text: "Rotation generated using only players marked Can Bench, with Bench First and Max Bench rules applied.",
      });
    }
  }

  return {
    periods,
    summary,
    messages,
    baseMessages: [...messages],
    manualEdited: false,
    playerPool: trackers.map((player) => ({
      id: player.id,
      name: player.name,
    })),
    settings: { periodLabel, periodCount, playersOnField },
  };
}

function refreshPlanAndRender() {
  if (activeGameView === "rotation") {
    currentRotationPlan = buildRotationPlan();
    renderRotation();
  } else {
    currentRotationPlan = null;
  }
  renderFeedbackTracker();
  renderGameReviews();
  renderTrainingPlans();
  renderWeeklyFocus();
  renderSeasonHub();
  renderPlayerNotes();
  renderPostGameReport();
}

function refreshPlanAndCloseSetup() {
  refreshPlanAndRender();
  closeSetupPanel();
}

function openSetupPanel() {
  isSetupOpen = true;
  syncSetupPanel();
}

function closeSetupPanel() {
  isSetupOpen = false;
  syncSetupPanel();
}

function syncSetupPanel() {
  elements.setupPanel.classList.toggle("open", isSetupOpen);
  elements.setupPanel.setAttribute("aria-hidden", String(!isSetupOpen));
  elements.setupBackdrop.hidden = !isSetupOpen;
  document.body.classList.toggle("setup-open", isSetupOpen);
}

function syncGameView() {
  const viewMap = {
    feedback: elements.feedbackSection,
    gameReviews: elements.gameReviewsSection,
    trainingPlans: elements.trainingPlansSection,
    weeklyFocus: elements.weeklyFocusSection,
    seasonHub: elements.seasonHubSection,
    playerNotes: elements.playerNotesSection,
    notepad: elements.notepadSection,
    report: elements.reportSection,
  };

  Object.entries(viewMap).forEach(([viewName, section]) => {
    section.hidden = viewName !== activeGameView;
  });

  elements.gameViewButtons.forEach((button) => {
    const isActive = button.dataset.gameView === activeGameView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncSelectedFeedbackPlayer() {
  const availablePlayers = state.players.filter((player) => player.name && player.active);

  if (!availablePlayers.length) {
    state.feedback.selectedPlayerId = null;
    return;
  }

  const selectedStillExists = availablePlayers.some((player) => player.id === state.feedback.selectedPlayerId);
  if (!selectedStillExists) {
    state.feedback.selectedPlayerId = availablePlayers[0].id;
  }
}

function renderFeedbackTracker() {
  const availablePlayers = state.players.filter((player) => player.name && player.active);

  if (!availablePlayers.length) {
    elements.feedbackTracker.innerHTML = '<p class="placeholder">Add players to start tracking feedback.</p>';
    renderPostGameReport();
    return;
  }

  const selectedQuarter = getSelectedFeedbackQuarter();
  const selectedQuarterLabel = getFeedbackQuarterLabel(selectedQuarter);
  const quarterEntry = getNotepadQuarterEntry(selectedQuarter);
  const selectedPlayer = availablePlayers.find((player) => player.id === state.feedback.selectedPlayerId) || availablePlayers[0];
  state.feedback.selectedPlayerId = selectedPlayer.id;

  const selectedFeedback = getPlayerQuarterFeedback(selectedPlayer.id, selectedQuarter);
  const playerOptions = availablePlayers
    .map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`)
    .join("");
  const quarterTabs = buildFeedbackQuarterTabs("data-feedback-quarter");

  const categoryButtons = FEEDBACK_CATEGORIES
    .map((category) => `
      <button class="feedback-category-btn" type="button" data-category-id="${category.id}">
        <span>${category.icon} ${escapeHtml(category.title)}</span>
        <strong>${selectedFeedback.counts[category.id] || 0}</strong>
      </button>
    `)
    .join("");

  const summaryText = buildFeedbackSummary(selectedPlayer, selectedFeedback, selectedQuarterLabel);

  elements.feedbackTracker.innerHTML = `
    <div class="feedback-quarter-row">
      <p class="quarter-label">${escapeHtml(selectedQuarterLabel)}</p>
      <div class="period-tabs feedback-quarter-tabs">${quarterTabs}</div>
    </div>

    <div class="feedback-player-switcher">
      <label class="player-select-wrap">
        Player
        <select id="feedback-player-select">${playerOptions}</select>
      </label>
      <div class="feedback-player-status">
        <span class="live-count-pill">${getTotalFeedbackMarks(selectedFeedback)} marks</span>
      </div>
    </div>

      <article class="feedback-panel">
        <div class="feedback-category-grid">${categoryButtons}</div>
      </article>

      <article class="feedback-panel game-notes-panel">
        <h3>Game Notes</h3>
        <label>
          Notes for ${escapeHtml(selectedQuarterLabel)}
          <textarea id="feedback-quarter-notes" rows="5" placeholder="What you notice this quarter...">${escapeHtml(quarterEntry.notes || "")}</textarea>
        </label>
      </article>

      <article class="feedback-panel">
        <h3>What To Say Now</h3>
        <p id="feedback-summary-text" class="feedback-summary-text">${escapeHtml(summaryText)}</p>
    </article>
  `;

  const playerSelect = elements.feedbackTracker.querySelector("#feedback-player-select");
  if (playerSelect) {
    playerSelect.value = selectedPlayer.id;
  }

  bindFeedbackTrackerEvents();
}

function getSelectedNotepadQuarter() {
  const maxQuarter = normalizePositiveNumber(state.settings.periodCount, 4);
  const quarter = normalizePositiveNumber(state.notepad.currentQuarter, 1);
  const clampedQuarter = Math.min(Math.max(quarter, 1), maxQuarter);
  state.notepad.currentQuarter = clampedQuarter;
  return clampedQuarter;
}

function getNotepadQuarterEntry(quarterNumber) {
  const quarterKey = String(quarterNumber);

  if (!state.notepad.byQuarter[quarterKey]) {
    state.notepad.byQuarter[quarterKey] = {
      notes: "",
      message: "",
    };
  }

  return state.notepad.byQuarter[quarterKey];
}

function renderNotepad() {
  const selectedQuarter = getSelectedNotepadQuarter();
  const quarterLabel = getFeedbackQuarterLabel(selectedQuarter);
  const quarterTabs = buildQuarterTabs(selectedQuarter, "data-notepad-quarter");
  const reflectionText = typeof state.notepad.reflection === "string" ? state.notepad.reflection : "";

  elements.notepadContent.innerHTML = `
    <div class="feedback-quarter-row">
      <p class="quarter-label">${escapeHtml(quarterLabel)}</p>
      <div class="period-tabs feedback-quarter-tabs">${quarterTabs}</div>
    </div>

    <article class="feedback-panel notepad-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(quarterLabel)} Message</h3>
        </div>
        <button id="copy-quarter-message-btn" type="button">Copy Message</button>
      </div>
      <label>
        Message
        <textarea id="notepad-quarter-message" rows="6" placeholder="Your quarter message...">${escapeHtml(getNotepadQuarterEntry(selectedQuarter).message || "")}</textarea>
      </label>
    </article>

    <article class="feedback-panel notepad-panel">
      <div class="section-heading report-card-header">
          <div>
            <h3>After Game Reflection</h3>
          </div>
        <button id="copy-reflection-btn" type="button">Copy Reflection</button>
      </div>
      <label>
        Reflection
        <textarea id="notepad-reflection" rows="8" placeholder="What worked, what needs work, and what to carry into next week...">${escapeHtml(reflectionText)}</textarea>
      </label>
    </article>
  `;

  bindNotepadEvents();
}

function bindNotepadEvents() {
  elements.notepadContent.querySelectorAll("[data-notepad-quarter]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveQuarter(Number.parseInt(button.dataset.notepadQuarter, 10));
      renderNotepad();
    });
  });

  const quarterMessageInput = elements.notepadContent.querySelector("#notepad-quarter-message");
  if (quarterMessageInput) {
    quarterMessageInput.addEventListener("input", () => {
      const entry = getNotepadQuarterEntry(getSelectedNotepadQuarter());
      entry.message = quarterMessageInput.value;
      saveState();
    });
  }

  const reflectionInput = elements.notepadContent.querySelector("#notepad-reflection");
  if (reflectionInput) {
    reflectionInput.addEventListener("input", () => {
      state.notepad.reflection = reflectionInput.value;
      saveState();
    });
  }

  const copyQuarterMessageBtn = elements.notepadContent.querySelector("#copy-quarter-message-btn");
  if (copyQuarterMessageBtn) {
    copyQuarterMessageBtn.addEventListener("click", copyQuarterMessage);
  }

  const copyReflectionBtn = elements.notepadContent.querySelector("#copy-reflection-btn");
  if (copyReflectionBtn) {
    copyReflectionBtn.addEventListener("click", copyReflectionNote);
  }
}

function copyQuarterMessage() {
  if (!navigator.clipboard) {
    return;
  }

  const entry = getNotepadQuarterEntry(getSelectedNotepadQuarter());
  const messageText = (entry.message || "").trim();
  if (!messageText) {
    return;
  }

  navigator.clipboard.writeText(messageText).catch((error) => {
    console.error("Could not copy quarter message.", error);
  });
}

function copyReflectionNote() {
  if (!navigator.clipboard) {
    return;
  }

  const reflectionText = `${state.notepad.reflection || ""}`.trim();
  if (!reflectionText) {
    return;
  }

  navigator.clipboard.writeText(reflectionText).catch((error) => {
    console.error("Could not copy reflection.", error);
  });
}

function renderGameReviews() {
  const content = elements.gameReviewsContent;
  if (!content) {
    return;
  }

  state.gameReviews.draft = normalizeGameReviewDraft(state.gameReviews.draft);
  const activeReview = getSelectedGameReview();
  const draft = activeReview
    ? cloneGameReviewDraft(state.gameReviews.draft)
    : state.gameReviews.draft;
  const reviewTitle = activeReview
    ? `Editing ${getGameReviewLabel(activeReview)}`
    : "New Game Review";
  const reviewHelper = activeReview
    ? `Last saved ${formatGameReviewDate(activeReview.updatedAt)}.`
    : "Capture the main themes from the game and save them here.";
  const saveDisabled = !activeReview && isGameReviewDraftEmpty(draft);
  const savedReviews = [...state.gameReviews.items].reverse();

  const reviewListMarkup = savedReviews.length
    ? savedReviews.map((review) => `
      <button class="review-list-item ${review.id === state.gameReviews.selectedReviewId ? "active" : ""}" type="button" data-game-review-id="${review.id}">
        <span class="review-list-title">${escapeHtml(getGameReviewLabel(review))}</span>
        <span class="review-list-meta">${escapeHtml(review.result || "No result recorded")} · ${escapeHtml(formatGameReviewDate(review.updatedAt))}</span>
      </button>
    `).join("")
    : '<p class="placeholder">No game reviews saved yet.</p>';

  content.innerHTML = `
    <article class="feedback-panel game-review-editor">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(reviewTitle)}</h3>
          <p class="helper">${escapeHtml(reviewHelper)}</p>
        </div>
        <div class="inline-actions compact-actions">
          <button id="new-game-review-btn" type="button">New Review</button>
          <button id="save-game-review-btn" class="primary" type="button" ${saveDisabled ? "disabled" : ""}>Save Review</button>
        </div>
      </div>

      <div class="review-form-grid">
        <label>
          Opponent
          <input id="game-review-opponent" type="text" value="${escapeHtml(draft.opponent)}" placeholder="Opponent">
        </label>
        <label>
          Result
          <input id="game-review-result" type="text" value="${escapeHtml(draft.result)}" placeholder="Win, loss, draw...">
        </label>
        <label class="review-full-width">
          What Worked
          <textarea id="game-review-what-worked" rows="3" placeholder="What went well?">${escapeHtml(draft.whatWorked)}</textarea>
        </label>
        <label class="review-full-width">
          What Broke Down
          <textarea id="game-review-what-broke-down" rows="3" placeholder="What needs work?">${escapeHtml(draft.whatBrokeDown)}</textarea>
        </label>
        <label class="review-full-width">
          Contest / Tackling / Ground Balls
          <textarea id="game-review-contest" rows="3" placeholder="Contest notes...">${escapeHtml(draft.contestTacklingGroundBalls)}</textarea>
        </label>
        <label class="review-full-width">
          Leading / Forward Spacing
          <textarea id="game-review-leading" rows="3" placeholder="Leading and spacing notes...">${escapeHtml(draft.leadingForwardSpacing)}</textarea>
        </label>
        <label class="review-full-width">
          Ball Movement
          <textarea id="game-review-ball-movement" rows="3" placeholder="Ball movement notes...">${escapeHtml(draft.ballMovement)}</textarea>
        </label>
        <label class="review-full-width">
          Effort / Intent
          <textarea id="game-review-effort" rows="3" placeholder="Effort and intent notes...">${escapeHtml(draft.effortIntent)}</textarea>
        </label>
        <label class="review-full-width">
          Next Training Priorities
          <textarea id="game-review-priorities" rows="4" placeholder="Training priorities to carry forward...">${escapeHtml(draft.nextTrainingPriorities)}</textarea>
        </label>
      </div>
    </article>

    <article class="feedback-panel game-review-list-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>Saved Reviews</h3>
        </div>
      </div>
      <div class="review-list">
        ${reviewListMarkup}
      </div>
    </article>
  `;

  bindGameReviewsEvents();
}

function bindGameReviewsEvents() {
  const content = elements.gameReviewsContent;
  if (!content) {
    return;
  }

  const newReviewBtn = content.querySelector("#new-game-review-btn");
  if (newReviewBtn) {
    newReviewBtn.addEventListener("click", startNewGameReview);
  }

  const saveReviewBtn = content.querySelector("#save-game-review-btn");
  if (saveReviewBtn) {
    saveReviewBtn.addEventListener("click", saveGameReviewDraft);
  }

  const fieldMap = [
    ["#game-review-opponent", "opponent"],
    ["#game-review-result", "result"],
    ["#game-review-what-worked", "whatWorked"],
    ["#game-review-what-broke-down", "whatBrokeDown"],
    ["#game-review-contest", "contestTacklingGroundBalls"],
    ["#game-review-leading", "leadingForwardSpacing"],
    ["#game-review-ball-movement", "ballMovement"],
    ["#game-review-effort", "effortIntent"],
    ["#game-review-priorities", "nextTrainingPriorities"],
  ];

  fieldMap.forEach(([selector, field]) => {
    const input = content.querySelector(selector);
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      state.gameReviews.draft[field] = input.value;
      saveState();
      syncGameReviewActionState();
    });
  });

  content.querySelectorAll("[data-game-review-id]").forEach((button) => {
    button.addEventListener("click", () => {
      loadGameReviewIntoDraft(button.dataset.gameReviewId);
    });
  });

  syncGameReviewActionState();
}

function syncGameReviewActionState() {
  const saveReviewBtn = elements.gameReviewsContent?.querySelector("#save-game-review-btn");
  if (!saveReviewBtn) {
    return;
  }

  saveReviewBtn.disabled = !state.gameReviews.selectedReviewId && isGameReviewDraftEmpty(state.gameReviews.draft);
}

function startNewGameReview() {
  if (isGameReviewDraftDirty()) {
    const confirmed = window.confirm("Discard the current review draft and start a new one?");
    if (!confirmed) {
      return;
    }
  }

  state.gameReviews.selectedReviewId = null;
  state.gameReviews.draft = createEmptyGameReviewDraft();
  saveState();
  renderGameReviews();
}

function saveGameReviewDraft() {
  const draft = normalizeGameReviewDraft(state.gameReviews.draft);
  const hasDraftContent = !isGameReviewDraftEmpty(draft);
  const selectedReview = getSelectedGameReview();

  if (!hasDraftContent && !selectedReview) {
    return;
  }

  const now = new Date().toISOString();

  if (selectedReview) {
    Object.assign(selectedReview, draft, {
      updatedAt: now,
      createdAt: selectedReview.createdAt || now,
    });
  } else {
    const review = {
      id: createId(),
      ...draft,
      createdAt: now,
      updatedAt: now,
    };
    state.gameReviews.items.push(review);
    state.gameReviews.selectedReviewId = review.id;
  }

  const savedReview = getSelectedGameReview();
  if (savedReview) {
    state.gameReviews.draft = cloneGameReviewDraft(savedReview);
  }

  saveState();
  renderGameReviews();
}

function loadGameReviewIntoDraft(reviewId) {
  const review = state.gameReviews.items.find((entry) => entry.id === reviewId);
  if (!review) {
    return;
  }

  if (isGameReviewDraftDirty() && state.gameReviews.selectedReviewId !== reviewId) {
    const confirmed = window.confirm("Discard the current review draft and open another review?");
    if (!confirmed) {
      return;
    }
  }

  state.gameReviews.selectedReviewId = review.id;
  state.gameReviews.draft = cloneGameReviewDraft(review);
  saveState();
  renderGameReviews();
}

function getSelectedGameReview() {
  if (!state.gameReviews.selectedReviewId) {
    return null;
  }

  return state.gameReviews.items.find((review) => review.id === state.gameReviews.selectedReviewId) || null;
}

function cloneGameReviewDraft(review) {
  const normalized = normalizeGameReviewDraft(review);
  return { ...normalized };
}

function createEmptyGameReviewDraft() {
  return {
    opponent: "",
    result: "",
    whatWorked: "",
    whatBrokeDown: "",
    contestTacklingGroundBalls: "",
    leadingForwardSpacing: "",
    ballMovement: "",
    effortIntent: "",
    nextTrainingPriorities: "",
  };
}

function normalizeGameReviewDraft(review) {
  const source = review && typeof review === "object" ? review : {};
  const blank = createEmptyGameReviewDraft();

  return {
    opponent: `${source.opponent ?? blank.opponent}`,
    result: `${source.result ?? blank.result}`,
    whatWorked: `${source.whatWorked ?? blank.whatWorked}`,
    whatBrokeDown: `${source.whatBrokeDown ?? blank.whatBrokeDown}`,
    contestTacklingGroundBalls: `${source.contestTacklingGroundBalls ?? blank.contestTacklingGroundBalls}`,
    leadingForwardSpacing: `${source.leadingForwardSpacing ?? blank.leadingForwardSpacing}`,
    ballMovement: `${source.ballMovement ?? blank.ballMovement}`,
    effortIntent: `${source.effortIntent ?? blank.effortIntent}`,
    nextTrainingPriorities: `${source.nextTrainingPriorities ?? blank.nextTrainingPriorities}`,
  };
}

function normalizeGameReviewItem(review) {
  const source = review && typeof review === "object" ? review : {};
  const draft = normalizeGameReviewDraft(source);

  return {
    id: `${source.id || createId()}`,
    ...draft,
    createdAt: source.createdAt || source.updatedAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

function isGameReviewDraftEmpty(draft) {
  const normalized = normalizeGameReviewDraft(draft);
  return Object.values(normalized).every((value) => `${value}`.trim() === "");
}

function isGameReviewDraftDirty() {
  const selectedReview = getSelectedGameReview();
  if (!selectedReview) {
    return !isGameReviewDraftEmpty(state.gameReviews.draft);
  }

  return !areGameReviewEntriesEqual(selectedReview, state.gameReviews.draft);
}

function areGameReviewEntriesEqual(left, right) {
  const leftDraft = normalizeGameReviewDraft(left);
  const rightDraft = normalizeGameReviewDraft(right);

  return Object.keys(leftDraft).every((key) => `${leftDraft[key]}` === `${rightDraft[key]}`);
}

function getGameReviewLabel(review) {
  const opponent = `${review?.opponent || ""}`.trim();
  return opponent || "Untitled Review";
}

function formatGameReviewDate(value) {
  if (!value) {
    return "Just saved";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just saved";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderTrainingPlans() {
  const content = elements.trainingPlansContent;
  if (!content) {
    return;
  }

  state.trainingPlans.draft = normalizeTrainingPlanDraft(state.trainingPlans.draft);
  const activePlan = getSelectedTrainingPlan();
  const draft = activePlan
    ? cloneTrainingPlanDraft(state.trainingPlans.draft)
    : state.trainingPlans.draft;
  const planTitle = activePlan
    ? `Editing ${getTrainingPlanLabel(activePlan)}`
    : "New Training Plan";
  const planHelper = activePlan
    ? `Last saved ${formatTrainingPlanDate(activePlan.updatedAt)}.`
    : "Capture the main training session details and save them here.";
  const saveDisabled = !activePlan && isTrainingPlanDraftEmpty(draft);
  const savedPlans = [...state.trainingPlans.items].reverse();

  const planListMarkup = savedPlans.length
    ? savedPlans.map((plan) => `
      <button class="review-list-item ${plan.id === state.trainingPlans.selectedPlanId ? "active" : ""}" type="button" data-training-plan-id="${plan.id}">
        <span class="review-list-title">${escapeHtml(getTrainingPlanLabel(plan))}</span>
        <span class="review-list-meta">${escapeHtml(plan.date || "No date recorded")} · ${escapeHtml(formatTrainingPlanDate(plan.updatedAt))}</span>
      </button>
    `).join("")
    : '<p class="placeholder">No training plans saved yet.</p>';

  content.innerHTML = `
    <article class="feedback-panel training-plan-editor">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(planTitle)}</h3>
          <p class="helper">${escapeHtml(planHelper)}</p>
        </div>
        <div class="inline-actions compact-actions">
          <button id="new-training-plan-btn" type="button">New Plan</button>
          <button id="save-training-plan-btn" class="primary" type="button" ${saveDisabled ? "disabled" : ""}>Save Plan</button>
        </div>
      </div>

      <div class="review-form-grid">
        <label>
          Title
          <input id="training-plan-title" type="text" value="${escapeHtml(draft.title)}" placeholder="Session title">
        </label>
        <label>
          Date
          <input id="training-plan-date" type="date" value="${escapeHtml(draft.date)}">
        </label>
        <label class="review-full-width">
          Session Purpose
          <textarea id="training-plan-purpose" rows="3" placeholder="What is the purpose of the session?">${escapeHtml(draft.sessionPurpose)}</textarea>
        </label>
        <label>
          Expected Numbers
          <input id="training-plan-numbers" type="text" value="${escapeHtml(draft.expectedNumbers)}" placeholder="e.g. 14-18">
        </label>
        <label>
          Duration
          <input id="training-plan-duration" type="text" value="${escapeHtml(draft.duration)}" placeholder="e.g. 60 minutes">
        </label>
        <label class="review-full-width">
          Warm-up
          <textarea id="training-plan-warm-up" rows="3" placeholder="Warm-up plan...">${escapeHtml(draft.warmUp)}</textarea>
        </label>
        <label class="review-full-width">
          Fundamentals
          <textarea id="training-plan-fundamentals" rows="3" placeholder="Fundamentals focus...">${escapeHtml(draft.fundamentals)}</textarea>
        </label>
        <label class="review-full-width">
          Main Drills
          <textarea id="training-plan-main-drills" rows="4" placeholder="Main drills for the night...">${escapeHtml(draft.mainDrills)}</textarea>
        </label>
        <label class="review-full-width">
          Game Play / Conditioned Game
          <textarea id="training-plan-game-play" rows="4" placeholder="Conditioned game or match play...">${escapeHtml(draft.gamePlayConditionedGame)}</textarea>
        </label>
        <label class="review-full-width">
          Coaching Cues
          <textarea id="training-plan-cues" rows="3" placeholder="Key coaching cues...">${escapeHtml(draft.coachingCues)}</textarea>
        </label>
        <label class="review-full-width">
          Notes / Review for Next Time
          <textarea id="training-plan-notes" rows="4" placeholder="What to remember next time...">${escapeHtml(draft.notesReviewNextTime)}</textarea>
        </label>
      </div>
    </article>

    <article class="feedback-panel training-plan-list-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>Saved Plans</h3>
        </div>
      </div>
      <div class="review-list">
        ${planListMarkup}
      </div>
    </article>
  `;

  bindTrainingPlansEvents();
}

function bindTrainingPlansEvents() {
  const content = elements.trainingPlansContent;
  if (!content) {
    return;
  }

  const newPlanBtn = content.querySelector("#new-training-plan-btn");
  if (newPlanBtn) {
    newPlanBtn.addEventListener("click", startNewTrainingPlan);
  }

  const savePlanBtn = content.querySelector("#save-training-plan-btn");
  if (savePlanBtn) {
    savePlanBtn.addEventListener("click", saveTrainingPlanDraft);
  }

  const fieldMap = [
    ["#training-plan-title", "title"],
    ["#training-plan-date", "date"],
    ["#training-plan-purpose", "sessionPurpose"],
    ["#training-plan-numbers", "expectedNumbers"],
    ["#training-plan-duration", "duration"],
    ["#training-plan-warm-up", "warmUp"],
    ["#training-plan-fundamentals", "fundamentals"],
    ["#training-plan-main-drills", "mainDrills"],
    ["#training-plan-game-play", "gamePlayConditionedGame"],
    ["#training-plan-cues", "coachingCues"],
    ["#training-plan-notes", "notesReviewNextTime"],
  ];

  fieldMap.forEach(([selector, field]) => {
    const input = content.querySelector(selector);
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      state.trainingPlans.draft[field] = input.value;
      saveState();
      syncTrainingPlanActionState();
    });
  });

  content.querySelectorAll("[data-training-plan-id]").forEach((button) => {
    button.addEventListener("click", () => {
      loadTrainingPlanIntoDraft(button.dataset.trainingPlanId);
    });
  });

  syncTrainingPlanActionState();
}

function syncTrainingPlanActionState() {
  const savePlanBtn = elements.trainingPlansContent?.querySelector("#save-training-plan-btn");
  if (!savePlanBtn) {
    return;
  }

  savePlanBtn.disabled = !state.trainingPlans.selectedPlanId && isTrainingPlanDraftEmpty(state.trainingPlans.draft);
}

function startNewTrainingPlan() {
  if (isTrainingPlanDraftDirty()) {
    const confirmed = window.confirm("Discard the current training plan draft and start a new one?");
    if (!confirmed) {
      return;
    }
  }

  state.trainingPlans.selectedPlanId = null;
  state.trainingPlans.draft = createEmptyTrainingPlanDraft();
  saveState();
  renderTrainingPlans();
}

function saveTrainingPlanDraft() {
  const draft = normalizeTrainingPlanDraft(state.trainingPlans.draft);
  const hasDraftContent = !isTrainingPlanDraftEmpty(draft);
  const selectedPlan = getSelectedTrainingPlan();

  if (!hasDraftContent && !selectedPlan) {
    return;
  }

  const now = new Date().toISOString();

  if (selectedPlan) {
    Object.assign(selectedPlan, draft, {
      updatedAt: now,
      createdAt: selectedPlan.createdAt || now,
    });
  } else {
    const plan = {
      id: createId(),
      ...draft,
      createdAt: now,
      updatedAt: now,
    };
    state.trainingPlans.items.push(plan);
    state.trainingPlans.selectedPlanId = plan.id;
  }

  const savedPlan = getSelectedTrainingPlan();
  if (savedPlan) {
    state.trainingPlans.draft = cloneTrainingPlanDraft(savedPlan);
  }

  saveState();
  renderTrainingPlans();
}

function loadTrainingPlanIntoDraft(planId) {
  const plan = state.trainingPlans.items.find((entry) => entry.id === planId);
  if (!plan) {
    return;
  }

  if (isTrainingPlanDraftDirty() && state.trainingPlans.selectedPlanId !== planId) {
    const confirmed = window.confirm("Discard the current training plan draft and open another plan?");
    if (!confirmed) {
      return;
    }
  }

  state.trainingPlans.selectedPlanId = plan.id;
  state.trainingPlans.draft = cloneTrainingPlanDraft(plan);
  saveState();
  renderTrainingPlans();
}

function getSelectedTrainingPlan() {
  if (!state.trainingPlans.selectedPlanId) {
    return null;
  }

  return state.trainingPlans.items.find((plan) => plan.id === state.trainingPlans.selectedPlanId) || null;
}

function cloneTrainingPlanDraft(plan) {
  const normalized = normalizeTrainingPlanDraft(plan);
  return { ...normalized };
}

function createEmptyTrainingPlanDraft() {
  return {
    title: "",
    date: "",
    sessionPurpose: "",
    expectedNumbers: "",
    duration: "",
    warmUp: "",
    fundamentals: "",
    mainDrills: "",
    gamePlayConditionedGame: "",
    coachingCues: "",
    notesReviewNextTime: "",
  };
}

function normalizeTrainingPlanDraft(plan) {
  const source = plan && typeof plan === "object" ? plan : {};
  const blank = createEmptyTrainingPlanDraft();

  return {
    title: `${source.title ?? blank.title}`,
    date: `${source.date ?? blank.date}`,
    sessionPurpose: `${source.sessionPurpose ?? blank.sessionPurpose}`,
    expectedNumbers: `${source.expectedNumbers ?? blank.expectedNumbers}`,
    duration: `${source.duration ?? blank.duration}`,
    warmUp: `${source.warmUp ?? blank.warmUp}`,
    fundamentals: `${source.fundamentals ?? blank.fundamentals}`,
    mainDrills: `${source.mainDrills ?? blank.mainDrills}`,
    gamePlayConditionedGame: `${source.gamePlayConditionedGame ?? blank.gamePlayConditionedGame}`,
    coachingCues: `${source.coachingCues ?? blank.coachingCues}`,
    notesReviewNextTime: `${source.notesReviewNextTime ?? blank.notesReviewNextTime}`,
  };
}

function normalizeTrainingPlanItem(plan) {
  const source = plan && typeof plan === "object" ? plan : {};
  const draft = normalizeTrainingPlanDraft(source);

  return {
    id: `${source.id || createId()}`,
    ...draft,
    createdAt: source.createdAt || source.updatedAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

function createSeedTrainingPlanItem() {
  return normalizeTrainingPlanItem({
    title: "Contest First, Then Structure",
    date: "Planned",
    sessionPurpose: "Contest first, then structure",
    expectedNumbers: "U14 Nairne",
    duration: "60 minutes",
    warmUp: [
      "5:00-5:08 Competitive warm-up",
      "Ground balls, body pressure, run to receive",
    ].join("\n"),
    fundamentals: [
      "5:08-5:20 Contest block 1",
      "Outnumber at contest, pair off, relevant/irrelevant",
      "5:20-5:32 Contest block 2",
      "Tackling, lock ball in, forward-half pressure",
    ].join("\n"),
    mainDrills: [
      "5:32-5:42 Structure block 1",
      "Forward leading patterns, spacing, paired leads",
      "5:42-5:50 Structure block 2",
      "Kick-ins, face forward immediately, exit shape",
    ].join("\n"),
    gamePlayConditionedGame: [
      "5:50-5:58 Conditioned game",
      "Contest to structure transfer",
    ].join("\n"),
    coachingCues: [
      "One to win it, one to protect, one to receive",
      "Pair off",
      "Tackle and lock it in",
      "One hard lead, one holds or delays",
      "Face forward immediately",
    ].join("\n"),
    notesReviewNextTime: [
      "Notebook: Training Planning",
      "Team: U14 Nairne",
      "Status: planned",
      "Focus areas: tackling, ground balls, leading patterns, kick-ins",
      "Linked review issues: damaging opposition mids, loose defence, outnumbered at contests, lack of forward structure, players getting lost/confused",
    ].join("\n"),
  });
}

function seedTrainingPlanIfMissing() {
  const seedTitle = "Contest First, Then Structure";
  if (state.trainingPlans.items.some((plan) => `${plan.title || ""}`.trim() === seedTitle)) {
    return false;
  }

  const seedPlan = createSeedTrainingPlanItem();
  state.trainingPlans.items.push(seedPlan);
  state.trainingPlans.selectedPlanId = seedPlan.id;
  state.trainingPlans.draft = cloneTrainingPlanDraft(seedPlan);
  return true;
}

function isTrainingPlanDraftEmpty(draft) {
  const normalized = normalizeTrainingPlanDraft(draft);
  return Object.values(normalized).every((value) => `${value}`.trim() === "");
}

function isTrainingPlanDraftDirty() {
  const selectedPlan = getSelectedTrainingPlan();
  if (!selectedPlan) {
    return !isTrainingPlanDraftEmpty(state.trainingPlans.draft);
  }

  return !areTrainingPlanEntriesEqual(selectedPlan, state.trainingPlans.draft);
}

function areTrainingPlanEntriesEqual(left, right) {
  const leftDraft = normalizeTrainingPlanDraft(left);
  const rightDraft = normalizeTrainingPlanDraft(right);

  return Object.keys(leftDraft).every((key) => `${leftDraft[key]}` === `${rightDraft[key]}`);
}

function getTrainingPlanLabel(plan) {
  const title = `${plan?.title || ""}`.trim();
  if (title) {
    return title;
  }

  const date = `${plan?.date || ""}`.trim();
  return date || "Untitled Plan";
}

function formatTrainingPlanDate(value) {
  if (!value) {
    return "Just saved";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just saved";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderWeeklyFocus() {
  const content = elements.weeklyFocusContent;
  if (!content) {
    return;
  }

  state.weeklyFocus.draft = normalizeWeeklyFocusDraft(state.weeklyFocus.draft);
  const activeFocus = getSelectedWeeklyFocus();
  const draft = activeFocus
    ? cloneWeeklyFocusDraft(state.weeklyFocus.draft)
    : state.weeklyFocus.draft;
  const focusTitle = activeFocus
    ? `Editing ${getWeeklyFocusLabel(activeFocus)}`
    : "New Weekly Focus";
  const focusHelper = activeFocus
    ? `Last saved ${formatWeeklyFocusDate(activeFocus.updatedAt)}.`
    : "Capture the main weekly theme and save it here.";
  const saveDisabled = !activeFocus && isWeeklyFocusDraftEmpty(draft);
  const savedFocusEntries = [...state.weeklyFocus.items].reverse();

  const focusListMarkup = savedFocusEntries.length
    ? savedFocusEntries.map((entry) => `
      <button class="review-list-item ${entry.id === state.weeklyFocus.selectedFocusId ? "active" : ""}" type="button" data-weekly-focus-id="${entry.id}">
        <span class="review-list-title">${escapeHtml(getWeeklyFocusLabel(entry))}</span>
        <span class="review-list-meta">${escapeHtml(entry.context || "No context recorded")} · ${escapeHtml(formatWeeklyFocusDate(entry.updatedAt))}</span>
      </button>
    `).join("")
    : '<p class="placeholder">No weekly focus entries saved yet.</p>';

  content.innerHTML = `
    <article class="feedback-panel weekly-focus-editor">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(focusTitle)}</h3>
          <p class="helper">${escapeHtml(focusHelper)}</p>
        </div>
        <div class="inline-actions compact-actions">
          <button id="new-weekly-focus-btn" type="button">New Focus</button>
          <button id="save-weekly-focus-btn" class="primary" type="button" ${saveDisabled ? "disabled" : ""}>Save Focus</button>
        </div>
      </div>

      <div class="review-form-grid">
        <label>
          Title / Round / Week Label
          <input id="weekly-focus-title" type="text" value="${escapeHtml(draft.title)}" placeholder="Round 5, Week of 3 May...">
        </label>
        <label>
          Opponent or Context
          <input id="weekly-focus-context" type="text" value="${escapeHtml(draft.context)}" placeholder="Opponent, bye week, training block...">
        </label>
        <label class="review-full-width">
          Main Theme
          <textarea id="weekly-focus-theme" rows="3" placeholder="The main theme for the week...">${escapeHtml(draft.mainTheme)}</textarea>
        </label>
        <label class="review-full-width">
          Key Priorities
          <textarea id="weekly-focus-priorities" rows="3" placeholder="Top priorities for the week...">${escapeHtml(draft.keyPriorities)}</textarea>
        </label>
        <label class="review-full-width">
          Carry-Forward Issue From Last Game
          <textarea id="weekly-focus-carry-forward" rows="3" placeholder="What needs to carry forward from the last game?">${escapeHtml(draft.carryForwardIssue)}</textarea>
        </label>
        <label class="review-full-width">
          Game Day Message Theme
          <textarea id="weekly-focus-message-theme" rows="3" placeholder="Tone or message for game day...">${escapeHtml(draft.gameDayMessageTheme)}</textarea>
        </label>
        <label class="review-full-width">
          Notes
          <textarea id="weekly-focus-notes" rows="4" placeholder="Anything else to remember...">${escapeHtml(draft.notes)}</textarea>
        </label>
      </div>
    </article>

    <article class="feedback-panel weekly-focus-list-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>Saved Weekly Focus</h3>
        </div>
      </div>
      <div class="review-list">
        ${focusListMarkup}
      </div>
    </article>
  `;

  bindWeeklyFocusEvents();
}

function bindWeeklyFocusEvents() {
  const content = elements.weeklyFocusContent;
  if (!content) {
    return;
  }

  const newFocusBtn = content.querySelector("#new-weekly-focus-btn");
  if (newFocusBtn) {
    newFocusBtn.addEventListener("click", startNewWeeklyFocus);
  }

  const saveFocusBtn = content.querySelector("#save-weekly-focus-btn");
  if (saveFocusBtn) {
    saveFocusBtn.addEventListener("click", saveWeeklyFocusDraft);
  }

  const fieldMap = [
    ["#weekly-focus-title", "title"],
    ["#weekly-focus-context", "context"],
    ["#weekly-focus-theme", "mainTheme"],
    ["#weekly-focus-priorities", "keyPriorities"],
    ["#weekly-focus-carry-forward", "carryForwardIssue"],
    ["#weekly-focus-message-theme", "gameDayMessageTheme"],
    ["#weekly-focus-notes", "notes"],
  ];

  fieldMap.forEach(([selector, field]) => {
    const input = content.querySelector(selector);
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      state.weeklyFocus.draft[field] = input.value;
      saveState();
      syncWeeklyFocusActionState();
    });
  });

  content.querySelectorAll("[data-weekly-focus-id]").forEach((button) => {
    button.addEventListener("click", () => {
      loadWeeklyFocusIntoDraft(button.dataset.weeklyFocusId);
    });
  });

  syncWeeklyFocusActionState();
}

function syncWeeklyFocusActionState() {
  const saveFocusBtn = elements.weeklyFocusContent?.querySelector("#save-weekly-focus-btn");
  if (!saveFocusBtn) {
    return;
  }

  saveFocusBtn.disabled = !state.weeklyFocus.selectedFocusId && isWeeklyFocusDraftEmpty(state.weeklyFocus.draft);
}

function startNewWeeklyFocus() {
  if (isWeeklyFocusDraftDirty()) {
    const confirmed = window.confirm("Discard the current weekly focus draft and start a new one?");
    if (!confirmed) {
      return;
    }
  }

  state.weeklyFocus.selectedFocusId = null;
  state.weeklyFocus.draft = createEmptyWeeklyFocusDraft();
  saveState();
  renderWeeklyFocus();
}

function saveWeeklyFocusDraft() {
  const draft = normalizeWeeklyFocusDraft(state.weeklyFocus.draft);
  const hasDraftContent = !isWeeklyFocusDraftEmpty(draft);
  const selectedFocus = getSelectedWeeklyFocus();

  if (!hasDraftContent && !selectedFocus) {
    return;
  }

  const now = new Date().toISOString();

  if (selectedFocus) {
    Object.assign(selectedFocus, draft, {
      updatedAt: now,
      createdAt: selectedFocus.createdAt || now,
    });
  } else {
    const focus = {
      id: createId(),
      ...draft,
      createdAt: now,
      updatedAt: now,
    };
    state.weeklyFocus.items.push(focus);
    state.weeklyFocus.selectedFocusId = focus.id;
  }

  const savedFocus = getSelectedWeeklyFocus();
  if (savedFocus) {
    state.weeklyFocus.draft = cloneWeeklyFocusDraft(savedFocus);
  }

  saveState();
  renderWeeklyFocus();
}

function loadWeeklyFocusIntoDraft(focusId) {
  const focus = state.weeklyFocus.items.find((entry) => entry.id === focusId);
  if (!focus) {
    return;
  }

  if (isWeeklyFocusDraftDirty() && state.weeklyFocus.selectedFocusId !== focusId) {
    const confirmed = window.confirm("Discard the current weekly focus draft and open another entry?");
    if (!confirmed) {
      return;
    }
  }

  state.weeklyFocus.selectedFocusId = focus.id;
  state.weeklyFocus.draft = cloneWeeklyFocusDraft(focus);
  saveState();
  renderWeeklyFocus();
}

function getSelectedWeeklyFocus() {
  if (!state.weeklyFocus.selectedFocusId) {
    return null;
  }

  return state.weeklyFocus.items.find((entry) => entry.id === state.weeklyFocus.selectedFocusId) || null;
}

function cloneWeeklyFocusDraft(focus) {
  const normalized = normalizeWeeklyFocusDraft(focus);
  return { ...normalized };
}

function createEmptyWeeklyFocusDraft() {
  return {
    title: "",
    context: "",
    mainTheme: "",
    keyPriorities: "",
    carryForwardIssue: "",
    gameDayMessageTheme: "",
    notes: "",
  };
}

function normalizeWeeklyFocusDraft(focus) {
  const source = focus && typeof focus === "object" ? focus : {};
  const blank = createEmptyWeeklyFocusDraft();

  return {
    title: `${source.title ?? blank.title}`,
    context: `${source.context ?? blank.context}`,
    mainTheme: `${source.mainTheme ?? blank.mainTheme}`,
    keyPriorities: `${source.keyPriorities ?? blank.keyPriorities}`,
    carryForwardIssue: `${source.carryForwardIssue ?? blank.carryForwardIssue}`,
    gameDayMessageTheme: `${source.gameDayMessageTheme ?? blank.gameDayMessageTheme}`,
    notes: `${source.notes ?? blank.notes}`,
  };
}

function normalizeWeeklyFocusItem(focus) {
  const source = focus && typeof focus === "object" ? focus : {};
  const draft = normalizeWeeklyFocusDraft(source);

  return {
    id: `${source.id || createId()}`,
    ...draft,
    createdAt: source.createdAt || source.updatedAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

function isWeeklyFocusDraftEmpty(draft) {
  const normalized = normalizeWeeklyFocusDraft(draft);
  return Object.values(normalized).every((value) => `${value}`.trim() === "");
}

function isWeeklyFocusDraftDirty() {
  const selectedFocus = getSelectedWeeklyFocus();
  if (!selectedFocus) {
    return !isWeeklyFocusDraftEmpty(state.weeklyFocus.draft);
  }

  return !areWeeklyFocusEntriesEqual(selectedFocus, state.weeklyFocus.draft);
}

function areWeeklyFocusEntriesEqual(left, right) {
  const leftDraft = normalizeWeeklyFocusDraft(left);
  const rightDraft = normalizeWeeklyFocusDraft(right);

  return Object.keys(leftDraft).every((key) => `${leftDraft[key]}` === `${rightDraft[key]}`);
}

function getWeeklyFocusLabel(focus) {
  const title = `${focus?.title || ""}`.trim();
  if (title) {
    return title;
  }

  const context = `${focus?.context || ""}`.trim();
  return context || "Untitled Focus";
}

function formatWeeklyFocusDate(value) {
  if (!value) {
    return "Just saved";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just saved";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderSeasonHub() {
  const content = elements.seasonHubContent;
  if (!content) {
    return;
  }

  state.seasonHub.draft = normalizeSeasonHubDraft(state.seasonHub.draft);
  const activeHub = getSelectedSeasonHub();
  const draft = activeHub
    ? cloneSeasonHubDraft(state.seasonHub.draft)
    : state.seasonHub.draft;
  const hubTitle = activeHub
    ? `Editing ${getSeasonHubLabel(activeHub)}`
    : "New Season Hub";
  const hubHelper = activeHub
    ? `Last saved ${formatSeasonHubDate(activeHub.updatedAt)}.`
    : "Capture the current season snapshot here.";
  const saveDisabled = !activeHub && isSeasonHubDraftEmpty(draft);
  const savedHubs = [...state.seasonHub.items].reverse();

  const hubListMarkup = savedHubs.length
    ? savedHubs.map((hub) => `
      <button class="review-list-item ${hub.id === state.seasonHub.selectedHubId ? "active" : ""}" type="button" data-season-hub-id="${hub.id}">
        <span class="review-list-title">${escapeHtml(getSeasonHubLabel(hub))}</span>
        <span class="review-list-meta">${escapeHtml(hub.team || "No team recorded")} · ${escapeHtml(formatSeasonHubDate(hub.updatedAt))}</span>
      </button>
    `).join("")
    : '<p class="placeholder">No season hub entries saved yet.</p>';

  content.innerHTML = `
    <article class="feedback-panel season-hub-editor">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(hubTitle)}</h3>
          <p class="helper">${escapeHtml(hubHelper)}</p>
        </div>
        <div class="inline-actions compact-actions">
          <button id="new-season-hub-btn" type="button">New Snapshot</button>
          <button id="copy-season-snapshot-btn" class="utility-btn" type="button">Copy Current Season Snapshot</button>
          <button id="export-season-snapshot-btn" class="utility-btn" type="button">Export Current Season Snapshot</button>
          <button id="save-season-hub-btn" class="primary" type="button" ${saveDisabled ? "disabled" : ""}>Save Snapshot</button>
        </div>
      </div>

      <div class="review-form-grid">
        <label>
          Team
          <input id="season-hub-team" type="text" value="${escapeHtml(draft.team)}" placeholder="Team name">
        </label>
        <label>
          Season Year
          <input id="season-hub-year" type="text" value="${escapeHtml(draft.seasonYear)}" placeholder="2026">
        </label>
        <label>
          Competition
          <input id="season-hub-competition" type="text" value="${escapeHtml(draft.competition)}" placeholder="League or competition">
        </label>
        <label>
          Coaching Role
          <input id="season-hub-role" type="text" value="${escapeHtml(draft.coachingRole)}" placeholder="Head coach, assistant, etc.">
        </label>
        <label class="review-full-width">
          Team Values
          <textarea id="season-hub-values" rows="3" placeholder="Core team values...">${escapeHtml(draft.teamValues)}</textarea>
        </label>
        <label class="review-full-width">
          Non-Negotiables
          <textarea id="season-hub-non-negotiables" rows="3" placeholder="Standards we must keep...">${escapeHtml(draft.nonNegotiables)}</textarea>
        </label>
        <label class="review-full-width">
          Current Game Plan Language
          <textarea id="season-hub-game-plan-language" rows="3" placeholder="How we currently talk about our game plan...">${escapeHtml(draft.currentGamePlanLanguage)}</textarea>
        </label>
        <label class="review-full-width">
          Current Weekly Focus
          <textarea id="season-hub-weekly-focus" rows="3" placeholder="Current weekly focus...">${escapeHtml(draft.currentWeeklyFocus)}</textarea>
        </label>
        <label class="review-full-width">
          Latest Training Priorities
          <textarea id="season-hub-training-priorities" rows="3" placeholder="Latest training priorities...">${escapeHtml(draft.latestTrainingPriorities)}</textarea>
        </label>
        <label class="review-full-width">
          Latest Game Review Summary
          <textarea id="season-hub-game-review-summary" rows="3" placeholder="Short summary of the latest review...">${escapeHtml(draft.latestGameReviewSummary)}</textarea>
        </label>
        <label class="review-full-width">
          Important Decisions
          <textarea id="season-hub-decisions" rows="3" placeholder="Key season decisions...">${escapeHtml(draft.importantDecisions)}</textarea>
        </label>
        <label class="review-full-width">
          General Season Notes
          <textarea id="season-hub-notes" rows="4" placeholder="Anything else to remember across the season...">${escapeHtml(draft.generalSeasonNotes)}</textarea>
        </label>
      </div>
    </article>

    <article class="feedback-panel season-hub-list-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>Saved Season Snapshot</h3>
        </div>
      </div>
      <div class="review-list">
        ${hubListMarkup}
      </div>
    </article>
  `;

  bindSeasonHubEvents();
}

function bindSeasonHubEvents() {
  const content = elements.seasonHubContent;
  if (!content) {
    return;
  }

  const newHubBtn = content.querySelector("#new-season-hub-btn");
  if (newHubBtn) {
    newHubBtn.addEventListener("click", startNewSeasonHub);
  }

  const saveHubBtn = content.querySelector("#save-season-hub-btn");
  if (saveHubBtn) {
    saveHubBtn.addEventListener("click", saveSeasonHubDraft);
  }

  const copySnapshotBtn = content.querySelector("#copy-season-snapshot-btn");
  if (copySnapshotBtn) {
    copySnapshotBtn.addEventListener("click", copyCurrentSeasonSnapshot);
  }

  const exportSnapshotBtn = content.querySelector("#export-season-snapshot-btn");
  if (exportSnapshotBtn) {
    exportSnapshotBtn.addEventListener("click", exportCurrentSeasonSnapshot);
  }

  const fieldMap = [
    ["#season-hub-team", "team"],
    ["#season-hub-year", "seasonYear"],
    ["#season-hub-competition", "competition"],
    ["#season-hub-role", "coachingRole"],
    ["#season-hub-values", "teamValues"],
    ["#season-hub-non-negotiables", "nonNegotiables"],
    ["#season-hub-game-plan-language", "currentGamePlanLanguage"],
    ["#season-hub-weekly-focus", "currentWeeklyFocus"],
    ["#season-hub-training-priorities", "latestTrainingPriorities"],
    ["#season-hub-game-review-summary", "latestGameReviewSummary"],
    ["#season-hub-decisions", "importantDecisions"],
    ["#season-hub-notes", "generalSeasonNotes"],
  ];

  fieldMap.forEach(([selector, field]) => {
    const input = content.querySelector(selector);
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      state.seasonHub.draft[field] = input.value;
      saveState();
      syncSeasonHubActionState();
    });
  });

  content.querySelectorAll("[data-season-hub-id]").forEach((button) => {
    button.addEventListener("click", () => {
      loadSeasonHubIntoDraft(button.dataset.seasonHubId);
    });
  });

  syncSeasonHubActionState();
}

function syncSeasonHubActionState() {
  const saveHubBtn = elements.seasonHubContent?.querySelector("#save-season-hub-btn");
  if (!saveHubBtn) {
    return;
  }

  saveHubBtn.disabled = !state.seasonHub.selectedHubId && isSeasonHubDraftEmpty(state.seasonHub.draft);
}

function startNewSeasonHub() {
  if (isSeasonHubDraftDirty()) {
    const confirmed = window.confirm("Discard the current season hub draft and start a new one?");
    if (!confirmed) {
      return;
    }
  }

  state.seasonHub.selectedHubId = null;
  state.seasonHub.draft = createEmptySeasonHubDraft();
  saveState();
  renderSeasonHub();
}

function saveSeasonHubDraft() {
  const draft = normalizeSeasonHubDraft(state.seasonHub.draft);
  const hasDraftContent = !isSeasonHubDraftEmpty(draft);
  const selectedHub = getSelectedSeasonHub();

  if (!hasDraftContent && !selectedHub) {
    return;
  }

  const now = new Date().toISOString();

  if (selectedHub) {
    Object.assign(selectedHub, draft, {
      updatedAt: now,
      createdAt: selectedHub.createdAt || now,
    });
  } else {
    const hub = {
      id: createId(),
      ...draft,
      createdAt: now,
      updatedAt: now,
    };
    state.seasonHub.items.push(hub);
    state.seasonHub.selectedHubId = hub.id;
  }

  const savedHub = getSelectedSeasonHub();
  if (savedHub) {
    state.seasonHub.draft = cloneSeasonHubDraft(savedHub);
  }

  saveState();
  renderSeasonHub();
}

function loadSeasonHubIntoDraft(hubId) {
  const hub = state.seasonHub.items.find((entry) => entry.id === hubId);
  if (!hub) {
    return;
  }

  if (isSeasonHubDraftDirty() && state.seasonHub.selectedHubId !== hubId) {
    const confirmed = window.confirm("Discard the current season hub draft and open another snapshot?");
    if (!confirmed) {
      return;
    }
  }

  state.seasonHub.selectedHubId = hub.id;
  state.seasonHub.draft = cloneSeasonHubDraft(hub);
  saveState();
  renderSeasonHub();
}

function getSelectedSeasonHub() {
  if (!state.seasonHub.selectedHubId) {
    return null;
  }

  return state.seasonHub.items.find((hub) => hub.id === state.seasonHub.selectedHubId) || null;
}

function cloneSeasonHubDraft(hub) {
  const normalized = normalizeSeasonHubDraft(hub);
  return { ...normalized };
}

function createEmptySeasonHubDraft() {
  return {
    team: "",
    seasonYear: "",
    competition: "",
    coachingRole: "",
    teamValues: "",
    nonNegotiables: "",
    currentGamePlanLanguage: "",
    currentWeeklyFocus: "",
    latestTrainingPriorities: "",
    latestGameReviewSummary: "",
    importantDecisions: "",
    generalSeasonNotes: "",
  };
}

function normalizeSeasonHubDraft(hub) {
  const source = hub && typeof hub === "object" ? hub : {};
  const blank = createEmptySeasonHubDraft();

  return {
    team: `${source.team ?? blank.team}`,
    seasonYear: `${source.seasonYear ?? blank.seasonYear}`,
    competition: `${source.competition ?? blank.competition}`,
    coachingRole: `${source.coachingRole ?? blank.coachingRole}`,
    teamValues: `${source.teamValues ?? blank.teamValues}`,
    nonNegotiables: `${source.nonNegotiables ?? blank.nonNegotiables}`,
    currentGamePlanLanguage: `${source.currentGamePlanLanguage ?? blank.currentGamePlanLanguage}`,
    currentWeeklyFocus: `${source.currentWeeklyFocus ?? blank.currentWeeklyFocus}`,
    latestTrainingPriorities: `${source.latestTrainingPriorities ?? blank.latestTrainingPriorities}`,
    latestGameReviewSummary: `${source.latestGameReviewSummary ?? blank.latestGameReviewSummary}`,
    importantDecisions: `${source.importantDecisions ?? blank.importantDecisions}`,
    generalSeasonNotes: `${source.generalSeasonNotes ?? blank.generalSeasonNotes}`,
  };
}

function normalizeSeasonHubItem(hub) {
  const source = hub && typeof hub === "object" ? hub : {};
  const draft = normalizeSeasonHubDraft(source);

  return {
    id: `${source.id || createId()}`,
    ...draft,
    createdAt: source.createdAt || source.updatedAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

function isSeasonHubDraftEmpty(draft) {
  const normalized = normalizeSeasonHubDraft(draft);
  return Object.values(normalized).every((value) => `${value}`.trim() === "");
}

function isSeasonHubDraftDirty() {
  const selectedHub = getSelectedSeasonHub();
  if (!selectedHub) {
    return !isSeasonHubDraftEmpty(state.seasonHub.draft);
  }

  return !areSeasonHubEntriesEqual(selectedHub, state.seasonHub.draft);
}

function areSeasonHubEntriesEqual(left, right) {
  const leftDraft = normalizeSeasonHubDraft(left);
  const rightDraft = normalizeSeasonHubDraft(right);

  return Object.keys(leftDraft).every((key) => `${leftDraft[key]}` === `${rightDraft[key]}`);
}

function getSeasonHubLabel(hub) {
  const team = `${hub?.team || ""}`.trim();
  if (team) {
    return team;
  }

  const year = `${hub?.seasonYear || ""}`.trim();
  return year || "Untitled Snapshot";
}

function formatSeasonHubDate(value) {
  if (!value) {
    return "Just saved";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just saved";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderPlayerNotes() {
  const content = elements.playerNotesContent;
  if (!content) {
    return;
  }

  const availablePlayers = state.players.filter((player) => player.name);
  if (!availablePlayers.length) {
    content.innerHTML = '<p class="placeholder">Add players to start taking player notes.</p>';
    return;
  }

  syncSelectedPlayerNote();
  state.playerNotes.draft = normalizePlayerNoteDraft(state.playerNotes.draft);

  const activeNote = getSelectedPlayerNote();
  const draft = activeNote
    ? clonePlayerNoteDraft(state.playerNotes.draft)
    : state.playerNotes.draft;
  const noteTitle = activeNote
    ? `Editing ${getPlayerNoteLabel(activeNote)}`
    : "New Player Note";
  const noteHelper = activeNote
    ? `Last saved ${formatPlayerNoteDate(activeNote.updatedAt)}.`
    : "Capture the current development note for one player.";
  const saveDisabled = !activeNote && isPlayerNoteDraftEmpty(draft);
  const savedNotes = [...state.playerNotes.items].reverse();
  const playerOptions = availablePlayers
    .map((player) => `<option value="${escapeHtml(player.id)}" ${player.id === state.playerNotes.selectedPlayerId ? "selected" : ""}>${escapeHtml(player.name)}</option>`)
    .join("");

  const noteListMarkup = savedNotes.length
    ? savedNotes.map((note) => `
      <button class="review-list-item ${note.playerId === state.playerNotes.selectedPlayerId ? "active" : ""}" type="button" data-player-note-id="${note.id}">
        <span class="review-list-title">${escapeHtml(getPlayerNoteLabel(note))}</span>
        <span class="review-list-meta">${escapeHtml(note.bestRole || "No role recorded")} · ${escapeHtml(formatPlayerNoteDate(note.updatedAt))}</span>
      </button>
    `).join("")
    : '<p class="placeholder">No player notes saved yet.</p>';

  content.innerHTML = `
    <article class="feedback-panel player-note-editor">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(noteTitle)}</h3>
          <p class="helper">${escapeHtml(noteHelper)}</p>
        </div>
        <div class="inline-actions compact-actions">
          <button id="new-player-note-btn" type="button">New Note</button>
          <button id="save-player-note-btn" class="primary" type="button" ${saveDisabled ? "disabled" : ""}>Save Note</button>
        </div>
      </div>

      <div class="feedback-player-switcher">
        <label class="player-select-wrap">
          Player
          <select id="player-note-player-select">${playerOptions}</select>
        </label>
        <div class="feedback-player-status">
          <span class="live-count-pill">Player note</span>
        </div>
      </div>

      <div class="review-form-grid">
        <label class="review-full-width">
          Player Name
          <input id="player-note-name" type="text" value="${escapeHtml(draft.playerName)}" readonly>
        </label>
        <label class="review-full-width">
          Strengths
          <textarea id="player-note-strengths" rows="3" placeholder="What this player already does well...">${escapeHtml(draft.strengths)}</textarea>
        </label>
        <label class="review-full-width">
          Current Focus
          <textarea id="player-note-current-focus" rows="3" placeholder="What this player is working on now...">${escapeHtml(draft.currentFocus)}</textarea>
        </label>
        <label>
          Best Role
          <input id="player-note-best-role" type="text" value="${escapeHtml(draft.bestRole)}" placeholder="Best role or line">
        </label>
        <label>
          Coaching Cue
          <input id="player-note-coaching-cue" type="text" value="${escapeHtml(draft.coachingCue)}" placeholder="Simple cue to give the player">
        </label>
        <label class="review-full-width">
          Confidence / Development Note
          <textarea id="player-note-development" rows="3" placeholder="Confidence or development note...">${escapeHtml(draft.confidenceDevelopmentNote)}</textarea>
        </label>
        <label class="review-full-width">
          Latest Update Note
          <textarea id="player-note-update" rows="4" placeholder="Latest update, game notes, training notes...">${escapeHtml(draft.latestUpdateNote)}</textarea>
        </label>
      </div>
    </article>

    <article class="feedback-panel player-note-list-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>Saved Player Notes</h3>
        </div>
      </div>
      <div class="review-list">
        ${noteListMarkup}
      </div>
    </article>
  `;

  bindPlayerNotesEvents();
}

function bindPlayerNotesEvents() {
  const content = elements.playerNotesContent;
  if (!content) {
    return;
  }

  const playerSelect = content.querySelector("#player-note-player-select");
  if (playerSelect) {
    playerSelect.addEventListener("change", () => {
      loadPlayerNoteForPlayer(playerSelect.value);
    });
  }

  const newNoteBtn = content.querySelector("#new-player-note-btn");
  if (newNoteBtn) {
    newNoteBtn.addEventListener("click", startNewPlayerNote);
  }

  const saveNoteBtn = content.querySelector("#save-player-note-btn");
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", savePlayerNoteDraft);
  }

  const fieldMap = [
    ["#player-note-strengths", "strengths"],
    ["#player-note-current-focus", "currentFocus"],
    ["#player-note-best-role", "bestRole"],
    ["#player-note-coaching-cue", "coachingCue"],
    ["#player-note-development", "confidenceDevelopmentNote"],
    ["#player-note-update", "latestUpdateNote"],
  ];

  fieldMap.forEach(([selector, field]) => {
    const input = content.querySelector(selector);
    if (!input) {
      return;
    }

    input.addEventListener("input", () => {
      state.playerNotes.draft[field] = input.value;
      saveState();
      syncPlayerNotesActionState();
    });
  });

  content.querySelectorAll("[data-player-note-id]").forEach((button) => {
    button.addEventListener("click", () => {
      loadPlayerNoteIntoDraft(button.dataset.playerNoteId);
    });
  });

  syncPlayerNotesActionState();
}

function syncPlayerNotesActionState() {
  const saveNoteBtn = elements.playerNotesContent?.querySelector("#save-player-note-btn");
  if (!saveNoteBtn) {
    return;
  }

  saveNoteBtn.disabled = !state.playerNotes.selectedPlayerId && isPlayerNoteDraftEmpty(state.playerNotes.draft);
}

function syncSelectedPlayerNote() {
  const availablePlayers = state.players.filter((player) => player.name);

  if (!availablePlayers.length) {
    state.playerNotes.selectedPlayerId = null;
    return;
  }

  const selectedStillExists = availablePlayers.some((player) => player.id === state.playerNotes.selectedPlayerId);
  if (!selectedStillExists) {
    state.playerNotes.selectedPlayerId = availablePlayers[0].id;
  }
}

function startNewPlayerNote() {
  if (isPlayerNoteDraftDirty()) {
    const confirmed = window.confirm("Discard the current player note draft and start a new one?");
    if (!confirmed) {
      return;
    }
  }

  state.playerNotes.selectedPlayerId = null;
  state.playerNotes.draft = createEmptyPlayerNoteDraft();
  saveState();
  renderPlayerNotes();
}

function savePlayerNoteDraft() {
  const draft = normalizePlayerNoteDraft(state.playerNotes.draft);
  const hasDraftContent = !isPlayerNoteDraftEmpty(draft);
  const selectedNote = getSelectedPlayerNote();

  if (!hasDraftContent && !selectedNote) {
    return;
  }

  const now = new Date().toISOString();

  if (selectedNote) {
    Object.assign(selectedNote, draft, {
      updatedAt: now,
      createdAt: selectedNote.createdAt || now,
    });
  } else {
    const note = {
      id: createId(),
      ...draft,
      createdAt: now,
      updatedAt: now,
    };
    state.playerNotes.items.push(note);
    state.playerNotes.selectedPlayerId = note.playerId;
  }

  const savedNote = getSelectedPlayerNote();
  if (savedNote) {
    state.playerNotes.draft = clonePlayerNoteDraft(savedNote);
  }

  saveState();
  renderPlayerNotes();
}

function loadPlayerNoteForPlayer(playerId) {
  const note = state.playerNotes.items.find((entry) => entry.playerId === playerId);
  if (note) {
    if (isPlayerNoteDraftDirty() && state.playerNotes.selectedPlayerId !== playerId) {
      const confirmed = window.confirm("Discard the current player note draft and open another player?");
      if (!confirmed) {
        return;
      }
    }

    state.playerNotes.selectedPlayerId = note.playerId;
    state.playerNotes.draft = clonePlayerNoteDraft(note);
  } else {
    if (isPlayerNoteDraftDirty() && state.playerNotes.selectedPlayerId !== playerId) {
      const confirmed = window.confirm("Discard the current player note draft and switch players?");
      if (!confirmed) {
        return;
      }
    }

    state.playerNotes.selectedPlayerId = playerId;
    state.playerNotes.draft = createEmptyPlayerNoteDraft();
    state.playerNotes.draft.playerId = playerId;
    state.playerNotes.draft.playerName = getPlayerNameById(playerId);
  }

  saveState();
  renderPlayerNotes();
}

function loadPlayerNoteIntoDraft(noteId) {
  const note = state.playerNotes.items.find((entry) => entry.id === noteId);
  if (!note) {
    return;
  }

  if (isPlayerNoteDraftDirty() && state.playerNotes.selectedPlayerId !== note.playerId) {
    const confirmed = window.confirm("Discard the current player note draft and open another note?");
    if (!confirmed) {
      return;
    }
  }

  state.playerNotes.selectedPlayerId = note.playerId;
  state.playerNotes.draft = clonePlayerNoteDraft(note);
  saveState();
  renderPlayerNotes();
}

function getSelectedPlayerNote() {
  if (!state.playerNotes.selectedPlayerId) {
    return null;
  }

  return state.playerNotes.items.find((note) => note.playerId === state.playerNotes.selectedPlayerId) || null;
}

function getPlayerNameById(playerId) {
  const player = state.players.find((entry) => entry.id === playerId);
  return player?.name || "";
}

function clonePlayerNoteDraft(note) {
  const normalized = normalizePlayerNoteDraft(note);
  return { ...normalized };
}

function createEmptyPlayerNoteDraft() {
  return {
    playerId: "",
    playerName: "",
    strengths: "",
    currentFocus: "",
    bestRole: "",
    coachingCue: "",
    confidenceDevelopmentNote: "",
    latestUpdateNote: "",
  };
}

function normalizePlayerNoteDraft(note) {
  const source = note && typeof note === "object" ? note : {};
  const blank = createEmptyPlayerNoteDraft();

  return {
    playerId: `${source.playerId ?? blank.playerId}`,
    playerName: `${source.playerName ?? blank.playerName}`,
    strengths: `${source.strengths ?? blank.strengths}`,
    currentFocus: `${source.currentFocus ?? blank.currentFocus}`,
    bestRole: `${source.bestRole ?? blank.bestRole}`,
    coachingCue: `${source.coachingCue ?? blank.coachingCue}`,
    confidenceDevelopmentNote: `${source.confidenceDevelopmentNote ?? blank.confidenceDevelopmentNote}`,
    latestUpdateNote: `${source.latestUpdateNote ?? blank.latestUpdateNote}`,
  };
}

function normalizePlayerNoteItem(note) {
  const source = note && typeof note === "object" ? note : {};
  const draft = normalizePlayerNoteDraft(source);
  const currentPlayerName = getPlayerNameById(draft.playerId);

  return {
    id: `${source.id || createId()}`,
    ...draft,
    playerName: currentPlayerName || draft.playerName,
    createdAt: source.createdAt || source.updatedAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

function isPlayerNoteDraftEmpty(draft) {
  const normalized = normalizePlayerNoteDraft(draft);
  return Object.entries(normalized)
    .filter(([key]) => key !== "playerId" && key !== "playerName")
    .every(([, value]) => `${value}`.trim() === "");
}

function isPlayerNoteDraftDirty() {
  const selectedNote = getSelectedPlayerNote();
  if (!selectedNote) {
    return !isPlayerNoteDraftEmpty(state.playerNotes.draft);
  }

  return !arePlayerNoteEntriesEqual(selectedNote, state.playerNotes.draft);
}

function arePlayerNoteEntriesEqual(left, right) {
  const leftDraft = normalizePlayerNoteDraft(left);
  const rightDraft = normalizePlayerNoteDraft(right);

  return Object.keys(leftDraft).every((key) => `${leftDraft[key]}` === `${rightDraft[key]}`);
}

function getPlayerNoteLabel(note) {
  const name = `${note?.playerName || ""}`.trim();
  if (name) {
    return name;
  }

  return "Untitled Note";
}

function formatPlayerNoteDate(value) {
  if (!value) {
    return "Just saved";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just saved";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function bindFeedbackTrackerEvents() {
  elements.feedbackTracker.querySelectorAll("[data-feedback-quarter]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveQuarter(Number.parseInt(button.dataset.feedbackQuarter, 10));
      renderFeedbackTracker();
      renderNotepad();
      renderPostGameReport();
    });
  });

  const playerSelect = elements.feedbackTracker.querySelector("#feedback-player-select");
  if (playerSelect) {
    playerSelect.addEventListener("change", () => {
      state.feedback.selectedPlayerId = playerSelect.value;
      saveState();
      renderFeedbackTracker();
      renderPostGameReport();
    });
  }

  elements.feedbackTracker.querySelectorAll("[data-category-id]").forEach((button) => {
    button.addEventListener("click", () => {
      addFeedbackMark(button.dataset.categoryId);
    });
  });

  const quarterNotesInput = elements.feedbackTracker.querySelector("#feedback-quarter-notes");
  if (quarterNotesInput) {
    quarterNotesInput.addEventListener("input", () => {
      const entry = getNotepadQuarterEntry(getSelectedFeedbackQuarter());
      entry.notes = quarterNotesInput.value;
      saveState();
    });
  }
}

function addFeedbackMark(categoryId) {
  const playerId = state.feedback.selectedPlayerId;
  if (!playerId) {
    return;
  }

  const feedback = getPlayerQuarterFeedback(playerId, getSelectedFeedbackQuarter());
  feedback.counts[categoryId] = (feedback.counts[categoryId] || 0) + 1;
  saveState();
  renderFeedbackTracker();
  renderPostGameReport();
}

function addFeedbackNote() {
  const playerId = state.feedback.selectedPlayerId;
  const noteInput = elements.feedbackTracker.querySelector("#feedback-note-input");

  if (!playerId || !noteInput) {
    return;
  }

  const note = noteInput.value.trim();
  if (!note) {
    return;
  }

  const feedback = getPlayerQuarterFeedback(playerId, getSelectedFeedbackQuarter());
  feedback.notes.push(note);
  noteInput.value = "";
  saveState();
  renderFeedbackTracker();
  renderPostGameReport();
}

function clearSelectedPlayerFeedback() {
  const playerId = state.feedback.selectedPlayerId;
  const selectedQuarter = getSelectedFeedbackQuarter();
  const selectedQuarterLabel = getFeedbackQuarterLabel(selectedQuarter);

  if (!playerId) {
    return;
  }

  const confirmed = window.confirm(`Clear all feedback for this player in ${selectedQuarterLabel}?`);
  if (!confirmed) {
    return;
  }

  const feedbackRecord = getPlayerFeedbackRecord(playerId);
  feedbackRecord.byQuarter[String(selectedQuarter)] = createEmptyQuarterFeedbackRecord();
  saveState();
  renderFeedbackTracker();
  renderPostGameReport();
}

function copySelectedFeedbackSummary() {
  const playerId = state.feedback.selectedPlayerId;
  if (!playerId) {
    return;
  }

  const selectedPlayer = state.players.find((player) => player.id === playerId);
  if (!selectedPlayer) {
    return;
  }

  const selectedQuarter = getSelectedFeedbackQuarter();
  const summary = buildFeedbackSummary(
    selectedPlayer,
    getPlayerQuarterFeedback(playerId, selectedQuarter),
    getFeedbackQuarterLabel(selectedQuarter)
  );
  if (!navigator.clipboard || !summary) {
    return;
  }

  navigator.clipboard.writeText(summary).catch((error) => {
    console.error("Could not copy feedback summary.", error);
  });
}

function getPlayerFeedbackRecord(playerId) {
  if (!state.feedback.byPlayerId[playerId]) {
    state.feedback.byPlayerId[playerId] = createEmptyFeedbackRecord();
  }

  return normalizeFeedbackRecord(state.feedback.byPlayerId[playerId]);
}

function getPlayerQuarterFeedback(playerId, quarterNumber) {
  const feedbackRecord = getPlayerFeedbackRecord(playerId);
  const quarterKey = String(quarterNumber);

  if (!feedbackRecord.byQuarter[quarterKey]) {
    feedbackRecord.byQuarter[quarterKey] = createEmptyQuarterFeedbackRecord();
  }

  const quarterFeedback = feedbackRecord.byQuarter[quarterKey];
  FEEDBACK_CATEGORIES.forEach((category) => {
    if (typeof quarterFeedback.counts[category.id] !== "number") {
      quarterFeedback.counts[category.id] = 0;
    }
  });

  if (!Array.isArray(quarterFeedback.notes)) {
    quarterFeedback.notes = [];
  }

  return quarterFeedback;
}

function getPlayerFeedback(playerId) {
  const feedbackRecord = getPlayerFeedbackRecord(playerId);
  const aggregate = createEmptyQuarterFeedbackRecord();

  Object.keys(feedbackRecord.byQuarter)
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .forEach((quarterKey) => {
      const quarterNumber = Number.parseInt(quarterKey, 10);
      const quarterFeedback = getPlayerQuarterFeedback(playerId, quarterNumber);

      FEEDBACK_CATEGORIES.forEach((category) => {
        aggregate.counts[category.id] += quarterFeedback.counts[category.id] || 0;
      });

      if (quarterFeedback.notes.length) {
        const quarterLabel = getFeedbackQuarterLabel(quarterNumber);
        aggregate.notes.push(...quarterFeedback.notes.map((note) => `${quarterLabel}: ${note}`));
      }
    });

  return aggregate;
}

function migrateLegacyCategoryCounts(counts) {
  if (!counts || typeof counts !== "object") {
    return;
  }

  const hasLegacyOnePercenters = Object.prototype.hasOwnProperty.call(counts, "teamacts")
    && !Object.prototype.hasOwnProperty.call(counts, "teamacts_old");
  const legacyOnePercentersCount = hasLegacyOnePercenters ? (counts.teamacts || 0) : 0;

  counts.attack = (counts.attack || 0) + (counts.offence || 0);
  counts.voice = (counts.voice || 0) + (counts.leadership || 0);
  counts.teamacts = (hasLegacyOnePercenters ? 0 : (counts.teamacts || 0)) + (counts.teamplay || 0);
  counts.teamacts_old = (counts.teamacts_old || 0) + legacyOnePercentersCount + (counts.teamacts_legacy || 0);

  delete counts.offence;
  delete counts.leadership;
  delete counts.teamplay;
  delete counts.teamacts_legacy;
}

function normalizeFeedbackRecord(feedbackRecord) {
  const normalizedRecord = feedbackRecord && typeof feedbackRecord === "object"
    ? feedbackRecord
    : createEmptyFeedbackRecord();

  if (!normalizedRecord.byQuarter) {
    const migratedQuarter = createEmptyQuarterFeedbackRecord();

    if (normalizedRecord.counts && typeof normalizedRecord.counts === "object") {
      migrateLegacyCategoryCounts(normalizedRecord.counts);
      FEEDBACK_CATEGORIES.forEach((category) => {
        migratedQuarter.counts[category.id] = normalizedRecord.counts[category.id] || 0;
      });
    }

    if (Array.isArray(normalizedRecord.notes)) {
      migratedQuarter.notes = [...normalizedRecord.notes];
    }

    normalizedRecord.byQuarter = {
      "1": migratedQuarter,
    };
  }

  Object.values(normalizedRecord.byQuarter).forEach((quarterFeedback) => {
    if (quarterFeedback && typeof quarterFeedback === "object") {
      migrateLegacyCategoryCounts(quarterFeedback.counts);
    }
  });

  return normalizedRecord;
}

function createEmptyFeedbackRecord() {
  return {
    byQuarter: {},
  };
}

function createEmptyQuarterFeedbackRecord() {
  const counts = {};
  FEEDBACK_CATEGORIES.forEach((category) => {
    counts[category.id] = 0;
  });

  return {
    counts,
    notes: [],
  };
}

function getTotalFeedbackMarks(feedback) {
  return FEEDBACK_CATEGORIES.reduce((total, category) => total + (feedback.counts[category.id] || 0), 0);
}

function buildFeedbackSummary(player, feedback, contextLabel = "") {
  const rankedCategories = FEEDBACK_CATEGORIES
    .map((category) => ({
      ...category,
      count: feedback.counts[category.id] || 0,
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count);

  const summaryParts = [];

  rankedCategories.slice(0, 3).forEach((category, index) => {
    const promptIndex = Math.min(category.count - 1, category.prompts.length - 1);
    const sentence = category.prompts[promptIndex] || category.prompts[index] || category.prompts[0];
    summaryParts.push(sentence);
  });

  if (!summaryParts.length && !feedback.notes.length) {
    return contextLabel
      ? `No feedback recorded yet for ${player.name} in ${contextLabel}.`
      : `No feedback recorded yet for ${player.name}.`;
  }

  if (feedback.notes.length) {
    const noteSummary = feedback.notes.slice(-2).join(" ");
    summaryParts.push(`Match notes: ${noteSummary}`);
  }

  return `${player.name}: ${summaryParts.join(" ")}`;
}

function getSelectedFeedbackQuarter() {
  const maxQuarter = normalizePositiveNumber(state.settings.periodCount, 4);
  const quarter = normalizePositiveNumber(state.feedback.currentQuarter, 1);
  const clampedQuarter = Math.min(Math.max(quarter, 1), maxQuarter);
  state.feedback.currentQuarter = clampedQuarter;
  return clampedQuarter;
}

function setActiveQuarter(quarterNumber) {
  const maxQuarter = normalizePositiveNumber(state.settings.periodCount, 4);
  const clampedQuarter = Math.min(Math.max(normalizePositiveNumber(quarterNumber, 1), 1), maxQuarter);
  state.feedback.currentQuarter = clampedQuarter;
  state.notepad.currentQuarter = clampedQuarter;
  saveState();
}

function getFeedbackQuarterLabel(quarterNumber) {
  return `${normalizePeriodLabel(state.settings.periodLabel)} ${quarterNumber}`;
}

function buildFeedbackQuarterTabs(attributeName) {
  return buildQuarterTabs(getSelectedFeedbackQuarter(), attributeName);
}

function buildQuarterTabs(selectedQuarter, attributeName) {
  const periodCount = normalizePositiveNumber(state.settings.periodCount, 4);

  return Array.from({ length: periodCount }, (_, index) => {
    const quarterNumber = index + 1;
    const label = getFeedbackQuarterLabel(quarterNumber);
    return `
      <button
        class="period-tab ${quarterNumber === selectedQuarter ? "active" : ""}"
        type="button"
        ${attributeName}="${quarterNumber}"
      >
        ${escapeHtml(label)}
      </button>
    `;
  }).join("");
}

function renderPostGameReport() {
  const selectedQuarter = getSelectedFeedbackQuarter();
  const quarterNotes = getNotepadQuarterEntry(selectedQuarter).notes || "";
  const quarterEntries = buildQuarterReportEntries(selectedQuarter);
  const reportEntries = buildPostGameReportEntries();

  elements.toggleFullReportBtn.textContent = showFullGameReport ? "Hide Full Report" : "Show Full Report";
  elements.copyReportBtn.hidden = !showFullGameReport || !reportEntries.length;

  if (!quarterEntries.length && !reportEntries.length) {
    elements.postGameReport.innerHTML = '<p class="placeholder">Track some player feedback during the game to build a post-game report.</p>';
    return;
  }

  const quarterTabs = buildFeedbackQuarterTabs("data-report-quarter");
  const quarterNotesCard = `
    <article class="feedback-panel report-notes-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(getFeedbackQuarterLabel(selectedQuarter))} Notes</h3>
        </div>
        <button id="copy-quarter-notes-btn" type="button">Copy Notes</button>
      </div>
      <label class="report-notes-field">
        Notes
        <textarea id="report-quarter-notes" rows="6" readonly>${escapeHtml(quarterNotes)}</textarea>
      </label>
    </article>
  `;
  const quarterSummaryCards = quarterEntries.length
    ? renderReportCards(quarterEntries, false)
    : '<p class="placeholder">No feedback recorded yet for this quarter.</p>';
  const fullReportCards = reportEntries.length
    ? renderReportCards(reportEntries, true)
    : '<p class="placeholder">Track some player feedback during the game to build a post-game report.</p>';

  elements.postGameReport.innerHTML = `
    ${quarterNotesCard}

    <article class="feedback-panel">
      <div class="section-heading report-card-header">
        <div>
          <h3>${escapeHtml(getFeedbackQuarterLabel(selectedQuarter))} Summary</h3>
        </div>
      </div>
      <div class="period-tabs feedback-quarter-tabs">${quarterTabs}</div>
      <div class="report-grid">${quarterSummaryCards}</div>
    </article>

    ${showFullGameReport ? `
      <article class="feedback-panel">
        <div class="section-heading report-card-header">
          <div>
            <h3>Full Game Report</h3>
          </div>
        </div>
        <div class="report-grid">${fullReportCards}</div>
      </article>
    ` : ""}
  `;

  elements.postGameReport.querySelectorAll("[data-report-quarter]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveQuarter(Number.parseInt(button.dataset.reportQuarter, 10));
      renderFeedbackTracker();
      renderNotepad();
      renderPostGameReport();
    });
  });

  elements.postGameReport.querySelectorAll("[data-copy-player-report]").forEach((button) => {
    button.addEventListener("click", () => {
      copyPlayerReport(button.dataset.copyPlayerReport);
    });
  });

  const copyQuarterNotesBtn = elements.postGameReport.querySelector("#copy-quarter-notes-btn");
  if (copyQuarterNotesBtn) {
    copyQuarterNotesBtn.addEventListener("click", copyCurrentQuarterNotes);
  }
}

function buildQuarterReportEntries(quarterNumber) {
  const quarterLabel = getFeedbackQuarterLabel(quarterNumber);

  return state.players
    .filter((player) => player.name)
    .map((player) => {
      const feedback = getPlayerQuarterFeedback(player.id, quarterNumber);
      const totalMarks = getTotalFeedbackMarks(feedback);
      const summary = buildFeedbackSummary(player, feedback, quarterLabel);

      return {
        playerId: player.id,
        playerName: player.name,
        totalMarks,
        noteCount: feedback.notes.length,
        summary,
      };
    })
    .filter((entry) => entry.totalMarks > 0 || !entry.summary.startsWith("No feedback recorded yet"))
    .sort((a, b) => {
      if (b.totalMarks !== a.totalMarks) {
        return b.totalMarks - a.totalMarks;
      }

      if (b.noteCount !== a.noteCount) {
        return b.noteCount - a.noteCount;
      }

      return a.playerName.localeCompare(b.playerName);
    });
}

function renderReportCards(entries, includeCopyButtons) {
  return entries
    .map((entry) => `
      <article class="feedback-panel report-card">
        <div class="section-heading report-card-header">
          <div>
            <h3>${escapeHtml(entry.playerName)}</h3>
          </div>
          ${includeCopyButtons ? `<button type="button" data-copy-player-report="${entry.playerId}">Copy</button>` : ""}
        </div>
        <p class="feedback-summary-text">${escapeHtml(entry.summary)}</p>
      </article>
    `)
    .join("");
}

function buildPostGameReportEntries() {
  return state.players
    .filter((player) => player.name)
    .map((player) => {
      const feedback = getPlayerFeedback(player.id);
      const totalMarks = getTotalFeedbackMarks(feedback);
      const summary = buildFeedbackSummary(player, feedback);

      return {
        playerId: player.id,
        playerName: player.name,
        totalMarks,
        noteCount: feedback.notes.length,
        summary,
      };
    })
    .filter((entry) => entry.totalMarks > 0 || !entry.summary.startsWith("No feedback recorded yet"))
    .sort((a, b) => {
      if (b.totalMarks !== a.totalMarks) {
        return b.totalMarks - a.totalMarks;
      }

      if (b.noteCount !== a.noteCount) {
        return b.noteCount - a.noteCount;
      }

      return a.playerName.localeCompare(b.playerName);
    });
}

function buildFullPostGameReportText() {
  const entries = buildPostGameReportEntries();
  return entries.map((entry) => entry.summary).join("\n\n");
}

function copyCurrentQuarterNotes() {
  if (!navigator.clipboard) {
    return;
  }

  const notesText = (getNotepadQuarterEntry(getSelectedFeedbackQuarter()).notes || "").trim();
  if (!notesText) {
    return;
  }

  navigator.clipboard.writeText(notesText).catch((error) => {
    console.error("Could not copy quarter notes.", error);
  });
}

function copyPlayerReport(playerId) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player || !navigator.clipboard) {
    return;
  }

  const summary = buildFeedbackSummary(player, getPlayerFeedback(playerId));
  navigator.clipboard.writeText(summary).catch((error) => {
    console.error("Could not copy player report.", error);
  });
}

function copyFullPostGameReport() {
  if (!navigator.clipboard) {
    return;
  }

  const reportText = buildFullPostGameReportText();
  if (!reportText) {
    return;
  }

  navigator.clipboard.writeText(reportText).catch((error) => {
    console.error("Could not copy post-game report.", error);
  });
}

function toggleBenchRulesVisibility() {
  showBenchRules = !showBenchRules;
  syncBenchRulesVisibility();
}

function syncBenchRulesVisibility() {
  elements.playerTableWrap.classList.toggle("show-bench-rules", showBenchRules);
  elements.toggleBenchRulesBtn.textContent = showBenchRules ? "Hide Advanced" : "Advanced";
}

function toggleFullGameReportVisibility() {
  showFullGameReport = !showFullGameReport;
  renderPostGameReport();
}

function bindSwapButtons() {
  const swapButtons = elements.rotationOutput.querySelectorAll("[data-board-player-id]");

  swapButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const periodIndex = Number.parseInt(button.dataset.periodIndex, 10);
      const playerId = button.dataset.boardPlayerId;
      const group = button.dataset.boardGroup;

      if (!playerId || !group) {
        return;
      }

      handleRotationBoardSelection(periodIndex, group, playerId);
    });
  });
}

function handleRotationBoardSelection(periodIndex, group, playerId) {
  if (group === "field") {
    selectedFieldPlayerId = selectedFieldPlayerId === playerId ? "" : playerId;
  }

  if (group === "bench") {
    selectedBenchPlayerId = selectedBenchPlayerId === playerId ? "" : playerId;
  }

  if (selectedFieldPlayerId && selectedBenchPlayerId) {
    swapPlayersForPeriod(periodIndex, selectedFieldPlayerId, selectedBenchPlayerId);
    return;
  }

  renderRotation();
}

function swapPlayersForPeriod(periodIndex, fieldPlayerId, benchPlayerId) {
  if (!currentRotationPlan || !currentRotationPlan.periods.length) {
    return;
  }

  if (!fieldPlayerId || !benchPlayerId || fieldPlayerId === benchPlayerId) {
    return;
  }

  const period = currentRotationPlan.periods[periodIndex];
  const fieldPlayer = period.onField.find((player) => player.id === fieldPlayerId);
  const benchPlayer = period.bench.find((player) => player.id === benchPlayerId);

  if (!fieldPlayer || !benchPlayer) {
    return;
  }

  period.onField = period.onField
    .filter((player) => player.id !== fieldPlayerId)
    .concat(benchPlayer)
    .sort((a, b) => a.name.localeCompare(b.name));

  period.bench = period.bench
    .filter((player) => player.id !== benchPlayerId)
    .concat(fieldPlayer)
    .sort((a, b) => a.name.localeCompare(b.name));

  currentRotationPlan.summary = buildPlanSummary(
    currentRotationPlan.periods,
    currentRotationPlan.playerPool,
    currentRotationPlan.settings.periodCount
  );
  currentRotationPlan.manualEdited = true;
  clearRotationSelection();
  renderRotation();
}

function clearRotationSelection() {
  selectedFieldPlayerId = "";
  selectedBenchPlayerId = "";
}

function buildPlanSummary(periods, playerPool, periodCount) {
  const summaryMap = new Map(
    playerPool.map((player) => [player.id, {
      name: player.name,
      onFieldCount: 0,
      benchCount: 0,
    }])
  );

  periods.forEach((period) => {
    period.onField.forEach((player) => {
      const summary = summaryMap.get(player.id);
      if (summary) {
        summary.onFieldCount += 1;
      }
    });

    period.bench.forEach((player) => {
      const summary = summaryMap.get(player.id);
      if (summary) {
        summary.benchCount += 1;
      }
    });
  });

  return [...summaryMap.values()].sort((a, b) => {
    if (b.onFieldCount !== a.onFieldCount) {
      return b.onFieldCount - a.onFieldCount;
    }

    if (a.benchCount !== b.benchCount) {
      return a.benchCount - b.benchCount;
    }

    return a.name.localeCompare(b.name);
  }).map((player) => ({
    ...player,
    totalPeriods: periodCount,
  }));
}

function getPlanMessages(plan) {
  if (!plan) {
    return [];
  }

  const messages = [...(plan.baseMessages || plan.messages || [])];

  if (plan.manualEdited) {
    messages.push({
      type: "info",
      text: "Manual swaps have been applied to the generated plan.",
    });
  }

  return messages;
}

function renderPlayerPill(player, isBench = false) {
  const position = player.preferredPosition ? ` (${escapeHtml(player.preferredPosition)})` : "";
  const classes = isBench ? "pill bench" : "pill";
  return `<li class="${classes}">${escapeHtml(player.name)}${position}</li>`;
}

function renderRotationBoardPlayer(player, group, periodIndex, isSelected) {
  const positionText = player.preferredPosition
    ? escapeHtml(player.preferredPosition)
    : group === "field" ? "On Field" : "Bench";
  const classes = [
    "board-player-btn",
    group === "field" ? "field-player" : "bench-player",
    isSelected ? "selected" : "",
  ].filter(Boolean).join(" ");

  return `
    <button
      class="${classes}"
      type="button"
      data-period-index="${periodIndex}"
      data-board-group="${group}"
      data-board-player-id="${escapeHtml(player.id)}"
      aria-pressed="${isSelected ? "true" : "false"}"
    >
      <span class="board-player-name">${escapeHtml(player.name)}</span>
      <span class="board-player-role">${positionText}</span>
    </button>
  `;
}

function renderFieldBoard(activePeriod) {
  const groupedLines = buildFieldLines(activePeriod.onField);
  const populatedLines = groupedLines.filter((line) => line.players.length);

  if (!populatedLines.length || (populatedLines.length === 1 && populatedLines[0].name === "Utility")) {
    return `
      <div class="player-board field-board">
        ${activePeriod.onField
          .map((player) => renderRotationBoardPlayer(player, "field", activePeriod.index, player.id === selectedFieldPlayerId))
          .join("")}
      </div>
    `;
  }

  return `
    <div class="field-lines">
      ${populatedLines
        .map((line) => `
          <section class="field-line">
            <div class="field-line-header">
              <h5>${escapeHtml(line.name)}</h5>
              <span>${line.players.length}</span>
            </div>
            <div class="player-board field-board field-line-board">
              ${line.players
                .map((player) => renderRotationBoardPlayer(player, "field", activePeriod.index, player.id === selectedFieldPlayerId))
                .join("")}
            </div>
          </section>
        `)
        .join("")}
    </div>
  `;
}

function buildFieldLines(players) {
  const lines = [
    { name: "Back", players: [] },
    { name: "Mid", players: [] },
    { name: "Forward", players: [] },
    { name: "Utility", players: [] },
  ];

  players.forEach((player) => {
    const line = getFieldLineForPosition(player.preferredPosition);
    const targetLine = lines.find((entry) => entry.name === line);
    targetLine.players.push(player);
  });

  return lines;
}

function getFieldLineForPosition(position) {
  const value = `${position || ""}`.trim().toLowerCase();

  if (!value) {
    return "Utility";
  }

  if (
    value.includes("back")
    || value.includes("def")
    || value.includes("fb")
    || value.includes("hb")
    || value.includes("bp")
    || value.includes("chb")
  ) {
    return "Back";
  }

  if (
    value.includes("mid")
    || value.includes("wing")
    || value.includes("centre")
    || value.includes("center")
    || value.includes("ruck")
    || value === "c"
    || value === "r"
  ) {
    return "Mid";
  }

  if (
    value.includes("forward")
    || value.includes("fwd")
    || value.includes("hf")
    || value.includes("ff")
    || value.includes("fp")
    || value.includes("chf")
  ) {
    return "Forward";
  }

  return "Utility";
}

function getRotationBoardStatus(activePeriod) {
  if (!activePeriod.bench.length) {
    return "No bench players in this period.";
  }

  if (selectedFieldPlayerId) {
    return "Now tap a bench player to swap in.";
  }

  if (selectedBenchPlayerId) {
    return "Now tap a field player to swap out.";
  }

  return "Tap a player card to start a swap.";
}

function showMessages(messages) {
  if (!elements.messages) {
    return;
  }

  elements.messages.innerHTML = messages
    .map((message) => `<div class="message ${message.type}">${escapeHtml(message.text)}</div>`)
    .join("");
}

function buildCurrentSeasonSnapshot() {
  const seasonHubDraft = normalizeSeasonHubDraft(state.seasonHub.draft);
  const selectedSeasonHub = getSelectedSeasonHub();

  return {
    schemaVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    teamContext: {
      teamName: seasonHubDraft.team,
      seasonYear: seasonHubDraft.seasonYear,
      competition: seasonHubDraft.competition,
      coachingRole: seasonHubDraft.coachingRole,
      currentQuarter: getCurrentFeedbackQuarter(),
      settings: {
        periodLabel: state.settings.periodLabel,
        periodCount: state.settings.periodCount,
        playersOnField: state.settings.playersOnField,
      },
      playerCount: state.players.length,
      activePlayerCount: state.players.filter((player) => player.name && player.active).length,
      players: state.players.map(projectSnapshotPlayer),
    },
    seasonHub: projectSnapshotEntry(seasonHubDraft, selectedSeasonHub),
    weeklyFocus: projectSnapshotEntry(normalizeWeeklyFocusDraft(state.weeklyFocus.draft), getSelectedWeeklyFocus()),
    latestGameReview: projectSnapshotEntry(normalizeGameReviewDraft(state.gameReviews.draft), getSelectedGameReview()),
    latestTrainingPlan: projectSnapshotEntry(normalizeTrainingPlanDraft(state.trainingPlans.draft), getSelectedTrainingPlan()),
    playerNotes: state.playerNotes.items.map(projectPlayerNoteSnapshot),
  };
}

function exportCurrentSeasonSnapshot() {
  try {
    const snapshot = buildCurrentSeasonSnapshot();
    const payload = JSON.stringify(snapshot, null, 2);
    const filename = buildSeasonSnapshotFileName(snapshot);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);

    showMessages([{ type: "info", text: `Exported season snapshot as ${filename}.` }]);
  } catch (error) {
    console.error("Could not export season snapshot.", error);
    showMessages([{ type: "warn", text: "Could not export the season snapshot." }]);
  }
}

function copyCurrentSeasonSnapshot() {
  try {
    const snapshot = buildCurrentSeasonSnapshot();
    const payload = JSON.stringify(snapshot, null, 2);

    copyTextToClipboard(payload).then(() => {
      showMessages([{ type: "info", text: "Copied the current season snapshot to the clipboard." }]);
    }).catch((error) => {
      console.error("Could not copy season snapshot.", error);
      showMessages([{ type: "warn", text: "Could not copy the season snapshot." }]);
    });
  } catch (error) {
    console.error("Could not copy season snapshot.", error);
    showMessages([{ type: "warn", text: "Could not copy the season snapshot." }]);
  }
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      textarea.remove();

      if (copied) {
        resolve();
        return;
      }

      reject(new Error("Clipboard copy command was rejected."));
    } catch (error) {
      textarea.remove();
      reject(error);
    }
  });
}

function projectSnapshotEntry(draft, entry) {
  const normalizedDraft = draft && typeof draft === "object" ? draft : {};

  return {
    id: entry?.id || null,
    createdAt: entry?.createdAt || null,
    updatedAt: entry?.updatedAt || null,
    ...normalizedDraft,
  };
}

function projectSnapshotPlayer(player) {
  return {
    id: `${player?.id || ""}`,
    name: `${player?.name || ""}`,
    preferredPosition: `${player?.preferredPosition || ""}`,
    active: player?.active !== false,
    canBench: player?.canBench !== false,
    benchFirst: player?.benchFirst === true,
    maxBenchPeriods: normalizeNullableNonNegativeNumber(player?.maxBenchPeriods),
  };
}

function projectPlayerNoteSnapshot(note) {
  const draft = normalizePlayerNoteDraft(note);

  return {
    id: `${note?.id || ""}`,
    createdAt: note?.createdAt || null,
    updatedAt: note?.updatedAt || null,
    ...draft,
  };
}

function getCurrentFeedbackQuarter() {
  const maxQuarter = normalizePositiveNumber(state.settings.periodCount, 4);
  const quarter = normalizePositiveNumber(state.feedback.currentQuarter, 1);
  return Math.min(Math.max(quarter, 1), maxQuarter);
}

function buildSeasonSnapshotFileName(snapshot) {
  const teamName = `${snapshot?.teamContext?.teamName || ""}`.trim();
  const seasonYear = `${snapshot?.teamContext?.seasonYear || ""}`.trim();
  const dateStamp = `${snapshot?.exportedAt || new Date().toISOString()}`.slice(0, 10);
  const parts = ["footy", "season", "snapshot"];

  if (teamName) {
    parts.push(slugifyForFilename(teamName));
  }

  if (seasonYear) {
    parts.push(slugifyForFilename(seasonYear));
  }

  parts.push(dateStamp);
  return `${parts.filter(Boolean).join("-")}.json`;
}

function slugifyForFilename(value) {
  return `${value}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function normalizePositiveNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePeriodLabel(value) {
  const cleanValue = `${value || ""}`.trim();
  return cleanValue || "Quarter";
}

function normalizeMaxBenchValue(value) {
  const cleanValue = `${value ?? ""}`.trim();

  if (cleanValue === "") {
    return "";
  }

  const parsed = Number.parseInt(cleanValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : "";
}

function normalizeNullableNonNegativeNumber(value) {
  const cleanValue = `${value ?? ""}`.trim();

  if (cleanValue === "") {
    return null;
  }

  const parsed = Number.parseInt(cleanValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function saveState() {
  const payload = JSON.stringify({
    players: state.players,
    settings: state.settings,
    feedback: state.feedback,
    notepad: state.notepad,
    gameReviews: state.gameReviews,
    trainingPlans: state.trainingPlans,
    weeklyFocus: state.weeklyFocus,
    seasonHub: state.seasonHub,
    playerNotes: state.playerNotes,
  });
  window.localStorage.setItem(STORAGE_KEY, payload);
}

function loadState() {
  const savedState = window.localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return;
  }

  try {
    const parsedState = JSON.parse(savedState);
    state.players = Array.isArray(parsedState.players) ? parsedState.players : [];
    sortPlayersAlphabetically();
    state.settings = {
      ...state.settings,
      ...(parsedState.settings || {}),
    };
    state.feedback = {
      selectedPlayerId: parsedState.feedback?.selectedPlayerId || null,
      currentQuarter: parsedState.feedback?.currentQuarter || 1,
      byPlayerId: parsedState.feedback?.byPlayerId || {},
    };
    state.notepad = {
      currentQuarter: parsedState.feedback?.currentQuarter || parsedState.notepad?.currentQuarter || 1,
      byQuarter: parsedState.notepad?.byQuarter || {},
      reflection: parsedState.notepad?.reflection || "",
    };
    const loadedGameReviews = Array.isArray(parsedState.gameReviews)
      ? { items: parsedState.gameReviews }
      : (parsedState.gameReviews && typeof parsedState.gameReviews === "object"
        ? parsedState.gameReviews
        : {});
    const items = Array.isArray(loadedGameReviews.items)
      ? loadedGameReviews.items.map((review) => normalizeGameReviewItem(review))
      : [];
    let selectedReviewId = loadedGameReviews.selectedReviewId || null;
    let draft = normalizeGameReviewDraft(loadedGameReviews.draft);

    if (selectedReviewId && !items.some((review) => review.id === selectedReviewId)) {
      selectedReviewId = null;
    }

    if (!selectedReviewId && items.length) {
      const latestReview = items[items.length - 1];
      selectedReviewId = latestReview.id;
      if (isGameReviewDraftEmpty(draft)) {
        draft = cloneGameReviewDraft(latestReview);
      }
    }

    if (selectedReviewId && isGameReviewDraftEmpty(draft)) {
      const selectedReview = items.find((review) => review.id === selectedReviewId);
      if (selectedReview) {
        draft = cloneGameReviewDraft(selectedReview);
      }
    }

    state.gameReviews = {
      selectedReviewId,
      draft,
      items,
    };

    const loadedTrainingPlans = Array.isArray(parsedState.trainingPlans)
      ? { items: parsedState.trainingPlans }
      : (parsedState.trainingPlans && typeof parsedState.trainingPlans === "object"
        ? parsedState.trainingPlans
        : {});
    const trainingItems = Array.isArray(loadedTrainingPlans.items)
      ? loadedTrainingPlans.items.map((plan) => normalizeTrainingPlanItem(plan))
      : [];
    let selectedPlanId = loadedTrainingPlans.selectedPlanId || null;
    let trainingDraft = normalizeTrainingPlanDraft(loadedTrainingPlans.draft);

    if (selectedPlanId && !trainingItems.some((plan) => plan.id === selectedPlanId)) {
      selectedPlanId = null;
    }

    if (!selectedPlanId && trainingItems.length) {
      const latestPlan = trainingItems[trainingItems.length - 1];
      selectedPlanId = latestPlan.id;
      if (isTrainingPlanDraftEmpty(trainingDraft)) {
        trainingDraft = cloneTrainingPlanDraft(latestPlan);
      }
    }

    if (selectedPlanId && isTrainingPlanDraftEmpty(trainingDraft)) {
      const selectedPlan = trainingItems.find((plan) => plan.id === selectedPlanId);
      if (selectedPlan) {
        trainingDraft = cloneTrainingPlanDraft(selectedPlan);
      }
    }

    state.trainingPlans = {
      selectedPlanId,
      draft: trainingDraft,
      items: trainingItems,
    };

    const loadedWeeklyFocus = Array.isArray(parsedState.weeklyFocus)
      ? { items: parsedState.weeklyFocus }
      : (parsedState.weeklyFocus && typeof parsedState.weeklyFocus === "object"
        ? parsedState.weeklyFocus
        : {});
    const focusItems = Array.isArray(loadedWeeklyFocus.items)
      ? loadedWeeklyFocus.items.map((focus) => normalizeWeeklyFocusItem(focus))
      : [];
    let selectedFocusId = loadedWeeklyFocus.selectedFocusId || null;
    let focusDraft = normalizeWeeklyFocusDraft(loadedWeeklyFocus.draft);

    if (selectedFocusId && !focusItems.some((focus) => focus.id === selectedFocusId)) {
      selectedFocusId = null;
    }

    if (!selectedFocusId && focusItems.length) {
      const latestFocus = focusItems[focusItems.length - 1];
      selectedFocusId = latestFocus.id;
      if (isWeeklyFocusDraftEmpty(focusDraft)) {
        focusDraft = cloneWeeklyFocusDraft(latestFocus);
      }
    }

    if (selectedFocusId && isWeeklyFocusDraftEmpty(focusDraft)) {
      const selectedFocus = focusItems.find((focus) => focus.id === selectedFocusId);
      if (selectedFocus) {
        focusDraft = cloneWeeklyFocusDraft(selectedFocus);
      }
    }

    state.weeklyFocus = {
      selectedFocusId,
      draft: focusDraft,
      items: focusItems,
    };

    const loadedSeasonHub = Array.isArray(parsedState.seasonHub)
      ? { items: parsedState.seasonHub }
      : (parsedState.seasonHub && typeof parsedState.seasonHub === "object"
        ? parsedState.seasonHub
        : {});
    const hubItems = Array.isArray(loadedSeasonHub.items)
      ? loadedSeasonHub.items.map((hub) => normalizeSeasonHubItem(hub))
      : [];
    let selectedHubId = loadedSeasonHub.selectedHubId || null;
    let hubDraft = normalizeSeasonHubDraft(loadedSeasonHub.draft);

    if (selectedHubId && !hubItems.some((hub) => hub.id === selectedHubId)) {
      selectedHubId = null;
    }

    if (!selectedHubId && hubItems.length) {
      const latestHub = hubItems[hubItems.length - 1];
      selectedHubId = latestHub.id;
      if (isSeasonHubDraftEmpty(hubDraft)) {
        hubDraft = cloneSeasonHubDraft(latestHub);
      }
    }

    if (selectedHubId && isSeasonHubDraftEmpty(hubDraft)) {
      const selectedHub = hubItems.find((hub) => hub.id === selectedHubId);
      if (selectedHub) {
        hubDraft = cloneSeasonHubDraft(selectedHub);
      }
    }

    state.seasonHub = {
      selectedHubId,
      draft: hubDraft,
      items: hubItems,
    };

    const loadedPlayerNotes = Array.isArray(parsedState.playerNotes)
      ? { items: parsedState.playerNotes }
      : (parsedState.playerNotes && typeof parsedState.playerNotes === "object"
        ? parsedState.playerNotes
        : {});
    const noteItems = Array.isArray(loadedPlayerNotes.items)
      ? loadedPlayerNotes.items.map((note) => normalizePlayerNoteItem(note))
      : [];
    let selectedPlayerId = loadedPlayerNotes.selectedPlayerId || null;
    let playerNoteDraft = normalizePlayerNoteDraft(loadedPlayerNotes.draft);

    if (selectedPlayerId && !noteItems.some((note) => note.playerId === selectedPlayerId)) {
      selectedPlayerId = null;
    }

    if (!selectedPlayerId && noteItems.length) {
      const latestNote = noteItems[noteItems.length - 1];
      selectedPlayerId = latestNote.playerId;
      if (isPlayerNoteDraftEmpty(playerNoteDraft)) {
        playerNoteDraft = clonePlayerNoteDraft(latestNote);
      }
    }

    if (selectedPlayerId && isPlayerNoteDraftEmpty(playerNoteDraft)) {
      const selectedNote = noteItems.find((note) => note.playerId === selectedPlayerId);
      if (selectedNote) {
        playerNoteDraft = clonePlayerNoteDraft(selectedNote);
      }
    }

    state.playerNotes = {
      selectedPlayerId,
      draft: playerNoteDraft,
      items: noteItems,
    };

    if (seedTrainingPlanIfMissing()) {
      saveState();
    }
  } catch (error) {
    console.error("Could not load saved app data.", error);
  }
}

function sortPlayersAlphabetically() {
  state.players.sort((a, b) => {
    const aName = `${a?.name || ""}`.trim();
    const bName = `${b?.name || ""}`.trim();

    if (!aName && !bName) {
      return 0;
    }

    if (!aName) {
      return 1;
    }

    if (!bName) {
      return -1;
    }

    return aName.localeCompare(bName, undefined, { sensitivity: "base" });
  });
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return `${value}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
