// Configuration constants
const STORAGE_KEY = 'easyproxi-data';
const API_KEY_KEY = 'easyproxi-api-key';
const MAX_DATA_MB = 100;
const UPTIME_START = Date.now();
const SERVER_URL = 'https://easyproxi-server.onrender.com';

// Global state
let stats = {
  dataUsed: 0,
  requests: 0,
};

let history = [];
let historyIndex = -1;

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
  const dataUsageEl = document.getElementById('dataUsage');
  const requestsServedEl = document.getElementById('requestsServed');
  const apiKeyEl = document.getElementById('apiKey');
  
  if (dataUsageEl) dataUsageEl.textContent = formatDataUsage();
  if (requestsServedEl) requestsServedEl.textContent = stats.requests;
  if (apiKeyEl) apiKeyEl.textContent = getOrCreateApiKey();
}

function updateUptime() {
  const uptimeEl = document.getElementById('uptime');
  if (!uptimeEl) return;
  
  const elapsed = Date.now() - UPTIME_START;
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);

  uptimeEl.textContent = [h, m, s]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

async function trackUsage(url) {
  const base = 3.2;
  const extra = Math.min(8, url.length * 0.12);
  const dataUsed = base + extra;

  stats.dataUsed = Math.min(MAX_DATA_MB, stats.dataUsed + dataUsed);
  stats.requests += 1;

  saveStats();
  updateUI();

  // Send usage to server
  try {
    await fetch(`${SERVER_URL}/api/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getOrCreateApiKey(),
      },
      body: JSON.stringify({ dataUsed, requests: 1 }),
    });
  } catch (err) {
    console.warn('Could not track usage on server:', err.message);
  }
}

function normalizeUrl(raw) {
  let value = raw.trim();
  if (!value) return '';

  // If it looks like a search term (no dots or protocol), search Google
  if (!/\./.test(value) && !/^https?:\/\//i.test(value)) {
    return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  }

  // Add https if no protocol
  if (!/^https?:\/\//.test(value)) {
    value = `https://${value}`;
  }

  return value;
}

// Initialize draggable overlay panel (works on all pages)
function initDraggableOverlay() {
  const panel = document.getElementById('overlayPanel');
  if (!panel) return;

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  panel.addEventListener('pointerdown', (e) => {
    isDragging = true;
    panel.setPointerCapture(e.pointerId);

    const rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
  });

  panel.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    panel.style.left = `${Math.max(12, Math.min(window.innerWidth - panel.offsetWidth - 12, x))}px`;
    panel.style.top = `${Math.max(12, Math.min(window.innerHeight - panel.offsetHeight - 12, y))}px`;
  });

  panel.addEventListener('pointerup', () => {
    isDragging = false;
  });

  panel.addEventListener('pointercancel', () => {
    isDragging = false;
  });

  panel.style.position = 'fixed';
}

// Wait for DOM to load, then initialize based on page context
document.addEventListener('DOMContentLoaded', () => {
  // Browser UI page (browser.html)
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const browserFrame = document.getElementById('browserFrame');
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const reloadBtn = document.getElementById('reloadBtn');

  // Landing page (index.html)
  const proxyForm = document.getElementById('proxyForm');
  const proxyUrlInput = document.getElementById('proxyUrl');

  // Stats elements (on all pages with overlay)
  const dataUsageEl = document.getElementById('dataUsage');
  const requestsServedEl = document.getElementById('requestsServed');
  const uptimeEl = document.getElementById('uptime');
  const apiKeyEl = document.getElementById('apiKey');
  const resetButton = document.getElementById('resetButton');

  // Initialize draggable overlay
  initDraggableOverlay();

  // Only setup browser page if we're on browser.html
  if (urlForm && urlInput && browserFrame) {
    // Navigation buttons
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          const url = history[historyIndex];
          urlInput.value = url;
          browserFrame.src = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(url)}`;
        }
      });
    }

    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => {
        if (history.length > 0 && historyIndex < history.length - 1) {
          historyIndex++;
          const url = history[historyIndex];
          urlInput.value = url;
          browserFrame.src = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(url)}`;
        }
      });
    }

    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        if (browserFrame.src) {
          browserFrame.src = browserFrame.src;
        }
      });
    }

    // Form submission
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const normalized = normalizeUrl(urlInput.value);
      if (!normalized) return;

      urlInput.value = normalized;
      browserFrame.src = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(normalized)}`;
      trackUsage(normalized);

      // Add to history
      history = history.slice(0, historyIndex + 1);
      history.push(normalized);
      historyIndex = history.length - 1;
    });
  }

  // Only setup landing page if we're on index.html
  if (proxyForm && proxyUrlInput) {
    proxyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = normalizeUrl(proxyUrlInput.value);
      if (!url) return;

      const encoded = encodeURIComponent(url);
      trackUsage(url);
      window.location.href = `${SERVER_URL}/api/proxy?url=${encoded}`;
    });
  }

  // Reset button (on pages with overlay and stats)
  if (resetButton && dataUsageEl) {
    resetButton.addEventListener('click', () => {
      stats = { dataUsed: 0, requests: 0 };
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(API_KEY_KEY);
      if (apiKeyEl) apiKeyEl.textContent = 'GENERATING...';
      updateUI();
      if (browserFrame) {
        browserFrame.src = '';
        urlInput.value = '';
        history = [];
        historyIndex = -1;
      }
    });
  }

  // Initialize stats and uptime (on pages with stats elements)
  if (dataUsageEl && requestsServedEl && uptimeEl && apiKeyEl) {
    loadStats();
    updateUI();
    updateUptime();
    setInterval(updateUptime, 1000);
  }
});
