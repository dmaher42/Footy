const STORAGE_KEY = "footy-player-manager-state";
const FEEDBACK_CATEGORIES = [
  {
    id: "effort",
    label: "Effort",
    title: "Effort and Work Rate",
    icon: "💪",
    prompts: [
      "Ran all day and set the tone with repeat efforts.",
      "Kept turning up at contests and made the opposition work.",
      "Chased hard and never stopped competing."
    ]
  },
  {
    id: "teamplay",
    label: "Team Play",
    title: "Support and Team Play",
    icon: "🤝",
    prompts: [
      "Played team-first footy and made teammates better.",
      "Blocked and shepherded so others could break free.",
      "Worked hard to bring teammates into the game."
    ]
  },
  {
    id: "leadership",
    label: "Leadership",
    title: "Leadership and Voice",
    icon: "🗣",
    prompts: [
      "Used their voice all game and organised others well.",
      "Stayed calm under pressure and lifted the group.",
      "Led by example when we needed someone to step up."
    ]
  },
  {
    id: "defence",
    label: "Defence",
    title: "Defensive Effort",
    icon: "🛡",
    prompts: [
      "Shut down their opponent and played disciplined footy.",
      "Read the play well and helped us rebound smartly.",
      "Took strong defensive moments that stopped the opposition."
    ]
  },
  {
    id: "offence",
    label: "Offence",
    title: "Offensive Impact",
    icon: "⚡",
    prompts: [
      "Drove us forward and created attacking opportunities.",
      "Ran hard to provide an option and opened up the field.",
      "Used the ball well in attacking moments."
    ]
  },
  {
    id: "teamacts",
    label: "1%ers",
    title: "1%ers / Team First Acts",
    icon: "🧠",
    prompts: [
      "Did the little team-first things that win games.",
      "Showed courage and discipline in key moments.",
      "Put the team first with repeat one-percent efforts."
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
    byPlayerId: {},
  },
};

const elements = {
  updatePanel: document.querySelector("#update-panel"),
  updateTitle: document.querySelector("#update-title"),
  updateText: document.querySelector("#update-text"),
  checkUpdateBtn: document.querySelector("#check-update-btn"),
  applyUpdateBtn: document.querySelector("#apply-update-btn"),
  periodLabel: document.querySelector("#period-label"),
  periodCount: document.querySelector("#period-count"),
  playersOnField: document.querySelector("#players-on-field"),
  bulkInput: document.querySelector("#bulk-player-input"),
  addPlayersBtn: document.querySelector("#add-players-btn"),
  clearAllBtn: document.querySelector("#clear-all-btn"),
  editSetupBtn: document.querySelector("#edit-setup-btn"),
  editSetupInlineBtn: document.querySelector("#edit-setup-inline-btn"),
  closeSetupBtn: document.querySelector("#close-setup-btn"),
  generateCloseBtn: document.querySelector("#generate-close-btn"),
  generateBtn: document.querySelector("#generate-btn"),
  printBtn: document.querySelector("#print-btn"),
  setupBackdrop: document.querySelector("#setup-backdrop"),
  setupPanel: document.querySelector("#setup-panel"),
  copyFeedbackBtn: document.querySelector("#copy-feedback-btn"),
  copyReportBtn: document.querySelector("#copy-report-btn"),
  feedbackTracker: document.querySelector("#feedback-tracker"),
  postGameReport: document.querySelector("#post-game-report"),
  tableBody: document.querySelector("#player-table-body"),
  messages: document.querySelector("#messages"),
  rotationOutput: document.querySelector("#rotation-output"),
  playerRowTemplate: document.querySelector("#player-row-template"),
};

let currentRotationPlan = null;
let isSetupOpen = false;
let serviceWorkerRegistration = null;
let waitingServiceWorker = null;
let shouldReloadForUpdate = false;

registerServiceWorker();
loadState();
bindEvents();
render();

function bindEvents() {
  elements.addPlayersBtn.addEventListener("click", addPlayersFromBulkInput);
  elements.clearAllBtn.addEventListener("click", clearAllPlayers);
  elements.editSetupBtn.addEventListener("click", openSetupPanel);
  elements.editSetupInlineBtn.addEventListener("click", openSetupPanel);
  elements.closeSetupBtn.addEventListener("click", closeSetupPanel);
  elements.generateCloseBtn.addEventListener("click", refreshPlanAndCloseSetup);
  elements.generateBtn.addEventListener("click", refreshPlanAndCloseSetup);
  elements.printBtn.addEventListener("click", () => window.print());
  elements.setupBackdrop.addEventListener("click", closeSetupPanel);
  elements.checkUpdateBtn.addEventListener("click", checkForAppUpdate);
  elements.applyUpdateBtn.addEventListener("click", applyAppUpdate);
  elements.copyFeedbackBtn.addEventListener("click", copySelectedFeedbackSummary);
  elements.copyReportBtn.addEventListener("click", copyFullPostGameReport);

  elements.periodLabel.addEventListener("input", handleSettingsChange);
  elements.periodCount.addEventListener("input", handleSettingsChange);
  elements.playersOnField.addEventListener("input", handleSettingsChange);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSetupOpen) {
      closeSetupPanel();
    }
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    showUpdateState("Updates are not available in this browser.", false, false);
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
      serviceWorkerRegistration = registration;
      monitorServiceWorker(registration);

      if (registration.waiting) {
        waitingServiceWorker = registration.waiting;
        showUpdateState("A new version is ready. Tap Refresh App to load it.", true, true);
      } else {
        showUpdateState("Tap Check for Update to look for the latest version.", true, false);
      }
    }).catch((error) => {
      console.error("Could not register service worker.", error);
      showUpdateState("Could not set up app updates on this device.", false, false);
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

    showUpdateState("Downloading the latest app version...", false, false);

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed") {
        if (navigator.serviceWorker.controller) {
          waitingServiceWorker = registration.waiting || newWorker;
          showUpdateState("A new version is ready. Tap Refresh App to load it.", true, true);
        } else {
          showUpdateState("App is ready on this device.", true, false);
        }
      }
    });
  });
}

function checkForAppUpdate() {
  if (!serviceWorkerRegistration) {
    showUpdateState("Update checking is not ready yet. Try again in a moment.", true, false);
    return;
  }

  showUpdateState("Checking for the latest app version...", false, false);

  serviceWorkerRegistration.update().then(() => {
    if (serviceWorkerRegistration.waiting) {
      waitingServiceWorker = serviceWorkerRegistration.waiting;
      showUpdateState("A new version is ready. Tap Refresh App to load it.", true, true);
      return;
    }

    showUpdateState("You already have the latest version on this device.", true, false);
  }).catch((error) => {
    console.error("Could not check for app updates.", error);
    showUpdateState("Could not check for updates right now.", true, false);
  });
}

function applyAppUpdate() {
  if (!waitingServiceWorker) {
    showUpdateState("No app update is ready yet.", true, false);
    return;
  }

  showUpdateState("Refreshing to the newest version...", false, false);
  shouldReloadForUpdate = true;
  waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
}

function showUpdateState(message, showCheckButton, showApplyButton) {
  elements.updatePanel.hidden = false;
  elements.updateText.textContent = message;
  elements.checkUpdateBtn.hidden = !showCheckButton;
  elements.applyUpdateBtn.hidden = !showApplyButton;
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
    byPlayerId: {},
  };
  currentRotationPlan = null;
  saveState();
  render();
  showMessages([{ type: "info", text: "All players cleared." }]);
}

function render() {
  syncSettingsInputs();
  syncSetupPanel();
  syncSelectedFeedbackPlayer();
  renderPlayerTable();
  renderRotation();
  renderFeedbackTracker();
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
      ? 'The current setup cannot generate a valid rotation yet. Read the message above and adjust the player settings.'
      : 'Add players, then press <strong>Generate Rotation</strong>.';

    elements.rotationOutput.innerHTML = `<p class="placeholder">${placeholderText}</p>`;
    return;
  }

  const periodCards = rotationPlan.periods
    .map((period) => {
      const onFieldItems = period.onField.map(renderPlayerPill).join("");
      const benchItems = period.bench.length
        ? period.bench.map((player) => renderPlayerPill(player, true)).join("")
        : '<li class="muted">No bench this period.</li>';
      const onFieldOptions = period.onField
        .map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`)
        .join("");
      const benchOptions = period.bench
        .map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`)
        .join("");
      const swapControls = period.bench.length
        ? `
          <div class="swap-controls">
            <p class="swap-title"><strong>Manual Swap</strong></p>
            <div class="swap-grid">
              <label>
                Field Player
                <select class="swap-field-select" data-period-index="${period.index}">
                  ${onFieldOptions}
                </select>
              </label>
              <label>
                Bench Player
                <select class="swap-bench-select" data-period-index="${period.index}">
                  ${benchOptions}
                </select>
              </label>
            </div>
            <button class="swap-btn" type="button" data-period-index="${period.index}">Swap Players</button>
          </div>
        `
        : '<p class="muted">No bench players available to swap in this period.</p>';

      return `
        <article class="rotation-card">
          <h3>${escapeHtml(period.label)}</h3>
          <p><strong>On Field</strong></p>
          <ul class="pill-list">${onFieldItems}</ul>
          <p><strong>Bench</strong></p>
          <ul class="pill-list">${benchItems}</ul>
          ${swapControls}
        </article>
      `;
    })
    .join("");

  const summaryRows = rotationPlan.summary
    .map((player) => `
      <tr>
        <td>${escapeHtml(player.name)}</td>
        <td>${player.onFieldCount}/${rotationPlan.settings.periodCount}</td>
        <td>${player.benchCount}</td>
      </tr>
    `)
    .join("");

  elements.rotationOutput.innerHTML = `
    <div class="rotation-grid">${periodCards}</div>
    <article class="summary-card">
      <h3>Player Summary</h3>
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
  `;

  bindSwapButtons();
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

  const selectedPlayer = availablePlayers.find((player) => player.id === state.feedback.selectedPlayerId) || availablePlayers[0];
  state.feedback.selectedPlayerId = selectedPlayer.id;

  const selectedFeedback = getPlayerFeedback(selectedPlayer.id);
  const playerButtons = availablePlayers
    .map((player) => {
      const feedback = getPlayerFeedback(player.id);
      const totalMarks = getTotalFeedbackMarks(feedback);
      const activeClass = player.id === selectedPlayer.id ? "player-chip active" : "player-chip";
      return `
        <button class="${activeClass}" type="button" data-player-select="${player.id}">
          <span>${escapeHtml(player.name)}</span>
          <span class="player-chip-count">${totalMarks}</span>
        </button>
      `;
    })
    .join("");

  const categoryButtons = FEEDBACK_CATEGORIES
    .map((category) => `
      <button class="feedback-category-btn" type="button" data-category-id="${category.id}">
        <span>${category.icon} ${escapeHtml(category.title)}</span>
        <strong>${selectedFeedback.counts[category.id] || 0}</strong>
      </button>
    `)
    .join("");

  const notesList = selectedFeedback.notes.length
    ? selectedFeedback.notes
        .slice()
        .reverse()
        .map((note) => `<li>${escapeHtml(note)}</li>`)
        .join("")
    : '<li class="muted">No notes yet for this player.</li>';

  const summaryText = buildFeedbackSummary(selectedPlayer, selectedFeedback);
  const snapshotRows = availablePlayers
    .map((player) => {
      const feedback = getPlayerFeedback(player.id);
      return `
        <tr>
          <td>${escapeHtml(player.name)}</td>
          <td>${getTotalFeedbackMarks(feedback)}</td>
          <td>${feedback.notes.length}</td>
        </tr>
      `;
    })
    .join("");

  elements.feedbackTracker.innerHTML = `
    <div class="feedback-player-bar">${playerButtons}</div>
    <div class="feedback-grid">
      <article class="feedback-panel">
        <h3>${escapeHtml(selectedPlayer.name)}</h3>
        <p class="helper">Tap a category each time you notice it during the game.</p>
        <div class="feedback-category-grid">${categoryButtons}</div>
      </article>

      <article class="feedback-panel">
        <h3>Quick Note</h3>
        <label>
          Match Note
          <textarea id="feedback-note-input" rows="4" placeholder="Example: Strong chase in quarter 2 and set up a goal."></textarea>
        </label>
        <div class="inline-actions">
          <button id="add-feedback-note-btn" type="button">Add Note</button>
          <button id="clear-player-feedback-btn" type="button">Clear Player Feedback</button>
        </div>
        <ul class="feedback-note-list">${notesList}</ul>
      </article>
    </div>

    <article class="feedback-panel">
      <h3>Suggested Feedback For ${escapeHtml(selectedPlayer.name)}</h3>
      <p id="feedback-summary-text" class="feedback-summary-text">${escapeHtml(summaryText)}</p>
    </article>

    <article class="summary-card">
      <h3>Feedback Snapshot</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Marks</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${snapshotRows}</tbody>
      </table>
    </article>
  `;

  bindFeedbackTrackerEvents();
}

function bindFeedbackTrackerEvents() {
  elements.feedbackTracker.querySelectorAll("[data-player-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.feedback.selectedPlayerId = button.dataset.playerSelect;
      saveState();
      renderFeedbackTracker();
      renderPostGameReport();
    });
  });

  elements.feedbackTracker.querySelectorAll("[data-category-id]").forEach((button) => {
    button.addEventListener("click", () => {
      addFeedbackMark(button.dataset.categoryId);
    });
  });

  const addNoteButton = elements.feedbackTracker.querySelector("#add-feedback-note-btn");
  const clearFeedbackButton = elements.feedbackTracker.querySelector("#clear-player-feedback-btn");

  if (addNoteButton) {
    addNoteButton.addEventListener("click", addFeedbackNote);
  }

  if (clearFeedbackButton) {
    clearFeedbackButton.addEventListener("click", clearSelectedPlayerFeedback);
  }
}

function addFeedbackMark(categoryId) {
  const playerId = state.feedback.selectedPlayerId;
  if (!playerId) {
    return;
  }

  const feedback = getPlayerFeedback(playerId);
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

  const feedback = getPlayerFeedback(playerId);
  feedback.notes.push(note);
  noteInput.value = "";
  saveState();
  renderFeedbackTracker();
  renderPostGameReport();
}

function clearSelectedPlayerFeedback() {
  const playerId = state.feedback.selectedPlayerId;

  if (!playerId) {
    return;
  }

  const confirmed = window.confirm("Clear all feedback for this player?");
  if (!confirmed) {
    return;
  }

  state.feedback.byPlayerId[playerId] = createEmptyFeedbackRecord();
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

  const summary = buildFeedbackSummary(selectedPlayer, getPlayerFeedback(playerId));
  if (!navigator.clipboard || !summary) {
    return;
  }

  navigator.clipboard.writeText(summary).catch((error) => {
    console.error("Could not copy feedback summary.", error);
  });
}

function getPlayerFeedback(playerId) {
  if (!state.feedback.byPlayerId[playerId]) {
    state.feedback.byPlayerId[playerId] = createEmptyFeedbackRecord();
  }

  const feedback = state.feedback.byPlayerId[playerId];
  FEEDBACK_CATEGORIES.forEach((category) => {
    if (typeof feedback.counts[category.id] !== "number") {
      feedback.counts[category.id] = 0;
    }
  });

  if (!Array.isArray(feedback.notes)) {
    feedback.notes = [];
  }

  return feedback;
}

function createEmptyFeedbackRecord() {
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

function buildFeedbackSummary(player, feedback) {
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
    return `No feedback recorded yet for ${player.name}.`;
  }

  if (feedback.notes.length) {
    const noteSummary = feedback.notes.slice(-2).join(" ");
    summaryParts.push(`Match notes: ${noteSummary}`);
  }

  return `${player.name}: ${summaryParts.join(" ")}`;
}

function renderPostGameReport() {
  const reportEntries = buildPostGameReportEntries();

  if (!reportEntries.length) {
    elements.postGameReport.innerHTML = '<p class="placeholder">Track some player feedback during the game to build a post-game report.</p>';
    return;
  }

  const reportCards = reportEntries
    .map((entry) => `
      <article class="feedback-panel report-card">
        <div class="section-heading report-card-header">
          <div>
            <h3>${escapeHtml(entry.playerName)}</h3>
            <p class="helper">Marks: ${entry.totalMarks} | Notes: ${entry.noteCount}</p>
          </div>
          <button type="button" data-copy-player-report="${entry.playerId}">Copy</button>
        </div>
        <p class="feedback-summary-text">${escapeHtml(entry.summary)}</p>
      </article>
    `)
    .join("");

  elements.postGameReport.innerHTML = `<div class="report-grid">${reportCards}</div>`;

  elements.postGameReport.querySelectorAll("[data-copy-player-report]").forEach((button) => {
    button.addEventListener("click", () => {
      copyPlayerReport(button.dataset.copyPlayerReport);
    });
  });
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

function bindSwapButtons() {
  const swapButtons = elements.rotationOutput.querySelectorAll(".swap-btn");

  swapButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const periodIndex = Number.parseInt(button.dataset.periodIndex, 10);
      swapPlayersForPeriod(periodIndex);
    });
  });
}

function swapPlayersForPeriod(periodIndex) {
  if (!currentRotationPlan || !currentRotationPlan.periods.length) {
    return;
  }

  const fieldSelect = elements.rotationOutput.querySelector(`.swap-field-select[data-period-index="${periodIndex}"]`);
  const benchSelect = elements.rotationOutput.querySelector(`.swap-bench-select[data-period-index="${periodIndex}"]`);

  if (!fieldSelect || !benchSelect) {
    return;
  }

  const fieldPlayerId = fieldSelect.value;
  const benchPlayerId = benchSelect.value;

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
  renderRotation();
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

function showMessages(messages) {
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
    state.settings = {
      ...state.settings,
      ...(parsedState.settings || {}),
    };
    state.feedback = {
      selectedPlayerId: parsedState.feedback?.selectedPlayerId || null,
      byPlayerId: parsedState.feedback?.byPlayerId || {},
    };
  } catch (error) {
    console.error("Could not load saved app data.", error);
  }
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
