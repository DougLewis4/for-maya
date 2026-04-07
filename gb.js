// ── GB Tamagotchi Logic ────────────────────────────────────────────────────
// Stats decay every hour. Maya can feed/play every 5 hours.
// Skipping one session causes a slow decline; skipping two causes warning states.

const GB_KEY = 'gb_state_v1';

// How much each stat drops per hour
const DECAY_PER_HOUR = { hunger: 4, happiness: 3 };

// Energy slowly refills on its own (she "rests"); playing costs energy
const ENERGY_RESTORE_PER_HOUR = 1;
const PLAY_ENERGY_COST = 15;

// How long Maya must wait before she can feed/play again
const FEED_COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 hours
const PLAY_COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 hours

function defaultState() {
  return {
    hunger:      100,
    happiness:   100,
    energy:      100,
    lastSaved:   Date.now(),
    lastFedAt:   null,
    lastPlayedAt: null
  };
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

function hoursBetween(a, b) {
  return Math.abs(b - a) / (1000 * 60 * 60);
}

function clamp(val) {
  return Math.max(0, Math.min(100, Math.round(val)));
}

// Apply time-based stat changes since the last save
function applyDecay(state) {
  const hours = hoursBetween(state.lastSaved, Date.now());
  if (hours < 0.05) return state; // less than 3 minutes — skip

  state.hunger    = clamp(state.hunger    - DECAY_PER_HOUR.hunger    * hours);
  state.happiness = clamp(state.happiness - DECAY_PER_HOUR.happiness * hours);

  // Energy refills passively (rest/sleep), capped at 100
  state.energy = clamp(state.energy + ENERGY_RESTORE_PER_HOUR * hours);

  return state;
}

function canFeed(state) {
  if (!state.lastFedAt) return true;
  return Date.now() - state.lastFedAt >= FEED_COOLDOWN_MS;
}

function canPlay(state) {
  if (!state.lastPlayedAt) return true;
  return Date.now() - state.lastPlayedAt >= PLAY_COOLDOWN_MS;
}

// Returns a human-readable "ready in X hrs Y mins" string
function cooldownRemaining(lastActionAt, cooldownMs) {
  const remaining = cooldownMs - (Date.now() - lastActionAt);
  if (remaining <= 0) return null;
  const hrs  = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getMood(state) {
  const { hunger, happiness, energy } = state;
  const neglected = hunger < 25 && happiness < 25;
  if (neglected)      return { label: 'NEGLECTED', emoji: '😢', text: "GB really misses you... and dinner." };
  if (hunger < 30)    return { label: 'HUNGRY',    emoji: '🍼', text: "GB's tummy is rumbling..." };
  if (energy < 25)    return { label: 'TIRED',     emoji: '😴', text: "GB could use a little rest." };
  if (happiness < 30) return { label: 'SAD',       emoji: '🥺', text: "GB is missing some playtime." };
  if (hunger > 75 && happiness > 75 && energy > 60)
                      return { label: 'HAPPY',     emoji: '🌟', text: "GB is happy and loved!" };
  return                { label: 'OKAY',           emoji: '🤍', text: "GB is doing okay." };
}

// ── GB Module ─────────────────────────────────────────────────────────────

window.GB = {
  state: null,

  init() {
    this.state = applyDecay(loadState());
    saveState(this.state);
    this.render();

    // Re-render every minute so cooldown timers stay accurate
    setInterval(() => {
      this.state = applyDecay(loadState());
      saveState(this.state);
      this.render();
    }, 60 * 1000);
  },

  feed() {
    if (!canFeed(this.state)) return;
    this.state.hunger    = clamp(this.state.hunger + 35);
    this.state.lastFedAt = Date.now();
    saveState(this.state);
    this.render();
    playFeedVideo();
  },

  play() {
    if (!canPlay(this.state)) return;
    this.state.happiness  = clamp(this.state.happiness + 25);
    this.state.energy     = clamp(this.state.energy - PLAY_ENERGY_COST);
    this.state.lastPlayedAt = Date.now();
    saveState(this.state);
    this.render();
    animateGB('anim-wiggle');
    spawnParticles(['⭐', '🤍', '✨', '⭐', '🤍']);
  },

  render() {
    const s    = this.state;
    const mood = getMood(s);

    document.getElementById('gb-mood-badge').textContent = mood.emoji;
    document.getElementById('gb-mood-text').textContent  = mood.text;

    setBar('hunger',    s.hunger);
    setBar('happiness', s.happiness);
    setBar('energy',    s.energy);

    // Feed button: disabled + shows countdown while on cooldown
    const feedBtn  = document.getElementById('btn-feed');
    const feedReady = canFeed(s);
    feedBtn.disabled = !feedReady;
    feedBtn.textContent = feedReady
      ? '🍼 Feed GB'
      : '🍼 ' + cooldownRemaining(s.lastFedAt, FEED_COOLDOWN_MS);

    // Play button: disabled + shows countdown while on cooldown
    const playBtn  = document.getElementById('btn-play');
    const playReady = canPlay(s);
    playBtn.disabled = !playReady;
    playBtn.textContent = playReady
      ? '⭐ Play'
      : '⭐ ' + cooldownRemaining(s.lastPlayedAt, PLAY_COOLDOWN_MS);

    // Status line
    const parts = [];
    if (!feedReady) parts.push('fed');
    if (!playReady) parts.push('played');
    const statusEl = document.getElementById('gb-last-fed');
    statusEl.textContent = parts.length
      ? `Recently ${parts.join(' & ')} GB ♡`
      : 'GB needs attention!';
  }
};

function setBar(name, value) {
  const fill = document.querySelector(`.stat-${name} .stat-bar-fill`);
  const pct  = document.querySelector(`.stat-${name} .stat-pct`);
  if (fill) fill.style.width = value + '%';
  if (pct)  pct.textContent  = value + '%';
}

function playFeedVideo() {
  const overlay = document.getElementById('feed-video-overlay');
  const video   = document.getElementById('gb-feed-video');

  overlay.classList.add('visible');
  video.currentTime = 0;
  video.play();

  // Auto-dismiss when video finishes, then trigger the fun animations
  video.addEventListener('ended', () => {
    overlay.classList.remove('visible');
    video.pause();
    animateGB('anim-bounce');
    spawnParticles(['🍓', '🍓', '🍓', '🍓', '🍓']);
  }, { once: true });

  // Also allow tapping the backdrop to skip
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
      video.pause();
      animateGB('anim-bounce');
      spawnParticles(['🍓', '🍓', '🍓', '🍓', '🍓']);
    }
  }, { once: true });
}

function showFlash(text) {
  const el = document.getElementById('feed-flash');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 900);
}

// Animate the GB photo with a named class, then remove it so it can replay
function animateGB(animClass) {
  const photo = document.getElementById('gb-photo');
  photo.classList.remove('anim-bounce', 'anim-wiggle');
  // Force reflow so removing + re-adding the class restarts the animation
  void photo.offsetWidth;
  photo.classList.add(animClass);
  photo.addEventListener('animationend', () => photo.classList.remove(animClass), { once: true });
}

// Spawn emoji particles floating up from GB's photo position
function spawnParticles(emojis) {
  const photo = document.getElementById('gb-photo');
  const rect  = photo.getBoundingClientRect();
  const cx    = rect.left + rect.width  / 2;
  const cy    = rect.top  + rect.height / 2;

  emojis.forEach((emoji, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className   = 'gb-particle';
      el.textContent = emoji;
      // Random horizontal drift so particles fan out
      const dx = (Math.random() - 0.5) * 70;
      el.style.setProperty('--dx', dx + 'px');
      el.style.left = (cx + dx * 0.2) + 'px';
      el.style.top  = cy + 'px';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, i * 80);
  });
}
