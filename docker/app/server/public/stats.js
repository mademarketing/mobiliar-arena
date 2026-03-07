// Play Statistics Dashboard JavaScript

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

// ========== State ==========

let currentDate = new Date().toISOString().slice(0, 10);
let hourlyChart = null;
let scoreChart = null;

// ========== Date Navigation ==========

function getDatePicker() {
  return document.getElementById('date-picker');
}

function setDate(dateStr) {
  currentDate = dateStr;
  getDatePicker().value = dateStr;
  updateDateLabel();
  loadStats();
}

function prevDay() {
  const d = new Date(currentDate + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  setDate(d.toISOString().slice(0, 10));
}

function nextDay() {
  const d = new Date(currentDate + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  setDate(d.toISOString().slice(0, 10));
}

function goToday() {
  setDate(new Date().toISOString().slice(0, 10));
}

function updateDateLabel() {
  const d = new Date(currentDate + 'T12:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const label = document.getElementById('date-label');

  if (currentDate === today) {
    label.textContent = 'Today';
  } else {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    label.textContent = days[d.getDay()];
  }
}

// ========== Data Loading ==========

async function loadStats() {
  const loading = document.getElementById('loading');
  const noData = document.getElementById('no-data');
  const content = document.getElementById('stats-content');

  loading.classList.remove('hidden');
  noData.classList.add('hidden');
  content.classList.add('hidden');

  try {
    const response = await fetch(`/api/admin/play-stats?date=${currentDate}`);
    const result = await response.json();

    loading.classList.add('hidden');

    if (!result.success) {
      noData.classList.remove('hidden');
      return;
    }

    const { summary, hourly, games } = result.data;

    if (summary.totalGames === 0) {
      noData.classList.remove('hidden');
      return;
    }

    content.classList.remove('hidden');

    // Update summary cards
    document.getElementById('stat-games').textContent = summary.totalGames;
    document.getElementById('stat-players').textContent = summary.totalPlayers;
    document.getElementById('stat-avg-score').textContent = summary.avgScore;
    document.getElementById('stat-best').textContent = summary.maxScore;
    document.getElementById('stat-avg-players').textContent = summary.avgPlayersPerGame;
    document.getElementById('stat-low').textContent = summary.minScore;

    // Update charts
    renderHourlyChart(hourly);
    renderScoreChart(games);

    // Update table
    renderGamesTable(games);
  } catch (error) {
    console.error('Error loading stats:', error);
    loading.classList.add('hidden');
    noData.classList.remove('hidden');
  }
}

// ========== Charts ==========

function renderHourlyChart(hourly) {
  const ctx = document.getElementById('hourly-chart').getContext('2d');

  // Build full 24-hour data with gaps
  const hours = [];
  const gamesData = [];
  const scoreData = [];

  // Determine range from data or default 8-22
  const minHour = hourly.length > 0 ? Math.min(hourly[0].hour, 8) : 8;
  const maxHour = hourly.length > 0 ? Math.max(hourly[hourly.length - 1].hour, 20) : 20;

  const hourMap = {};
  hourly.forEach(h => { hourMap[h.hour] = h; });

  for (let h = minHour; h <= maxHour; h++) {
    hours.push(h + ':00');
    gamesData.push(hourMap[h]?.games || 0);
    scoreData.push(hourMap[h]?.avgScore || 0);
  }

  if (hourlyChart) hourlyChart.destroy();

  hourlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        label: 'Games',
        data: gamesData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4,
        yAxisID: 'y',
      }, {
        label: 'Avg Score',
        data: scoreData,
        type: 'line',
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        pointRadius: 3,
        tension: 0.3,
        yAxisID: 'y1',
      }],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: 'Games' },
          ticks: { stepSize: 1 },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: { display: true, text: 'Avg Score' },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

function renderScoreChart(games) {
  const ctx = document.getElementById('score-chart').getContext('2d');

  // Bucket scores
  const buckets = [
    { label: '0-199', min: 0, max: 199 },
    { label: '200-399', min: 200, max: 399 },
    { label: '400-599', min: 400, max: 599 },
    { label: '600-799', min: 600, max: 799 },
    { label: '800-999', min: 800, max: 999 },
    { label: '1000+', min: 1000, max: Infinity },
  ];

  const counts = buckets.map(() => 0);
  games.forEach(g => {
    for (let i = 0; i < buckets.length; i++) {
      if (g.score >= buckets[i].min && g.score <= buckets[i].max) {
        counts[i]++;
        break;
      }
    }
  });

  if (scoreChart) scoreChart.destroy();

  scoreChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: buckets.map(b => b.label),
      datasets: [{
        label: 'Games',
        data: counts,
        backgroundColor: [
          'rgba(156, 163, 175, 0.7)',
          'rgba(96, 165, 250, 0.7)',
          'rgba(52, 211, 153, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(251, 146, 60, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Games' },
          ticks: { stepSize: 1 },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// ========== Games Table ==========

function renderGamesTable(games) {
  document.getElementById('games-count').textContent = games.length;

  const tbody = document.getElementById('games-table');
  tbody.innerHTML = games.map(g => {
    const time = new Date(g.timestamp).toLocaleTimeString('de-CH', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Zurich',
    });

    const highScoreBadge = g.is_high_score
      ? '<span class="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">NEW</span>'
      : '<span class="text-gray-300">-</span>';

    return `
      <tr class="border-t border-gray-100 hover:bg-gray-50">
        <td class="px-3 py-2 text-gray-700">${time}</td>
        <td class="px-3 py-2 text-center">${g.player_count}</td>
        <td class="px-3 py-2 text-right font-semibold">${g.score}</td>
        <td class="px-3 py-2 text-right text-gray-500">${g.base_score}</td>
        <td class="px-3 py-2 text-right text-green-600">+${g.bonus_score}</td>
        <td class="px-3 py-2 text-center">${g.longest_rally}</td>
        <td class="px-3 py-2 text-center">${g.fire_ball_count}</td>
        <td class="px-3 py-2 text-center">${g.max_balls_in_play}</td>
        <td class="px-3 py-2 text-center">${highScoreBadge}</td>
      </tr>
    `;
  }).join('');
}

// ========== Initialization ==========

document.addEventListener('DOMContentLoaded', () => {
  const picker = getDatePicker();
  picker.value = currentDate;
  picker.addEventListener('change', (e) => {
    setDate(e.target.value);
  });
  updateDateLabel();
  loadStats();
});
