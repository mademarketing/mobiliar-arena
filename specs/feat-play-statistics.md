# Feature: Play Statistics Dashboard

## Problem

Game statistics (score, player count, game stats like max balls, longest rally, fire balls) are only displayed transiently in the Result scene and never persisted. The `play_log` table only tracks prize distribution, not game performance data. There's no way to review historical play data by date.

## Solution

Add a new `game_log` table to persist per-game statistics, a server endpoint to receive game results from the client, and a new statistics page accessible from the admin panel with charts and a date picker.

---

## Implementation Plan

### 1. Database: Add `game_log` table

**File:** `docker/app/server/src/database/schema.sql` (append)

Add a new migration in `PrizeDatabase.ts` to create the table on startup:

```sql
CREATE TABLE IF NOT EXISTS game_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  date TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  score INTEGER NOT NULL,
  base_score INTEGER NOT NULL,
  bonus_score INTEGER NOT NULL,
  max_balls_in_play INTEGER NOT NULL DEFAULT 0,
  longest_rally INTEGER NOT NULL DEFAULT 0,
  fire_ball_count INTEGER NOT NULL DEFAULT 0,
  game_duration_ms INTEGER NOT NULL,
  theme TEXT,
  is_high_score INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_game_log_date ON game_log(date);
CREATE INDEX IF NOT EXISTS idx_game_log_timestamp ON game_log(timestamp);
```

### 2. Database: Add methods to `PrizeDatabase.ts`

**File:** `docker/app/server/src/database/PrizeDatabase.ts`

Add methods:

- `logGame(data)` — Insert a row into `game_log`
- `getGameStats(date: string)` — Aggregated stats for a date:
  - Total games played
  - Total unique players (sum of player_count)
  - Average score, min score, max score
  - Average player count
  - Total fire balls, max rally, etc.
- `getGamesByDate(date: string)` — List all game rows for a date (for the chart)
- `getGameStatsRange(startDate, endDate)` — For potential multi-day views
- `getHourlyBreakdown(date: string)` — Games grouped by hour for the bar chart

### 3. Server: Add game log endpoint

**File:** `docker/app/server/app.ts`

Add endpoint:
```
POST /api/game-log
Body: { playerCount, score, baseScore, bonusScore, stats: { maxBallsInPlay, longestRally, fireBallCount }, gameDurationMs, isHighScore }
```

This is called by the client Result scene after each game ends. No auth required (same as `/api/highscore`).

### 4. Server: Add statistics API route

**File:** `docker/app/server/src/routes/admin.ts` (add to existing admin routes)

Add endpoints:
```
GET /api/admin/play-stats?date=YYYY-MM-DD
```

Returns:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-07",
    "summary": {
      "totalGames": 42,
      "totalPlayers": 156,
      "avgPlayersPerGame": 3.7,
      "avgScore": 485,
      "minScore": 120,
      "maxScore": 1330,
      "highScoreCount": 2,
      "totalFireBalls": 18,
      "avgLongestRally": 12
    },
    "hourly": [
      { "hour": 10, "games": 5, "avgScore": 400 },
      { "hour": 11, "games": 8, "avgScore": 520 },
      ...
    ],
    "games": [
      { "id": 1, "timestamp": "...", "playerCount": 4, "score": 650, ... },
      ...
    ]
  }
}
```

### 5. Client: Report game results to server

**File:** `docker/app/client/src/scenes/Result.ts`

In `createTeamScoreDisplay()`, after calculating `totalScore`, send game data to the server:

```typescript
this.reportGameToServer({
  playerCount: this.gameResult.playerCount,
  score: totalScore,
  baseScore: this.gameResult.score - totalBonus,  // score before bonus
  bonusScore: totalBonus,
  stats: this.gameResult.stats,
  gameDurationMs: this.game.registry.get('gameDurationMs') || 60000,
  isHighScore: isNewHighScore,
});
```

Add method:
```typescript
private reportGameToServer(data: object): void {
  fetch('/api/game-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.error('Failed to log game:', err));
}
```

### 6. Admin UI: Statistics page

**File:** `docker/app/server/public/stats.html` (new)
**File:** `docker/app/server/public/stats.js` (new)

Use the same stack as existing admin pages (vanilla HTML/JS + Tailwind CSS CDN). Add Chart.js CDN for charts.

#### Layout:
```
┌─────────────────────────────────────────────────┐
│  Mobiliar Arena - Play Statistics    [← Admin]  │
├─────────────────────────────────────────────────┤
│  Date: [2026-03-07 ▼]    [← Prev] [Next →]     │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 42       │ │ 156      │ │ 485      │        │
│  │ Games    │ │ Players  │ │ Avg Score │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 1330     │ │ 3.7      │ │ 120      │        │
│  │ Best     │ │ Avg Plyr │ │ Low Score│        │
│  └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│  Games per Hour (Bar Chart)                     │
│  ┌─────────────────────────────────────┐        │
│  │  █                                  │        │
│  │  █  █     █                         │        │
│  │  █  █  █  █  █                      │        │
│  │ 10 11 12 13 14 15 16 17 18 19 20    │        │
│  └─────────────────────────────────────┘        │
├─────────────────────────────────────────────────┤
│  Score Distribution (Bar Chart)                 │
│  ┌─────────────────────────────────────┐        │
│  │     █                               │        │
│  │  █  █  █                            │        │
│  │  █  █  █  █     █                   │        │
│  │ 0-199 200-399 400-599 600+ ...      │        │
│  └─────────────────────────────────────┘        │
├─────────────────────────────────────────────────┤
│  Recent Games (Table)                           │
│  Time    Players  Score  Rally  Fire  HighScore │
│  14:32   4        650    12     2     ✗         │
│  14:28   3        480    8      1     ✗         │
│  14:15   6        1330   22     5     ✓         │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

#### Features:
- **Date picker**: HTML5 `<input type="date">` defaulting to today (Swiss timezone)
- **Prev/Next buttons**: Navigate between days
- **Summary cards**: 6 KPI cards with key metrics
- **Games per Hour chart**: Bar chart (Chart.js) showing game frequency by hour
- **Score Distribution chart**: Bar chart bucketing scores into ranges
- **Games table**: Scrollable table of all games for the day, sorted newest first

### 7. Admin UI: Link from admin page

**File:** `docker/app/server/public/admin.html`

Add a link/button to the statistics page in the admin header area:

```html
<a href="/stats.html" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
  Play Statistics
</a>
```

### 8. Serve static files (already configured)

The Express app already serves `public/` as static files, so `stats.html` and `stats.js` will be accessible at `/stats.html` automatically. The stats page uses admin auth — require login via session check.

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `docker/app/server/src/database/PrizeDatabase.ts` | Edit | Add `game_log` table migration, `logGame()`, `getGameStats()`, `getHourlyBreakdown()` methods |
| `docker/app/server/src/database/schema.sql` | Edit | Add `game_log` table definition (documentation) |
| `docker/app/server/app.ts` | Edit | Add `POST /api/game-log` endpoint |
| `docker/app/server/src/routes/admin.ts` | Edit | Add `GET /api/admin/play-stats` endpoint |
| `docker/app/client/src/scenes/Result.ts` | Edit | Add `reportGameToServer()` call after score calculation |
| `docker/app/server/public/stats.html` | New | Statistics dashboard page |
| `docker/app/server/public/stats.js` | New | Statistics page logic, charts, date picker |
| `docker/app/server/public/admin.html` | Edit | Add link to statistics page |

## Dependencies

- **Chart.js** via CDN (`https://cdn.jsdelivr.net/npm/chart.js`) — lightweight charting library, no build step needed. Same approach as Tailwind CSS CDN already used.

## Notes

- No authentication needed for `POST /api/game-log` (fire-and-forget from client, similar to `/api/highscore`)
- `GET /api/admin/play-stats` requires admin auth (existing middleware)
- Swiss timezone handling uses existing `getSwissDate()` utility
- The `game_log` table is independent from `play_log` (prize tracking) — they serve different purposes
- Game duration is included so stats remain accurate if the setting changes over time
