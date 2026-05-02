// Configuration constants
const STORAGE_KEY = 'easyproxi-data';
const API_KEY_KEY = 'easyproxi-api-key';
const MAX_DATA_MB = 500;
const UPTIME_START = Date.now();
const SERVER_URL = 'https://server.easyproxi.online';

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
  return `${stats.dataUsed.toFixed(2)} MB / ${MAX_DATA_MB} MB`;
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

// Measure real data usage by fetching the URL and checking response size
async function trackRealUsage(url) {
  stats.requests += 1;

  try {
    const response = await fetch(`${SERVER_URL}/api/proxy?url=${encodeURIComponent(url)}`, {
      headers: { 'x-api-key': getOrCreateApiKey() },
    });

    const text = await response.text();
    const bytes = new TextEncoder().encode(text).length;
    const mb = bytes / (1024 * 1024);
    stats.dataUsed = Math.min(MAX_DATA_MB, stats.dataUsed + mb);
  } catch {
    // Fallback estimate if fetch fails
    const estimatedMB = 0.05 + Math.min(0.5, url.length * 0.001);
    stats.dataUsed = Math.min(MAX_DATA_MB, stats.dataUsed + estimatedMB);
  }

  saveStats();
  updateUI();

  // Report to server
  try {
    await fetch(`${SERVER_URL}/api/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getOrCreateApiKey(),
      },
      body: JSON.stringify({ dataUsed: stats.dataUsed, requests: stats.requests }),
    });
  } catch {
    // Silent fail — server may be sleeping
  }
}

function normalizeUrl(raw) {
  let value = raw.trim();
  if (!value) return '';

  if (!/\./.test(value) && !/^https?:\/\//i.test(value)) {
    return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  }

  if (!/^https?:\/\//.test(value)) {
    value = `https://${value}`;
  }

  return value;
}

// Inject the overlay panel HTML if it doesn't already exist on the page
function injectOverlayPanel() {
  if (document.getElementById('overlayPanel')) return;

  const panel = document.createElement('div');
  panel.className = 'overlay-panel';
  panel.id = 'overlayPanel';
  panel.innerHTML = `
    <div class="overlay-header">
      <span>Control Panel</span>
      <span class="drag-hint">drag</span>
    </div>
    <div class="overlay-content">
      <div class="stat-row"><span>Data Usage</span><strong id="dataUsage">0.00 MB / ${MAX_DATA_MB} MB</strong></div>
      <div class="stat-row"><span>Requests Served</span><strong id="requestsServed">0</strong></div>
      <div class="stat-row"><span>Uptime</span><strong id="uptime">00:00:00</strong></div>
      <div class="stat-row"><span>API Key</span><strong id="apiKey">GENERATING...</strong></div>
    </div>
    <div class="overlay-footer">
      <button type="button" id="resetButton">Reset Session</button>
    </div>
  `;

  // Inject styles if this is a proxied/external page with no EasyProxi stylesheet
  if (!document.querySelector('link[href*="style.css"]')) {
    const style = document.createElement('style');
    style.textContent = `
      #overlayPanel {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: min(340px, calc(100vw - 40px)) !important;
        border-radius: 26px !important;
        background: rgba(20, 25, 40, 0.95) !important;
        border: 1px solid rgba(45, 196, 255, 0.18) !important;
        box-shadow: 0 32px 80px rgba(19, 97, 200, 0.18) !important;
        backdrop-filter: blur(24px) !important;
        z-index: 2147483647 !important;
        cursor: grab !important;
        user-select: none !important;
        font-family: 'Inter', system-ui, sans-serif !important;
        color: #e7f2ff !important;
      }
      #overlayPanel:active { cursor: grabbing !important; }
      #overlayPanel .overlay-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 18px 20px !important;
        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        color: #d9f2ff !important;
        font-weight: 600 !important;
      }
      #overlayPanel .drag-hint {
        font-size: 0.85rem !important;
        color: #94b5d5 !important;
      }
      #overlayPanel .overlay-content { padding: 20px !important; }
      #overlayPanel .stat-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 14px 0 !important;
        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        font-size: 0.9rem !important;
      }
      #overlayPanel .stat-row:last-child { border-bottom: none !important; }
      #overlayPanel .stat-row span { color: #94b5d5 !important; }
      #overlayPanel .stat-row strong { color: #f5fbff !important; font-size: 0.96rem !important; }
      #overlayPanel .overlay-footer { padding: 16px 20px 20px !important; }
      #resetButton {
        width: 100% !important;
        padding: 14px 18px !important;
        border: none !important;
        border-radius: 14px !important;
        background: rgba(45, 196, 255, 0.15) !important;
        color: #d7f3ff !important;
        cursor: pointer !important;
        font-size: 0.9rem !important;
        transition: background 0.25s ease !important;
      }
      #resetButton:hover { background: rgba(45, 196, 255, 0.26) !important; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(panel);
}

// Initialize draggable overlay panel
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
    panel.style.right = 'auto';
  });

  panel.addEventListener('pointerup', () => { isDragging = false; });
  panel.addEventListener('pointercancel', () => { isDragging = false; });

  panel.style.position = 'fixed';
}

document.addEventListener('DOMContentLoaded', () => {
  // Inject and init panel on every page
  injectOverlayPanel();
  initDraggableOverlay();

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

  const resetButton = document.getElementById('resetButton');
  const apiKeyEl = document.getElementById('apiKey');

  // Browser page setup
  if (urlForm && urlInput && browserFrame) {
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
        if (browserFrame.src) browserFrame.src = browserFrame.src;
      });
    }

    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const normalized = normalizeUrl(urlInput.value);
      if (!normalized) return;

      urlInput.value = normalized;
      browserFrame.src = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(normalized)}`;
      trackRealUsage(normalized);

      history = history.slice(0, historyIndex + 1);
      history.push(normalized);
      historyIndex = history.length - 1;
    });
  }

  // Landing page setup
  if (proxyForm && proxyUrlInput) {
    proxyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = normalizeUrl(proxyUrlInput.value);
      if (!url) return;

      trackRealUsage(url);
      window.location.href = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(url)}`;
    });
  }

  // Reset button
  if (resetButton) {
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

  // Init stats on all pages
  loadStats();
  updateUI();
  updateUptime();
  setInterval(updateUptime, 1000);
});
