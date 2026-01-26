// Promoter Interface JavaScript
// Handles statistics loading, pause/resume control, settings, and QR code display

// ========== Authentication Check ==========

/**
 * Check if promoter is authenticated, redirect to login if not
 */
async function checkAuthentication() {
  try {
    const response = await fetch('/api/promoter/auth/check');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/promoter-login.html';
    }
  } catch (error) {
    // On error, redirect to login
    window.location.href = '/promoter-login.html';
  }
}

// Check authentication on page load
checkAuthentication();

/**
 * Logout handler
 */
async function logout() {
  try {
    await fetch('/api/promoter/logout', { method: 'POST' });
    window.location.href = '/promoter-login.html';
  } catch (error) {
    window.location.href = '/promoter-login.html';
  }
}

// ========== State ==========
let currentStats = null;
let isPaused = false;
let trefferplanConfigs = [];

// ========== Utility Functions ==========

/**
 * Show a temporary message to the user
 * @param {string} message - Message text
 * @param {string} type - Message type: 'success', 'error', 'info'
 */
function showMessage(message, type = 'info') {
  const container = document.getElementById('message-container');
  const messageDiv = document.createElement('div');

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type] || 'bg-blue-500';

  messageDiv.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 transition-opacity duration-500`;
  messageDiv.textContent = message;

  container.appendChild(messageDiv);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => {
      if (container.contains(messageDiv)) {
        container.removeChild(messageDiv);
      }
    }, 500);
  }, 3000);
}

/**
 * Format time for display
 * @returns {string} Formatted time
 */
function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ========== API Calls ==========

/**
 * Load and display statistics
 */
async function loadStats() {
  try {
    const response = await fetch('/api/promoter/stats');
    const result = await response.json();

    if (result.success) {
      currentStats = result.data;
      updateStatsUI(currentStats);
    } else {
      console.error('Failed to load stats:', result.error);
      showMessage('Fehler beim Laden der Statistiken', 'error');
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    showMessage('Verbindungsfehler', 'error');
  }
}

/**
 * Load settings
 */
async function loadSettings() {
  try {
    const response = await fetch('/api/promoter/settings');
    const result = await response.json();

    if (result.success) {
      document.getElementById('promo-end-time').value = result.data.promotionEndTime;
      isPaused = result.data.isPaused;
      updatePauseButton();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Load Trefferplan configurations
 */
async function loadTrefferplan() {
  try {
    const response = await fetch('/api/promoter/trefferplan');
    const result = await response.json();

    if (result.success) {
      trefferplanConfigs = result.data.configs;
      updateTrefferplanUI(result.data);
    }
  } catch (error) {
    console.error('Error loading Trefferplan:', error);
  }
}

/**
 * Load QR code counts (read-only display)
 */
async function loadQRCodes() {
  try {
    const response = await fetch('/api/promoter/qr-codes');
    const result = await response.json();

    if (result.success) {
      updateQRCodeUI(result.data);
    }
  } catch (error) {
    console.error('Error loading QR codes:', error);
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const promotionEndTime = document.getElementById('promo-end-time').value;

    const response = await fetch('/api/promoter/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promotionEndTime })
    });

    const result = await response.json();

    if (result.success) {
      showMessage('Einstellungen gespeichert', 'success');
    } else {
      showMessage('Fehler: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Verbindungsfehler', 'error');
  }
}

/**
 * Change Trefferplan
 */
async function changeTrefferplan() {
  const select = document.getElementById('trefferplan-select');
  const newPlan = select.value;

  if (!newPlan) return;

  try {
    const response = await fetch('/api/promoter/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trefferplan: newPlan })
    });

    const result = await response.json();

    if (result.success) {
      showMessage('Trefferplan geändert', 'success');
      loadTrefferplan();
    } else {
      showMessage('Fehler: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Error changing Trefferplan:', error);
    showMessage('Verbindungsfehler', 'error');
  }
}

// ========== UI Update Functions ==========

/**
 * Update statistics UI
 * @param {Object} data - Statistics data
 */
function updateStatsUI(data) {
  // Update statistics cards
  document.getElementById('stat-total-plays').textContent = data.totalPlays;

  // Count WFL and SWFL from awarded inventory prizes
  const awardedPrizes = data.awarded?.inventory || [];
  const wfl = awardedPrizes.filter(p => p.displayName === 'Win for Life').length;
  const swfl = awardedPrizes.filter(p => p.displayName === 'Super Win for Life').length;

  // Display prize counts
  document.getElementById('stat-wfl').textContent = wfl;
  document.getElementById('stat-swfl').textContent = swfl;
  document.getElementById('stat-consolations').textContent = data.prizes?.consolation || 0;

  // Update pause state
  isPaused = data.isPaused;
  updatePauseButton();

  // Update last updated time
  document.getElementById('last-updated').textContent = formatTime();
}

/**
 * Update pause button appearance
 */
function updatePauseButton() {
  const btn = document.getElementById('pause-toggle-btn');
  const btnText = document.getElementById('pause-btn-text');
  const statusText = document.getElementById('status-text');

  if (isPaused) {
    btn.className = 'w-full py-6 text-2xl font-bold rounded-lg shadow-lg transition-all duration-200 active:scale-95 bg-red-600 hover:bg-red-700 text-white';
    btnText.textContent = '▶ Spiel fortsetzen';
    statusText.textContent = '⏸ Spiel ist pausiert';
    statusText.className = 'mt-3 text-center text-lg font-medium text-red-600';
  } else {
    btn.className = 'w-full py-6 text-2xl font-bold rounded-lg shadow-lg transition-all duration-200 active:scale-95 bg-green-600 hover:bg-green-700 text-white';
    btnText.textContent = '⏸ Spiel pausieren';
    statusText.textContent = '▶ Spiel ist aktiv';
    statusText.className = 'mt-3 text-center text-lg font-medium text-green-600';
  }
}

/**
 * Update Trefferplan UI
 * @param {Object} data - Trefferplan data
 */
function updateTrefferplanUI(data) {
  const select = document.getElementById('trefferplan-select');
  const description = document.getElementById('trefferplan-description');

  select.innerHTML = data.configs.map(config => `
    <option value="${config.key}" ${config.isActive ? 'selected' : ''}>
      ${config.name}
    </option>
  `).join('');

  // Show description of selected plan
  const active = data.configs.find(c => c.isActive);
  if (active) {
    description.textContent = `${active.description} (WFL: ${active.prizes.wfl}, SWFL: ${active.prizes.swfl})`;
  }
}

/**
 * Update QR code counts UI
 * @param {Array} data - QR code counts
 */
function updateQRCodeUI(data) {
  const container = document.getElementById('qr-code-counts');

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-gray-500 col-span-2">Keine QR-Codes geladen</div>';
    return;
  }

  container.innerHTML = data.map(qr => {
    const isLow = qr.remaining < 20;
    const bgColor = isLow ? 'bg-red-50' : 'bg-green-50';
    const textColor = isLow ? 'text-red-600' : 'text-green-600';

    return `
      <div class="p-4 rounded-lg ${bgColor}">
        <div class="text-sm text-gray-600 mb-1">${qr.prize_name}</div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold ${textColor}">${qr.remaining}</span>
          <span class="text-sm text-gray-500">verbleibend</span>
        </div>
        <div class="text-xs text-gray-400">${qr.used} von ${qr.total} verwendet</div>
      </div>
    `;
  }).join('');
}

// ========== Pause/Resume Functions ==========

/**
 * Pause the game
 */
async function pauseGame() {
  try {
    const response = await fetch('/api/promoter/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();

    if (result.success) {
      isPaused = true;
      updatePauseButton();
      showMessage('Spiel pausiert', 'success');
    } else {
      showMessage('Fehler beim Pausieren', 'error');
    }
  } catch (error) {
    console.error('Error pausing game:', error);
    showMessage('Verbindungsfehler', 'error');
  }
}

/**
 * Resume the game
 */
async function resumeGame() {
  try {
    const response = await fetch('/api/promoter/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();

    if (result.success) {
      isPaused = false;
      updatePauseButton();
      showMessage('Spiel fortgesetzt', 'success');
    } else {
      showMessage('Fehler beim Fortsetzen', 'error');
    }
  } catch (error) {
    console.error('Error resuming game:', error);
    showMessage('Verbindungsfehler', 'error');
  }
}

/**
 * Toggle pause state
 */
async function togglePause() {
  if (isPaused) {
    await resumeGame();
  } else {
    await pauseGame();
  }
  // Refresh stats after state change
  setTimeout(() => loadStats(), 500);
}

// ========== Initialization ==========

/**
 * Initialize the promoter interface on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  loadStats();
  loadSettings();
  loadTrefferplan();
  loadQRCodes();

  // Refresh stats every 30 seconds
  setInterval(loadStats, 30000);

  // Refresh QR codes every 60 seconds
  setInterval(loadQRCodes, 60000);
});
