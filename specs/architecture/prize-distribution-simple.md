# Time-Based Adaptive Prize Distribution

## Overview

The adaptive prize distribution algorithm uses a **time-based approach** to distribute lottery tickets fairly throughout the operating day without requiring visitor count estimation.

## Prize Types

The system supports multiple inventory prize types:

- **Win for Life**: Standard lottery ticket prize
- **Super Win for Life**: Premium lottery ticket prize

Each prize type has its own:
- Daily inventory quantity
- Voucher code pool (pre-loaded QR codes)
- Texture/visual representation

## Core Algorithm

### Concept

Awards prizes at target time intervals with randomized probability window:

```
targetInterval = remainingTime / prizesRemaining
timeSinceLastWin = currentTime - lastPrizeTime
```

**Example:** With 20 lottery tickets left and 2 hours remaining:
- Target interval: 7200s / 20 = 360s (6 minutes)
- Award approximately every 6 minutes with randomization

### Probability Window

The algorithm uses three zones based on time since last prize:

```typescript
windowStart = targetInterval × 0.7   // 70% of target
windowEnd = targetInterval × 1.5     // 150% of target

if (timeSinceLastWin < windowStart) {
  probability = 0.02  // TOO SOON: Very low (2%)
} else if (timeSinceLastWin > windowEnd) {
  probability = 0.95  // OVERDUE: Urgent (95%)
} else {
  // IN WINDOW: Linear ramp 15% → 75%
  progress = (timeSinceLastWin - windowStart) / (windowEnd - windowStart)
  probability = 0.15 + (progress × 0.60)
}
```

### Visual Representation

```
Time Since Last Win →

 0s    windowStart (70%)    target (100%)    windowEnd (150%)
  │            │                  │                    │
  ├────────────┼──────────────────┼────────────────────┤
  │  TOO SOON  │    PROBABILITY RAMP    │    OVERDUE    │
  │    2%      │     15% ───→ 75%      │      95%      │
```

## Configuration

Location: `docker/app/server/content/settings.json`

```json
{
  "prizes": {
    "algorithm": {
      "openTime": "10:00",
      "closeTime": "20:00",
      "windowStart": 0.7,          // Can award at 70% of target interval
      "windowEnd": 1.5,            // Must award by 150% of target interval
      "minProbability": 0.02,      // Probability before window (too soon)
      "rampStart": 0.15,           // Probability at window start
      "rampEnd": 0.75,             // Probability at window end
      "urgentProbability": 0.95    // Probability after window (overdue)
    }
  }
}
```

### Tuning Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `windowStart` | 0.7 | Earliest award (70% of target interval) |
| `windowEnd` | 1.5 | Latest award (150% of target interval) |
| `minProbability` | 0.02 | Too soon probability |
| `rampStart` | 0.15 | Window start probability |
| `rampEnd` | 0.75 | Window end probability |
| `urgentProbability` | 0.95 | Overdue probability |

## Key Benefits

✅ **No Visitor Estimation**: Works with any traffic pattern (50-200 visitors/hour)
✅ **Self-Correcting**: Automatically adapts if distribution falls behind
✅ **Natural Randomness**: ±30% variance in award timing
✅ **Simple Configuration**: 6 intuitive parameters
✅ **Near-Complete Distribution**: Ensures prizes are distributed proportionally to visitor traffic with escalating probability to prevent leftover inventory in normal operating conditions

## Distribution Guarantees

The algorithm ensures high distribution rates under normal operating conditions:

**What IS Guaranteed:**
- ✅ Probability escalates to urgent (95%) when overdue
- ✅ Self-corrects if falling behind schedule
- ✅ Adapts to varying traffic patterns
- ✅ Distributes proportionally throughout the day

**What IS NOT Guaranteed:**
- ❌ 100% distribution if visitor traffic drops unexpectedly
- ❌ Distribution if visitors stop coming entirely

**Edge Cases:**
- If visitors suddenly stop arriving (e.g., event evacuation, early closure), remaining prizes may be undistributed
- Extended gaps between visitors near closing time can leave inventory
- The algorithm cannot create visitors - it can only maximize probability when visitors do arrive

## Simulation Results

### Poisson Distribution (100 visitors/hour)
- Total Plays: 1018
- Prizes Distributed: 198/200 (99%)
- Win Rate: 19.4%
- Distribution: Even throughout the day

### Peak Hours Profile (Variable Traffic)
- Total Plays: 953
- Prizes Distributed: 192/200 (96%)
- Win Rate: 20.1%
- Distribution: Adapts to traffic peaks

### High Traffic (150 visitors/hour)
- Total Plays: 1502
- Prizes Distributed: 200/200 (100%)
- Win Rate: 13.3%
- Distribution: Complete depletion

## Implementation

### Core Services

**AdaptiveDistribution** (`src/services/AdaptiveDistribution.ts`)
- Tracks `lastPrizeTime` state
- Calculates probability based on time intervals
- No visitor tracking required

**PrizeEngine** (`src/services/PrizeEngine.ts`)
- Calls `adaptiveDistribution.checkAward(currentTime, prizesRemaining)`
- Calls `adaptiveDistribution.recordPrizeAwarded(time)` on award
- Supports multiple prize types

### Example Flow

```typescript
// Hour 14:30, 100 lottery tickets left, 5.5 hours remaining
targetInterval = (5.5 × 3600) / 100 = 198s (3.3 minutes)
windowStart = 198 × 0.7 = 139s
windowEnd = 198 × 1.5 = 297s

// 2 minutes (120s) since last prize
position = "TOO SOON" (120 < 139)
probability = 2%
```

```typescript
// 3 minutes (180s) since last prize
position = "IN WINDOW" (139 < 180 < 297)
progress = (180 - 139) / (297 - 139) = 0.26
probability = 15% + (0.26 × 60%) = 30.6%
```

```typescript
// 6 minutes (360s) since last prize
position = "OVERDUE" (360 > 297)
probability = 95%
```

## Testing

Run simulations to validate algorithm:

```bash
cd docker/app/server

# Poisson distribution (uniform traffic)
npm run simulate:poisson

# Peak hours (variable traffic)
npm run simulate:peak

# Custom parameters
npm run simulate:custom -- --profile poisson --base-rate 150
```

View interactive HTML reports in `simulation-results/` directory.

## Voucher Code System (Phase 2)

Each prize type has a pool of pre-loaded voucher codes:

```
Prize Type          | Voucher Pool
--------------------|------------------
Win for Life        | [code1, code2, ...]
Super Win for Life  | [code1, code2, ...]
```

When a prize is won:
1. Next available voucher code is retrieved from pool
2. Code is marked as used in database
3. Receipt is printed with QR code for redemption

## References

- **Implementation**: `docker/app/server/src/services/AdaptiveDistribution.ts`
- **Configuration**: `docker/app/server/content/settings.json`
- **Types**: `docker/app/server/src/types/prizes.ts`
- **Simulation**: `docker/app/server/simulate-prizes.ts`
- **Simulation Library**: `docker/app/server/scripts/lib/`
- **Report Template**: `docker/app/server/scripts/templates/simulation-report.html`
