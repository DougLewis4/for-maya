// ── GB Tamagotchi Logic ────────────────────────────────────────────────────
// Stats are stored in localStorage so they persist between visits.
// Each time Maya opens the app, we calculate how many days have passed
// and decay stats accordingly — gentle enough for a trip, not punishing.

const GB_KEY = 'gb_state_v1';

const DECAY_PER_DAY = { hunger: 20, happiness: 15, energy: 10 };
const RESTORE_ENERGY_PER_NIGHT = 20; // energy slowly restores if she doesn't play

function defaultState() {
  return {
    hunger:    100,
    happiness: 100,
    energy:    100,
    lastSaved: Date.now(),
    fedToday:  false,
    playedToday: false,
    lastInteractionDay: todayKey()
  };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(GB_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  state.lastSaved = Date.now();
  localStorage.setItem(GB_KEY, JSON.stringify(state));
}

// Calculate days between two timestamps (whole days, rounded down)
function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor(Math.abs(b - a) / MS_PER_DAY);
}

function clamp(val) {
  return Math.max(0, Math.min(100, Math.round(val)));
}

// Apply time-based stat decay since last save
function applyDecay(state) {
  const days = daysBetween(state.lastSaved, Date.now());
  if (days === 0) return state;

  state.hunger    = clamp(state.hunger    - DECAY_PER_DAY.hunger    * days);
  state.happiness = clamp(state.happiness - DECAY_PER_DAY.happiness * days);
  // Energy recovers a bit overnight, but still decays if many days pass
  const netEnergyDecay = (DECAY_PER_DAY.energy - RESTORE_ENERGY_PER_NIGHT) * days;
  state.energy = clamp(state.energy - netEnergyDecay);

  // Reset daily actions if a new day has started
  const today = todayKey();
  if (state.lastInteractionDay !== today) {
    state.fedToday    = false;
    state.playedToday = false;
    state.lastInteractionDay = today;
  }

  return state;
}

function getMood(state) {
  const { hunger, happiness, energy } = state;
  const neglected = hunger < 25 && happiness < 25;
  if (neglected)    return { label: 'NEGLECTED', emoji: '😢', text: "GB really misses you... and dinner." };
  if (hunger < 40)  return { label: 'HUNGRY',    emoji: '🍼', text: "GB's tummy is rumbling..." };
  if (energy < 40)  return { label: 'TIRED',     emoji: '😴', text: "GB could use a little rest." };
  if (happiness < 40) return { label: 'SAD',     emoji: '🥺', text: "GB is missing some playtime." };
  if (hunger > 75 && happiness > 75 && energy > 75)
                    return { label: 'HAPPY',      emoji: '🌟', text: "GB is happy and loved!" };
  return              { label: 'OKAY',            emoji: '🤍', text: "GB is doing okay." };
}

// ── GB Module (exported via global object) ────────────────────────────────

window.GB = {
  state: null,

  init() {
    this.state = applyDecay(loadState());
    saveState(this.state);
    this.render();
  },

  feed() {
    if (this.state.fedToday) return;
    this.state.hunger    = clamp(this.state.hunger + 25);
    this.state.fedToday  = true;
    saveState(this.state);
    this.render();
    showFlash('🍼 +Hunger');
  },

  play() {
    if (this.state.playedToday) return;
    this.state.happiness  = clamp(this.state.happiness + 20);
    this.state.energy     = clamp(this.state.energy - 10);
    this.state.playedToday = true;
    saveState(this.state);
    this.render();
    showFlash('⭐ +Happy');
  },

  render() {
    const s = this.state;
    const mood = getMood(s);

    // Mood badge + text
    document.getElementById('gb-mood-badge').textContent = mood.emoji;
    document.getElementById('gb-mood-text').textContent  = mood.text;

    // Stat bars
    setBar('hunger',    s.hunger);
    setBar('happiness', s.happiness);
    setBar('energy',    s.energy);

    // Button states — can only feed/play once per day
    document.getElementById('btn-feed').disabled = s.fedToday;
    document.getElementById('btn-play').disabled = s.playedToday;

    // Last fed message
    const actions = [];
    if (s.fedToday)   actions.push('fed');
    if (s.playedToday) actions.push('played with');
    const msg = actions.length
      ? `You've already ${actions.join(' & ')} GB today ♡`
      : 'GB is waiting for you...';
    document.getElementById('gb-last-fed').textContent = msg;
  }
};

function setBar(name, value) {
  const fill = document.querySelector(`.stat-${name} .stat-bar-fill`);
  const pct  = document.querySelector(`.stat-${name} .stat-pct`);
  if (fill) fill.style.width = value + '%';
  if (pct)  pct.textContent  = value + '%';
}

function showFlash(text) {
  const el = document.getElementById('feed-flash');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 900);
}
