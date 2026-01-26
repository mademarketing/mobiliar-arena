# Scoring System

*This file was part of the kiosk game template (prize distribution) and has been replaced with the Mobiliar Arena scoring system.*

## Overview

Mobiliar Arena uses a cooperative team scoring system. All players work together to achieve the highest possible score.

## Score Calculation

### Base Score

```
baseScore = ballsInPlay × elapsedSeconds
```

Every second, points accumulate based on how many balls are currently in play.

### Combo System

Consecutive paddle hits without missing increase the combo multiplier:

| Consecutive Hits | Multiplier |
|------------------|------------|
| 0-4              | 1.0×       |
| 5-9              | 1.5×       |
| 10-19            | 2.0×       |
| 20-29            | 2.5×       |
| 30+              | 3.0×       |

When a ball is missed, the combo resets to 0.

### Final Score

```
finalScore = baseScore + comboBonus
```

## Highscore System

### Storage

Highscores persist in SQLite database:

```sql
CREATE TABLE highscores (
  id INTEGER PRIMARY KEY,
  score INTEGER NOT NULL,
  player_count INTEGER NOT NULL,
  theme TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### Display

- Current highscore shown in Lobby scene
- New highscore celebration in Result scene
- Leaderboard in admin panel

## References

- Score implementation: `docker/app/client/src/scenes/Game.ts`
- Highscore API: `docker/app/server/src/routes/api.ts`
- Database: `docker/app/server/src/services/Database.ts`
