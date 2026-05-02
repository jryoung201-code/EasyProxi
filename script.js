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
const MAX_DATA_MB = 500;
const UPTIME_START = Date.now();

let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let stats = {
  dataUsed: 0,
  requests: 0,
};

// Load the user stats from localStorage or initialize defaults.
function loadStats() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      stats = {
        dataUsed: parsed.dataUsed || 0,
        requests: parsed.requests || 0,
      };
    } catch (error) {
      stats = { dataUsed: 0, requests: 0 };
    }
  }
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// Generate and persist a simple mock API key.
function getOrCreateApiKey() {
  let key = localStorage.getItem(API_KEY_KEY);
  if (!key) {
    const randomSection = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    key = `EPX-${randomSection()}-${randomSection()}-${randomSection()}`;
    localStorage.setItem(API_KEY_KEY, key);
  }
  return key;
}

function formatDataUsage() {
  const used = stats.dataUsed.toFixed(1);
  return `${used} MB / ${MAX_DATA_MB} MB`;
}

function updateUI() {
  dataUsageEl.textContent = formatDataUsage();
  requestsServedEl.textContent = stats.requests;
  apiKeyEl.textContent = getOrCreateApiKey();
}

function updateUptime() {
  const elapsed = Date.now() - UPTIME_START;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  uptimeEl.textContent = [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
}

function addFakeUsage(url) {
  const baseUsage = 3.2;
  const extraUsage = Math.min(8, url.length * 0.12);
  stats.dataUsed = Math.min(MAX_DATA_MB, stats.dataUsed + baseUsage + extraUsage);
  stats.requests += 1;
  saveStats();
  updateUI();
}

function normalizeUrl(rawValue) {
  let value = rawValue.trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value;
}

proxyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const rawUrl = proxyUrlInput.value;
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return;

  const encoded = encodeURIComponent(normalized);
  addFakeUsage(normalized);

  // Simulate real proxy routing in the interface.
  window.location.href = `/proxy?url=${encoded}`;
});

resetButton.addEventListener('click', () => {
  stats = { dataUsed: 0, requests: 0 };
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(API_KEY_KEY);
  apiKeyEl.textContent = 'GENERATING...';
  updateUI();
});

// Dragging behavior for the overlay control panel.
overlayPanel.addEventListener('pointerdown', (event) => {
  isDragging = true;
  overlayPanel.setPointerCapture(event.pointerId);
  const rect = overlayPanel.getBoundingClientRect();
  dragOffset.x = event.clientX - rect.left;
  dragOffset.y = event.clientY - rect.top;
});

overlayPanel.addEventListener('pointermove', (event) => {
  if (!isDragging) return;
  const x = event.clientX - dragOffset.x;
  const y = event.clientY - dragOffset.y;
  overlayPanel.style.left = `${Math.max(12, Math.min(window.innerWidth - overlayPanel.offsetWidth - 12, x))}px`;
  overlayPanel.style.top = `${Math.max(12, Math.min(window.innerHeight - overlayPanel.offsetHeight - 12, y))}px`;
});

overlayPanel.addEventListener('pointerup', () => {
  isDragging = false;
});

overlayPanel.addEventListener('pointercancel', () => {
  isDragging = false;
});

// Keep the overlay panel visible after dragging starts.
overlayPanel.style.position = 'fixed';

// Initialize app state on load.
loadStats();
updateUI();
updateUptime();
setInterval(updateUptime, 1000);
