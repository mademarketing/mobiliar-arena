// Admin UI JavaScript
// Theme management and game configuration

// ========== Authentication ==========

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

checkAuthentication();

async function logout() {
  try {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/admin-login.html';
    } else {
      showMessage('Logout failed', 'error');
    }
  } catch (error) {
    showMessage('Logout failed', 'error');
  }
}

// ========== Utility ==========

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

  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => container.removeChild(messageDiv), 500);
  }, 3000);
}

// ========== Theme Management ==========

const THEME_LABELS = {
  basketball: 'Basketball',
  handball: 'Handball',
  volleyball: 'Volleyball',
  floorball: 'Floorball',
  corporate: 'Corporate',
};

let currentTheme = '';

async function loadTheme() {
  try {
    const response = await fetch('/api/admin/theme');
    const result = await response.json();

    if (result.success) {
      currentTheme = result.data.active;
      renderThemeGrid(result.data.available, result.data.active);
      document.getElementById('setting-theme').textContent =
        THEME_LABELS[result.data.active] || result.data.active;
    }
  } catch (error) {
    showMessage('Error loading theme', 'error');
  }
}

function renderThemeGrid(available, active) {
  const grid = document.getElementById('theme-grid');

  grid.innerHTML = available.map(theme => {
    const isActive = theme === active;
    const label = THEME_LABELS[theme] || theme;
    const activeClasses = isActive
      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
      : 'border-gray-200 hover:border-gray-400 cursor-pointer';

    return `
      <button
        onclick="setTheme('${theme}')"
        class="p-4 rounded-lg border-2 text-center transition-all ${activeClasses}"
        ${isActive ? 'disabled' : ''}
      >
        <div class="text-lg font-semibold ${isActive ? 'text-blue-700' : 'text-gray-800'}">${label}</div>
        ${isActive ? '<div class="text-xs text-blue-500 mt-1">Active</div>' : ''}
      </button>
    `;
  }).join('');
}

async function setTheme(theme) {
  if (theme === currentTheme) return;

  try {
    const response = await fetch('/api/admin/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    const result = await response.json();

    if (result.success) {
      showMessage(`Theme changed to ${THEME_LABELS[theme] || theme}`, 'success');
      loadTheme();
    } else {
      showMessage('Failed to change theme: ' + result.error, 'error');
    }
  } catch (error) {
    showMessage('Error changing theme: ' + error.message, 'error');
  }
}

// ========== Initialization ==========

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
});
