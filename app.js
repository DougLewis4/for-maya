// ── Morocco App — Messages & Easter Eggs ──────────────────────────────────
// Trip: April 8–19, 2026. Day 1 = outbound flight, Day 12 = return flight.

const TRIP_START = new Date('2026-04-08T00:00:00'); // Day 1

// ── ✏️ DOUG'S MESSAGES ────────────────────────────────────────────────────
// Fill in each message below. Placeholders marked with ✏️
// Days 1 and 12 are flight days. Day 12 is the big final reveal.

const MESSAGES = [
  {
    day: 1,
    flight: true,
    label: '✈️ Flight Day',
    message: '✏️ YOUR MESSAGE FOR DAY 1 (FLIGHT DAY — she\'s on her way!)'
  },
  {
    day: 2,
    label: 'Day 2',
    message: '✏️ YOUR MESSAGE FOR DAY 2'
  },
  {
    day: 3,
    label: 'Day 3',
    message: '✏️ YOUR MESSAGE FOR DAY 3'
  },
  {
    day: 4,
    label: 'Day 4',
    message: '✏️ YOUR MESSAGE FOR DAY 4'
  },
  {
    day: 5,
    label: 'Day 5',
    message: '✏️ YOUR MESSAGE FOR DAY 5'
  },
  {
    day: 6,
    label: 'Day 6',
    message: '✏️ YOUR MESSAGE FOR DAY 6'
  },
  {
    day: 7,
    label: 'Day 7',
    message: '✏️ YOUR MESSAGE FOR DAY 7'
  },
  {
    day: 8,
    label: 'Day 8',
    message: '✏️ YOUR MESSAGE FOR DAY 8'
  },
  {
    day: 9,
    label: 'Day 9',
    message: '✏️ YOUR MESSAGE FOR DAY 9'
  },
  {
    day: 10,
    label: 'Day 10',
    message: '✏️ YOUR MESSAGE FOR DAY 10'
  },
  {
    day: 11,
    label: 'Day 11',
    message: '✏️ YOUR MESSAGE FOR DAY 11'
  },
  {
    day: 12,
    flight: true,
    final: true,
    label: '✈️ Welcome Home',
    message: '✏️ YOUR FINAL DAY MESSAGE (she\'s on her way home!)'
  }
];

// ── ✏️ EASTER EGG: Secret message (tap title 5x) ────────────────────────
const SECRET_MESSAGE = {
  title:   '✏️ SECRET TITLE',
  message: '✏️ YOUR HIDDEN MESSAGE (shown when Maya taps the title 5 times)'
};

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
  document.getElementById('message-panel-label').textContent = entry.label;
  document.getElementById('message-panel-date').textContent  = formatDate(entry.day);
  document.getElementById('message-panel-text').textContent  = entry.message;

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

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTitleEasterEgg();
  initPhotoEasterEgg();
  initOverlays();
  initInstallBanner();
  document.getElementById('message-back').addEventListener('click', closeMessagePanel);
  renderCountdown();
  renderMessages();
  GB.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
});
