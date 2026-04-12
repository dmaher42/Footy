const STORAGE_KEY = "footy-player-manager-state";
const APP_VERSION = "2026.04.11.12";
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
  renderRotation();
  renderFeedbackTracker();
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
  currentRotationPlan = buildRotationPlan();
  renderRotation();
  renderFeedbackTracker();
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
    rotation: elements.rotationSection,
    feedback: elements.feedbackSection,
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
