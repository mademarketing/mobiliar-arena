// Admin UI JavaScript
// Handles all AJAX requests and UI interactions
// Two-tier algorithm: Inventory prizes + Consolation (no scheduled prizes)

// ========== Authentication Check ==========

/**
 * Check if user is authenticated, redirect to login if not
 */
async function checkAuthentication() {
  try {
    const response = await fetch('/api/admin/auth/check');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/admin-login.html';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/admin-login.html';
  }
}

// Check authentication on page load
checkAuthentication();

/**
 * Logout handler
 */
async function logout() {
  try {
    const response = await fetch('/api/admin/logout', {
      method: 'POST'
    });

    if (response.ok) {
      window.location.href = '/admin-login.html';
    } else {
      showMessage('Logout failed', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showMessage('Logout failed', 'error');
  }
}

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
      container.removeChild(messageDiv);
    }, 500);
  }, 3000);
}

/**
 * Format ISO datetime string to readable format
 * @param {string} isoString - ISO datetime string
 * @returns {string} Formatted datetime
 */
function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date string to readable format
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('de-CH');
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ========== Tab Management ==========

/**
 * Show a specific tab and hide others
 * @param {string} tabName - Tab name to show
 */
function showTab(tabName) {
  // Hide all tab contents
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => content.classList.add('hidden'));

  // Remove active styling from all tabs
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    tab.classList.remove('border-blue-500', 'text-blue-600');
    tab.classList.add('border-transparent', 'text-gray-500');
  });

  // Show selected tab content
  const selectedContent = document.getElementById(`content-${tabName}`);
  if (selectedContent) {
    selectedContent.classList.remove('hidden');
  }

  // Add active styling to selected tab
  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.remove('border-transparent', 'text-gray-500');
    selectedTab.classList.add('border-blue-500', 'text-blue-600');
  }

  // Load data for the selected tab
  switch (tabName) {
    case 'prizes':
      loadPrizes();
      break;
    case 'inventory':
      loadInventory();
      break;
    case 'qrcodes':
      loadQRCodes();
      break;
  }
}

// ========== API Calls ==========

/**
 * Load and display statistics
 */
async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const result = await response.json();

    if (result.success) {
      const data = result.data;
      document.getElementById('stat-games-played').textContent = data.plays.total;
      document.getElementById('stat-inventory').textContent = `${data.inventory.awarded} / ${data.inventory.total}`;
      document.getElementById('stat-wishes').textContent = data.wishes.total;
    } else {
      console.error('Failed to load stats:', result.error);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

/**
 * Load and display all prizes
 */
async function loadPrizes() {
  try {
    const response = await fetch('/api/admin/prizes');
    const result = await response.json();

    if (result.success) {
      const prizes = result.data;
      const tbody = document.getElementById('prizes-table');

      if (prizes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No prizes found</td></tr>';
        return;
      }

      tbody.innerHTML = prizes.map(prize => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${prize.id}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><code class="bg-gray-100 px-2 py-1 rounded">${prize.texture_key}</code></td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${prize.display_name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDateTime(prize.created_at)}</td>
        </tr>
      `).join('');
    } else {
      showMessage('Failed to load prizes: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error loading prizes: ' + error.message, 'error');
  }
}

/**
 * Load and display inventory (read-only, managed by Trefferplan)
 * Always shows today's inventory only
 */
async function loadInventory() {
  const today = getTodayDate();

  try {
    const response = await fetch(`/api/admin/inventory?startDate=${today}&endDate=${today}`);
    const result = await response.json();

    if (result.success) {
      const inventory = result.data;
      const tbody = document.getElementById('inventory-table');

      if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No inventory found for this date range</td></tr>';
        return;
      }

      tbody.innerHTML = inventory.map(item => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.prize_name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(item.date)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.total_quantity}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.awarded_quantity}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.remaining > 0 ? 'text-green-600' : 'text-red-600'}">${item.remaining}</td>
        </tr>
      `).join('');
    } else {
      showMessage('Failed to load inventory: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error loading inventory: ' + error.message, 'error');
  }
}

/**
 * Load and display QR code counts
 */
async function loadQRCodes() {
  try {
    const response = await fetch('/api/admin/qr-codes');
    const result = await response.json();

    if (result.success) {
      const data = result.data;
      const container = document.getElementById('qr-code-counts');

      if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-gray-500 col-span-2">No QR codes loaded</div>';
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
              <span class="text-sm text-gray-500">remaining</span>
            </div>
            <div class="text-xs text-gray-400">${qr.used} of ${qr.total} used</div>
          </div>
        `;
      }).join('');

      // Update prize select for import form
      updateQRPrizeSelect(data);
    } else {
      showMessage('Failed to load QR codes: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error loading QR codes: ' + error.message, 'error');
  }
}

/**
 * Update prize select dropdown for QR import
 * @param {Array} data - QR code data with prize info
 */
function updateQRPrizeSelect(data) {
  const select = document.getElementById('qr-prize-select');
  if (select && data) {
    select.innerHTML = '<option value="">Select prize...</option>' +
      data.map(qr => `<option value="${qr.prize_id}">${qr.prize_name}</option>`).join('');
  }
}

// ========== Form Handlers ==========

/**
 * Handle create prize form submission
 */
document.getElementById('create-prize-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = {
    textureKey: formData.get('textureKey'),
    displayName: formData.get('displayName')
  };

  try {
    const response = await fetch('/api/admin/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.success) {
      showMessage('Prize created successfully', 'success');
      e.target.reset();
      loadPrizes();
      loadStats();
    } else {
      showMessage('Failed to create prize: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error creating prize: ' + error.message, 'error');
  }
});

/**
 * Handle QR code import form submission
 */
document.getElementById('import-qr-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  try {
    const response = await fetch('/api/admin/qr-codes/import', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (result.success) {
      showMessage(`${result.data.imported} QR codes imported successfully`, 'success');
      if (result.data.skipped > 0) {
        showMessage(`${result.data.skipped} duplicates skipped`, 'info');
      }
      e.target.reset();
      loadQRCodes();
    } else {
      showMessage('Failed to import QR codes: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error importing QR codes: ' + error.message, 'error');
  }
});

// ========== Initialization ==========

/**
 * Initialize the admin UI on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  loadStats();
  loadPrizes();

  // Refresh stats every 30 seconds
  setInterval(loadStats, 30000);
});
