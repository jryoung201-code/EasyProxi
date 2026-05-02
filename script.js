const proxyForm = document.getElementById('proxyForm');
const proxyUrlInput = document.getElementById('proxyUrl');
const dataUsageEl = document.getElementById('dataUsage');
const requestsServedEl = document.getElementById('requestsServed');
const uptimeEl = document.getElementById('uptime');
const apiKeyEl = document.getElementById('apiKey');
const resetButton = document.getElementById('resetButton');
const overlayPanel = document.getElementById('overlayPanel');

const STORAGE_KEY = 'easyproxi-data';
const API_KEY_KEY = 'easyproxi-api-key';
const MAX_DATA_MB = 50;
const UPTIME_START = Date.now();

let dragOffset = { x: 0, y: 0 };
let isDragging = false;

let stats = {
  dataUsed: 0,
  requests: 0,
};

function loadStats() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      stats = {
        dataUsed: parsed.dataUsed || 0,
        requests: parsed.requests || 0,
      };
    } catch {
      stats = { dataUsed: 0, requests: 0 };
    }
  }
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function getOrCreateApiKey() {
  let key = localStorage.getItem(API_KEY_KEY);
  if (!key) {
    const rand = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    key = `EPX-${rand()}-${rand()}-${rand()}`;
    localStorage.setItem(API_KEY_KEY, key);
  }
  return key;
}

function formatDataUsage() {
  return `${stats.dataUsed.toFixed(1)} MB / ${MAX_DATA_MB} MB`;
}

function updateUI() {
  dataUsageEl.textContent = formatDataUsage();
  requestsServedEl.textContent = stats.requests;
  apiKeyEl.textContent = getOrCreateApiKey();
}

function updateUptime() {
  const elapsed = Date.now() - UPTIME_START;
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);

  uptimeEl.textContent = [h, m, s]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

function addFakeUsage(url) {
  const base = 3.2;
  const extra = Math.min(8, url.length * 0.12);

  stats.dataUsed = Math.min(MAX_DATA_MB, stats.dataUsed + base + extra);
  stats.requests += 1;

  saveStats();
  updateUI();
}

function normalizeUrl(raw) {
  let value = raw.trim();
  if (!value) return '';

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  return value;
}

// ✅ VERCEL ROUTE
proxyForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const raw = proxyUrlInput.value;
  const url = normalizeUrl(raw);
  if (!url) return;

  const encoded = encodeURIComponent(url);

  addFakeUsage(url);

  // 🔥 THIS WORKS WITH VERCEL
  window.location.href = `/api/proxy?url=${encoded}`;
});

resetButton.addEventListener('click', () => {
  stats = { dataUsed: 0, requests: 0 };
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(API_KEY_KEY);
  apiKeyEl.textContent = 'GENERATING...';
  updateUI();
});

// draggable overlay
overlayPanel.addEventListener('pointerdown', (e) => {
  isDragging = true;
  overlayPanel.setPointerCapture(e.pointerId);

  const rect = overlayPanel.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
});

overlayPanel.addEventListener('pointermove', (e) => {
  if (!isDragging) return;

  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;

  overlayPanel.style.left = `${Math.max(12, Math.min(window.innerWidth - overlayPanel.offsetWidth - 12, x))}px`;
  overlayPanel.style.top = `${Math.max(12, Math.min(window.innerHeight - overlayPanel.offsetHeight - 12, y))}px`;
});

overlayPanel.addEventListener('pointerup', () => {
  isDragging = false;
});

overlayPanel.addEventListener('pointercancel', () => {
  isDragging = false;
});

overlayPanel.style.position = 'fixed';

loadStats();
updateUI();
updateUptime();
setInterval(updateUptime, 1000);
