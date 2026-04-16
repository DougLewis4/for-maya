// ── GB Tamagotchi Logic ────────────────────────────────────────────────────
// Stats decay every hour. Maya can feed/play anytime — no cooldown.

const GB_KEY = 'gb_state_v1';

// How much each stat drops per hour
const DECAY_PER_HOUR = { hunger: 4, happiness: 3 };

// Energy slowly refills on its own (she "rests"); playing costs energy
const ENERGY_RESTORE_PER_HOUR = 1;
const PLAY_ENERGY_COST = 15;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function defaultState() {
  return {
    hunger:        100,
    happiness:     100,
    energy:        100,
    lastSaved:     Date.now(),
    feedCountToday: 0,
    playCountToday: 0,
    countDay:      todayKey()
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

  // Reset daily counters and restore energy if it's a new day (GB slept!)
  const today = todayKey();
  if (state.countDay !== today) {
    state.feedCountToday = 0;
    state.playCountToday = 0;
    state.energy  = 100;
    state.countDay = today;
  }

  if (hours < 0.05) return state; // less than 3 minutes — skip decay

  state.hunger    = clamp(state.hunger    - DECAY_PER_HOUR.hunger    * hours);
  state.happiness = clamp(state.happiness - DECAY_PER_HOUR.happiness * hours);

  return state;
}

function getMood(state) {
  const { hunger, happiness, energy, feedCountToday = 0, playCountToday = 0 } = state;

  // Over-fed or over-played today — playful complaints
  if (feedCountToday > 3) return { label: 'STUFFED',  emoji: '🤤', text: "Hey, you're going to make me chubby!" };
  if (playCountToday > 3) return { label: 'TIRED',    emoji: '😴', text: "GB needs a break to get some beauty rest." };

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

    // Re-render every minute so stats stay current
    setInterval(() => {
      this.state = applyDecay(loadState());
      saveState(this.state);
      this.render();
    }, 60 * 1000);
  },

  feed() {
    this.state.hunger = clamp(this.state.hunger + 35);
    this.state.feedCountToday = (this.state.feedCountToday || 0) + 1;
    saveState(this.state);
    this.render();
    playFeedVideo();
  },

  play() {
    this.state.happiness = clamp(this.state.happiness + 25);
    this.state.energy    = clamp(this.state.energy - PLAY_ENERGY_COST);
    this.state.playCountToday = (this.state.playCountToday || 0) + 1;
    saveState(this.state);
    this.render();
    playDanceVideo();
  },

  render() {
    const s    = this.state;
    const mood = getMood(s);

    document.getElementById('gb-mood-badge').textContent = mood.emoji;
    document.getElementById('gb-mood-text').textContent  = mood.text;

    setBar('hunger',    s.hunger);
    setBar('happiness', s.happiness);
    setBar('energy',    s.energy);

    document.getElementById('btn-feed').textContent = '🍼 Feed GB';
    document.getElementById('btn-play').textContent = '⭐ Play';
    document.getElementById('gb-last-fed').textContent = 'Tap to feed or play with GB ♡';
  }
};

const BAR_COLORS = {
  hunger:    '#e8a87c',
  happiness: '#a8d5a2',
  energy:    '#87b8d4'
};

function setBar(name, value) {
  const fill = document.querySelector(`.stat-${name} .stat-bar-fill`);
  const pct  = document.querySelector(`.stat-${name} .stat-pct`);
  if (fill) {
    fill.style.width      = value + '%';
    fill.style.background = BAR_COLORS[name];
  }
  if (pct) pct.textContent = value + '%';
}

function playFeedVideo() {
  const overlay = document.getElementById('feed-video-overlay');
  const video   = document.getElementById('gb-feed-video');

  overlay.classList.add('visible');
  video.currentTime = 0;
  video.play();

  // Auto-dismiss when video finishes, then trigger animations
  video.addEventListener('ended', () => {
    overlay.classList.remove('visible');
    video.pause();
    animateGB('anim-bounce');
    spawnParticles(['🍓', '🍓', '🍓', '🍓', '🍓']);
  }, { once: true });

  // Tapping the dark backdrop skips the video
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
      video.pause();
      animateGB('anim-bounce');
      spawnParticles(['🍓', '🍓', '🍓', '🍓', '🍓']);
    }
  }, { once: true });
}

function playDanceVideo() {
  const overlay = document.getElementById('play-video-overlay');
  const video   = document.getElementById('gb-play-video');

  overlay.classList.add('visible');
  video.currentTime = 0;
  video.play();

  video.addEventListener('ended', () => {
    overlay.classList.remove('visible');
    video.pause();
    animateGB('anim-wiggle');
    spawnParticles(['⭐', '🤍', '✨', '⭐', '🤍']);
  }, { once: true });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
      video.pause();
      animateGB('anim-wiggle');
      spawnParticles(['⭐', '🤍', '✨', '⭐', '🤍']);
    }
  }, { once: true });
}

// Animate the GB photo with a named class, then remove it so it can replay
function animateGB(animClass) {
  const photo = document.getElementById('gb-photo');
  photo.classList.remove('anim-bounce', 'anim-wiggle');
  void photo.offsetWidth; // force reflow so the animation restarts cleanly
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
      const dx = (Math.random() - 0.5) * 70;
      el.style.setProperty('--dx', dx + 'px');
      el.style.left = (cx + dx * 0.2) + 'px';
      el.style.top  = cy + 'px';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, i * 80);
  });
}
