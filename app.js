// ── Morocco App — Messages & Easter Eggs ──────────────────────────────────
// Trip: April 8–19, 2026. Day 1 = outbound flight, Day 12 = return flight.
// ✏️ Edit messages in messages.json — fetched fresh every time, never cached.

const TRIP_START = new Date('2026-04-08T00:00:00'); // Day 1

// Loaded from messages.json at startup — populated before anything renders
let MESSAGES      = [];
let SECRET_MESSAGE = { title: '', message: '' };

async function loadMessages() {
  try {
    const res  = await fetch('messages.json?v=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();
    MESSAGES       = data.days;
    SECRET_MESSAGE = data.secret;
  } catch {
    // If fetch fails (offline with no prior load), MESSAGES stays empty
    // and the app shows locked cards gracefully
  }
}

// ── Date Helpers ──────────────────────────────────────────────────────────

function getTripDay() {
  // Dev preview: add ?day=5 to the URL to simulate any day without affecting the live app
  const params = new URLSearchParams(window.location.search);
  const preview = parseInt(params.get('day'), 10);
  if (!isNaN(preview) && preview >= 1 && preview <= 12) return preview;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(TRIP_START);
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return diff + 1; // Day 1 = trip start day
}

function formatDate(dayNumber) {
  const d = new Date(TRIP_START);
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// ── Message Detail Panel ──────────────────────────────────────────────────

function openMessagePanel(entry) {
  const photo = document.getElementById('message-panel-photo');
  photo.src   = 'photos/day' + entry.day + '.jpg';
  photo.alt   = 'Day ' + entry.day;
  photo.style.display = 'block';

  document.getElementById('message-panel-label').textContent = entry.label;
  document.getElementById('message-panel-date').textContent  = formatDate(entry.day);
  document.getElementById('message-panel-text').textContent  = entry.message;

  const songBtn = document.getElementById('message-panel-song');
  if (songBtn) {
    if (entry.song) {
      songBtn.href         = entry.song;
      songBtn.style.display = 'flex';
    } else {
      songBtn.style.display = 'none';
    }
  }

  const panel = document.getElementById('message-panel');
  panel.removeAttribute('aria-hidden');
  panel.classList.add('open');

  if (entry.final) launchConfetti();
}

function closeMessagePanel() {
  const panel = document.getElementById('message-panel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

// ── Build a day card using safe DOM methods ───────────────────────────────

function makeDayCard(entry, unlocked, currentDay) {
  const card = document.createElement('div');
  const isToday = entry.day === currentDay;

  let classes = 'day-card';
  if (unlocked && entry.final)        classes += ' final-day unlocked';
  else if (unlocked && entry.flight)  classes += ' flight-day unlocked';
  else if (unlocked)                  classes += ' unlocked';
  else                                classes += ' locked';
  card.className = classes;

  const label = document.createElement('div');
  label.className = 'day-label';
  label.textContent = entry.label;
  card.appendChild(label);

  if (unlocked) {
    const date = document.createElement('div');
    date.className = 'day-date';
    date.textContent = formatDate(entry.day);
    card.appendChild(date);

    const btn = document.createElement('button');
    if (isToday) {
      btn.className   = 'btn-unlock';
      btn.textContent = 'Unlock today\'s message';
    } else {
      btn.className   = 'btn-see-more';
      btn.textContent = 'See more →';
    }
    btn.addEventListener('click', () => openMessagePanel(entry));
    card.appendChild(btn);
  } else {
    const locked = document.createElement('div');
    locked.className = 'day-locked-text';
    locked.textContent = 'Unlocks on ' + formatDate(entry.day);
    card.appendChild(locked);
  }

  return card;
}

// ── Render Messages Tab ───────────────────────────────────────────────────

function renderMessages() {
  const currentDay = getTripDay();
  const container  = document.getElementById('messages-list');
  container.textContent = ''; // clear safely

  MESSAGES.forEach(entry => {
    const unlocked = entry.day <= currentDay;
    container.appendChild(makeDayCard(entry, unlocked, currentDay));
  });
}

// ── Tab Switching ─────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

// ── Easter Egg: Tap title 5x ──────────────────────────────────────────────

function initTitleEasterEgg() {
  let taps  = 0;
  let timer = null;

  document.getElementById('app-title').addEventListener('click', () => {
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, 2000);

    if (taps >= 5) {
      taps = 0;
      document.getElementById('secret-title').textContent   = SECRET_MESSAGE.title;
      document.getElementById('secret-message').textContent = SECRET_MESSAGE.message;
      document.getElementById('secret-overlay').classList.add('visible');
    }
  });
}

// ── Easter Egg: Long-press GB photo → couple photo overlay ───────────────

function initPhotoEasterEgg() {
  const photo = document.getElementById('gb-photo');
  let holdTimer = null;

  function startHold() {
    holdTimer = setTimeout(() => {
      document.getElementById('photo-overlay').classList.add('visible');
    }, 1800);
  }
  function cancelHold() { clearTimeout(holdTimer); }

  photo.addEventListener('touchstart', startHold,  { passive: true });
  photo.addEventListener('touchend',   cancelHold);
  photo.addEventListener('touchmove',  cancelHold);
  photo.addEventListener('mousedown',  startHold);
  photo.addEventListener('mouseup',    cancelHold);
  photo.addEventListener('mouseleave', cancelHold);
}

// ── Confetti (Day 12 final reveal) ────────────────────────────────────────

let confettiDone = false;

function launchConfetti() {
  if (confettiDone) return;
  confettiDone = true;

  const colors = ['#c9847a', '#f5c6c2', '#a8d5a2', '#87b8d4', '#f5e0a0', '#d4a0e0'];

  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const size  = 6 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      el.style.left              = (Math.random() * 100) + 'vw';
      el.style.top               = '-10px';
      el.style.background        = color;
      el.style.animationDuration = (1.8 + Math.random() * 1.5) + 's';
      el.style.width             = size + 'px';
      el.style.height            = size + 'px';
      el.style.borderRadius      = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }, i * 40);
  }
}

// ── Overlay Close ─────────────────────────────────────────────────────────

function initOverlays() {
  document.querySelectorAll('.overlay-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.overlay').classList.remove('visible');
    });
  });

  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('visible');
    });
  });
}

// ── Install Banner (iPhone Safari) ───────────────────────────────────────

function initInstallBanner() {
  const banner    = document.getElementById('install-banner');
  const SHOWN_KEY = 'install_banner_dismissed';

  const isMobile     = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone;
  const dismissed    = localStorage.getItem(SHOWN_KEY);

  if (isMobile && !isStandalone && !dismissed) {
    banner.classList.add('visible');
  }

  document.getElementById('banner-close').addEventListener('click', () => {
    banner.classList.remove('visible');
    localStorage.setItem(SHOWN_KEY, '1');
  });
}

// ── Weather ───────────────────────────────────────────────────────────────

const CITIES = {
  marrakech: { name: 'Marrakech',  tz: 'Africa/Casablanca',   label: 'time-marrakech', el: 'weather-marrakech' },
  sandiego:  { name: 'San Diego',  tz: 'America/Los_Angeles', label: 'time-sandiego',  el: 'weather-sandiego'  }
};

const WEATHER_CACHE_KEY = 'weather_cache_v1';
const CACHE_MAX_AGE_MS  = 3 * 60 * 60 * 1000; // refresh every 3 hours

function weatherIcon(desc) {
  const d = desc.toLowerCase();
  if (d.includes('thunder'))                    return '⛈️';
  if (d.includes('snow') || d.includes('bliz')) return '❄️';
  if (d.includes('sleet') || d.includes('ice')) return '🌨️';
  if (d.includes('heavy rain'))                 return '🌧️';
  if (d.includes('rain') || d.includes('driz')) return '🌦️';
  if (d.includes('fog')  || d.includes('mist')) return '🌫️';
  if (d.includes('overcast') || d.includes('cloudy')) return '☁️';
  if (d.includes('partly'))                     return '⛅';
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  return '🌡️';
}

async function fetchWeather(city) {
  const url  = `https://wttr.in/${encodeURIComponent(city.name)}?format=j1`;
  const res  = await fetch(url);
  const data = await res.json();
  const cur  = data.current_condition[0];
  return {
    temp: cur.temp_F,
    desc: cur.weatherDesc[0].value
  };
}

async function initWeather() {
  // Load from cache first so the UI isn't blank while fetching
  const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null');
  if (cached) renderWeather(cached);

  // Fetch fresh data if cache is missing or older than 3 hours
  const age = cached ? Date.now() - cached.fetchedAt : Infinity;
  if (age >= CACHE_MAX_AGE_MS) {
    try {
      const [mrk, sd] = await Promise.all([
        fetchWeather(CITIES.marrakech),
        fetchWeather(CITIES.sandiego)
      ]);
      const fresh = { marrakech: mrk, sandiego: sd, fetchedAt: Date.now() };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(fresh));
      renderWeather(fresh);
    } catch {
      // Network unavailable — cached data (if any) stays shown
    }
  }
}

function renderWeather(data) {
  for (const [key, city] of Object.entries(CITIES)) {
    const w    = data[key];
    const el   = document.getElementById(city.el);
    if (!el || !w) continue;
    el.querySelector('.weather-temp').textContent = weatherIcon(w.desc) + ' ' + w.temp + '°F';
  }
}

function updateTimes() {
  for (const city of Object.values(CITIES)) {
    const el = document.getElementById(city.label);
    if (!el) continue;
    el.textContent = new Date().toLocaleTimeString('en-US', {
      timeZone: city.tz,
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

// ── Countdown ─────────────────────────────────────────────────────────────

const TRIP_END = new Date('2026-04-19T00:00:00'); // Day 12, return flight

function renderCountdown() {
  const el = document.getElementById('countdown');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(TRIP_END);
  end.setHours(0, 0, 0, 0);

  // Check for ?day= preview override
  const params = new URLSearchParams(window.location.search);
  const previewDay = parseInt(params.get('day'), 10);
  let daysLeft;

  if (!isNaN(previewDay) && previewDay >= 1 && previewDay <= 12) {
    daysLeft = 12 - previewDay;
  } else {
    daysLeft = Math.floor((end - today) / (1000 * 60 * 60 * 24));
  }

  if (daysLeft > 1) {
    el.innerHTML = '<strong>' + daysLeft + ' days</strong> until you\'re home ♡';
  } else if (daysLeft === 1) {
    el.innerHTML = '<strong>1 day</strong> until you\'re home ♡';
  } else if (daysLeft === 0) {
    el.innerHTML = 'Home today ♡';
  } else {
    el.innerHTML = 'Welcome home ♡';
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initTitleEasterEgg();
  initPhotoEasterEgg();
  initOverlays();
  initInstallBanner();
  document.getElementById('message-back').addEventListener('click', closeMessagePanel);
  initWeather();
  updateTimes();
  setInterval(updateTimes, 30 * 1000); // refresh times every 30 seconds
  renderCountdown();
  await loadMessages(); // wait for fresh messages before rendering
  renderMessages();
  GB.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/for-maya/service-worker.js').catch(() => {});
  }
});
