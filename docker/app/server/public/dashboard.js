// Dashboard JavaScript
// Auto-refreshing public dashboard for Win for Life roadshow

// ========== State ==========
let currentData = null;

// ========== Utility Functions ==========

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

/**
 * Update clock display
 */
function updateClock() {
  document.getElementById('current-time').textContent = formatTime() + ' Uhr';
}

// ========== API Functions ==========

/**
 * Fetch dashboard data from API
 */
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    const result = await response.json();

    if (result.success) {
      currentData = result.data;
      updateUI(result.data);
    } else {
      console.error('Dashboard API error:', result.error);
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
}

// ========== UI Update Functions ==========

/**
 * Update UI with dashboard data
 * @param {Object} data - Dashboard data from API
 */
function updateUI(data) {
  // Info bar
  document.getElementById('machine-name').textContent = data.machineName;
  document.getElementById('current-date').textContent = data.date;
  document.getElementById('promo-end-time').textContent = data.promotionEndTime;

  // Status badge
  const statusBadge = document.getElementById('status-badge');
  if (data.isPaused) {
    statusBadge.textContent = 'PAUSIERT';
    statusBadge.className = 'px-4 py-2 rounded-full text-white font-bold bg-red-500';
  } else {
    statusBadge.textContent = 'AKTIV';
    statusBadge.className = 'px-4 py-2 rounded-full text-white font-bold bg-green-500';
  }

  // Main stats
  document.getElementById('plays-today').textContent = data.playsToday;
  const totalWins = data.prizes.reduce((sum, p) => sum + p.awarded, 0);
  document.getElementById('wins-today').textContent = totalWins;
  document.getElementById('win-rate').textContent = data.winRate;

  // Prize table
  updatePrizeTable(data.prizes);

  // QR codes
  updateQRCodes(data.qrCodes);

  // Footer
  document.getElementById('trefferplan-name').textContent = `Trefferplan: ${data.trefferplanName}`;
  document.getElementById('last-updated').textContent = formatTime();
}

/**
 * Update prize table
 * @param {Array} prizes - Prize data array
 */
function updatePrizeTable(prizes) {
  const tbody = document.getElementById('prize-table-body');

  if (prizes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-gray-500">Keine Gewinne konfiguriert</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = prizes.map(prize => {
    const progressPercent = prize.total > 0 ? (prize.awarded / prize.total) * 100 : 0;
    const progressColor = progressPercent > 80 ? 'bg-red-500' : progressPercent > 50 ? 'bg-yellow-500' : 'bg-green-500';

    return `
      <tr class="border-b border-gray-100">
        <td class="py-3 px-4">
          <div class="font-medium">${prize.name}</div>
          <div class="w-full h-2 bg-gray-200 rounded-full mt-1">
            <div class="${progressColor} h-2 rounded-full" style="width: ${progressPercent}%"></div>
          </div>
        </td>
        <td class="text-center py-3 px-4">
          <span class="text-2xl font-bold text-green-600">${prize.awarded}</span>
        </td>
        <td class="text-center py-3 px-4">
          <span class="text-xl text-gray-600">${prize.total}</span>
        </td>
        <td class="text-center py-3 px-4">
          <span class="text-xl font-medium ${prize.remaining < 10 ? 'text-red-600' : 'text-blue-600'}">${prize.remaining}</span>
        </td>
      </tr>
    `;
  }).join('');

  // Add totals row
  const totalAwarded = prizes.reduce((sum, p) => sum + p.awarded, 0);
  const totalInventory = prizes.reduce((sum, p) => sum + p.total, 0);
  const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0);

  tbody.innerHTML += `
    <tr class="bg-gray-50 font-bold">
      <td class="py-3 px-4">Gesamt</td>
      <td class="text-center py-3 px-4 text-green-600">${totalAwarded}</td>
      <td class="text-center py-3 px-4 text-gray-600">${totalInventory}</td>
      <td class="text-center py-3 px-4 text-blue-600">${totalRemaining}</td>
    </tr>
  `;
}

/**
 * Update QR codes section
 * @param {Array} qrCodes - QR code data array
 */
function updateQRCodes(qrCodes) {
  const container = document.getElementById('qr-codes-grid');

  if (!qrCodes || qrCodes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500 col-span-2">Keine QR-Codes geladen</div>
    `;
    return;
  }

  container.innerHTML = qrCodes.map(qr => {
    const isLow = qr.remaining < 20;
    const bgColor = isLow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const textColor = isLow ? 'text-red-600' : 'text-green-600';

    return `
      <div class="p-4 rounded-lg border ${bgColor}">
        <div class="text-sm text-gray-600 mb-1">${qr.category}</div>
        <div class="flex items-baseline justify-between">
          <span class="text-3xl font-bold ${textColor}">${qr.remaining}</span>
          <span class="text-gray-500">verbleibend</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          ${qr.used} von ${qr.total} verwendet
        </div>
      </div>
    `;
  }).join('');
}

// ========== Initialization ==========

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initial data fetch
  fetchDashboardData();

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);

  // Refresh data every 10 seconds
  setInterval(fetchDashboardData, 10000);
});
