(function applyTrainingPlanPatch() {
  const STORAGE_KEY = "footy-player-manager-state";
  const CANONICAL_ID = "seed-training-plan-kicking-leading-patterns";
  const CANONICAL_TITLE = "Kicking and Leading Patterns";
  const LEGACY_TITLES = new Set([CANONICAL_TITLE]);

  const createSeedPlan = (timestamp) => ({
    id: CANONICAL_ID,
    title: CANONICAL_TITLE,
    date: "Planned",
    sessionPurpose: "Clean kicking and clearer leading patterns",
    expectedNumbers: "U14 Nairne",
    duration: "60 minutes",
    warmUp: [
      "5:00-5:10 Partner kick progression",
      "No step kick, 1 step kick, 3-5 step kick",
    ].join("\n"),
    fundamentals: [
      "5:10-5:18 W drill",
      "Kick to shape, lead timing, face forward immediately",
      "5:18-5:28 HB 2v1 down the line",
      "Support run, draw and release, run to receive",
    ].join("\n"),
    mainDrills: [
      "5:28-5:43 Large oval leading drill",
      "Where to lead, how to lead, how to kick to the lead",
    ].join("\n"),
    gamePlayConditionedGame: [
      "5:43-5:58 CHB to forward transition drill",
      "Transition ball movement, forward entry, finish with shot on goal",
    ].join("\n"),
    coachingCues: [
      "Take your time",
      "Lead hard and direct",
      "One leads, one holds",
      "Kick to the run",
      "Face forward immediately",
      "Run to receive",
    ].join("\n"),
    notesReviewNextTime: [
      "Notebook: Training Planning",
      "Team: U14 Nairne",
      "Focus areas: kicking execution, leading patterns, support run, forward transition",
      "Session blocks:",
      "- 5:00-5:10 Partner kick progression",
      "- 5:10-5:18 W drill",
      "- 5:18-5:28 HB 2v1 down the line",
      "- 5:28-5:43 Large oval leading drill",
      "- 5:43-5:58 CHB to forward transition drill",
    ].join("\n"),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();
    const trainingPlans = parsed.trainingPlans && typeof parsed.trainingPlans === "object"
      ? parsed.trainingPlans
      : {};

    const items = Array.isArray(trainingPlans.items) ? trainingPlans.items : [];
    const existingIndex = items.findIndex((plan) => {
      const title = `${plan && plan.title ? plan.title : ""}`.trim();
      return plan && (plan.id === CANONICAL_ID || LEGACY_TITLES.has(title));
    });

    const seedPlan = createSeedPlan(now);

    if (existingIndex >= 0) {
      const existingPlan = items[existingIndex] || {};
      items[existingIndex] = {
        ...existingPlan,
        ...seedPlan,
        id: existingPlan.id || CANONICAL_ID,
        createdAt: existingPlan.createdAt || now,
        updatedAt: now,
      };
      trainingPlans.selectedPlanId = items[existingIndex].id;
      trainingPlans.draft = {
        title: items[existingIndex].title,
        date: items[existingIndex].date,
        sessionPurpose: items[existingIndex].sessionPurpose,
        expectedNumbers: items[existingIndex].expectedNumbers,
        duration: items[existingIndex].duration,
        warmUp: items[existingIndex].warmUp,
        fundamentals: items[existingIndex].fundamentals,
        mainDrills: items[existingIndex].mainDrills,
        gamePlayConditionedGame: items[existingIndex].gamePlayConditionedGame,
        coachingCues: items[existingIndex].coachingCues,
        notesReviewNextTime: items[existingIndex].notesReviewNextTime,
      };
    } else {
      items.push(seedPlan);
      trainingPlans.selectedPlanId = seedPlan.id;
      trainingPlans.draft = {
        title: seedPlan.title,
        date: seedPlan.date,
        sessionPurpose: seedPlan.sessionPurpose,
        expectedNumbers: seedPlan.expectedNumbers,
        duration: seedPlan.duration,
        warmUp: seedPlan.warmUp,
        fundamentals: seedPlan.fundamentals,
        mainDrills: seedPlan.mainDrills,
        gamePlayConditionedGame: seedPlan.gamePlayConditionedGame,
        coachingCues: seedPlan.coachingCues,
        notesReviewNextTime: seedPlan.notesReviewNextTime,
      };
    }

    trainingPlans.items = items;
    parsed.trainingPlans = trainingPlans;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error("Could not apply training plan patch.", error);
  }
})();
