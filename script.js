const SERVER_URL = 'https://server.easyproxi.online';
const SERVER_START_OFFSET = { value: 0 };
const PANEL_START = Date.now();

let history = [];
let historyIndex = -1;

// --- Stats: always pulled from server by session ---
async function fetchStats() {
  try {
    const res = await fetch(`${SERVER_URL}/api/me`, { credentials: 'include' });
    if (res.status === 401 || res.redirected) return null; // not logged in
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function updateUI() {
  const data = await fetchStats();

  const dataUsageEl = document.getElementById('dataUsage');
  const requestsServedEl = document.getElementById('requestsServed');
  const apiKeyEl = document.getElementById('apiKey');

  if (!data) {
    // Not logged in — show placeholder
    if (dataUsageEl) dataUsageEl.textContent = 'Not logged in';
    if (requestsServedEl) requestsServedEl.textContent = '--';
    if (apiKeyEl) apiKeyEl.textContent = '--';
    return;
  }

  SERVER_START_OFFSET.value = data.uptimeSeconds;

  const limit = data.dataLimit || 500;
  if (dataUsageEl) dataUsageEl.textContent = `${data.dataUsed.toFixed(2)} MB / ${limit} MB`;
  if (requestsServedEl) requestsServedEl.textContent = data.requests;
  if (apiKeyEl) apiKeyEl.textContent = data.username || '--';
}

function updateUptime() {
  const uptimeEl = document.getElementById('uptime');
  if (!uptimeEl) return;

  const total = SERVER_START_OFFSET.value + Math.floor((Date.now() - PANEL_START) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  uptimeEl.textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
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

// --- Inject overlay panel if not already on the page ---
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
      <div class="stat-row"><span>Data Usage</span><strong id="dataUsage">Loading...</strong></div>
      <div class="stat-row"><span>Requests Served</span><strong id="requestsServed">--</strong></div>
      <div class="stat-row"><span>Uptime</span><strong id="uptime">00:00:00</strong></div>
      <div class="stat-row"><span>Account</span><strong id="apiKey">Loading...</strong></div>
    </div>
    <div class="overlay-footer">
      <button type="button" id="resetButton">Reset Session</button>
    </div>
  `;

  // Inject styles if EasyProxi stylesheet isn't loaded
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
      #overlayPanel .drag-hint { font-size: 0.85rem !important; color: #94b5d5 !important; }
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
      #overlayPanel .stat-row strong { color: #f5fbff !important; }
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
      }
      #resetButton:hover { background: rgba(45, 196, 255, 0.26) !important; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(panel);
}

// --- Draggable overlay ---
function initDraggableOverlay() {
  const panel = document.getElementById('overlayPanel');
  if (!panel) return;

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  panel.addEventListener('pointerdown', (e) => {
    if (e.target.id === 'resetButton') return;
    isDragging = true;
    panel.setPointerCapture(e.pointerId);
    const rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
  });

  panel.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    panel.style.left = `${Math.max(12, Math.min(window.innerWidth - panel.offsetWidth - 12, e.clientX - dragOffset.x))}px`;
    panel.style.top = `${Math.max(12, Math.min(window.innerHeight - panel.offsetHeight - 12, e.clientY - dragOffset.y))}px`;
    panel.style.right = 'auto';
  });

  panel.addEventListener('pointerup', () => { isDragging = false; });
  panel.addEventListener('pointercancel', () => { isDragging = false; });
  panel.style.position = 'fixed';
}

document.addEventListener('DOMContentLoaded', async () => {
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

  // Browser page
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

    urlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const normalized = normalizeUrl(urlInput.value);
      if (!normalized) return;

      urlInput.value = normalized;
      browserFrame.src = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(normalized)}`;

      // Sync UI after short delay to let server track usage
      setTimeout(updateUI, 1500);

      history = history.slice(0, historyIndex + 1);
      history.push(normalized);
      historyIndex = history.length - 1;
    });
  }

  // Landing page
  if (proxyForm && proxyUrlInput) {
    proxyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = normalizeUrl(proxyUrlInput.value);
      if (!url) return;
      window.location.href = `${SERVER_URL}/api/proxy?url=${encodeURIComponent(url)}`;
    });
  }

  // Reset button — calls server to reset stats for logged in user
  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      try {
        await fetch(`${SERVER_URL}/api/reset`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {}

      if (browserFrame) {
        browserFrame.src = '';
        if (urlInput) urlInput.value = '';
        history = [];
        historyIndex = -1;
      }

      await updateUI();
    });
  }

  // Initial load + poll every 5 seconds
  await updateUI();
  updateUptime();
  setInterval(updateUptime, 1000);
  setInterval(updateUI, 5000);
});
