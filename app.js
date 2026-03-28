const STORAGE_KEY = "footy-player-manager-state";

const state = {
  players: [],
  settings: {
    periodLabel: "Quarter",
    periodCount: 4,
    playersOnField: 18,
  },
};

const elements = {
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
  tableBody: document.querySelector("#player-table-body"),
  messages: document.querySelector("#messages"),
  rotationOutput: document.querySelector("#rotation-output"),
  playerRowTemplate: document.querySelector("#player-row-template"),
};

let currentRotationPlan = null;
let isSetupOpen = false;

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
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Could not register service worker.", error);
    });
  });
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
  currentRotationPlan = null;
  saveState();
  render();
  showMessages([{ type: "info", text: "All players cleared." }]);
}

function render() {
  syncSettingsInputs();
  syncSetupPanel();
  renderPlayerTable();
  renderRotation();
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
      saveState();
      refreshPlanAndRender();
      renderPlayerTable();
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
