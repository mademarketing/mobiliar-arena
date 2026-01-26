# Operating Hours & Timezone Handling

**Critical:** All prize distribution logic respects kiosk operating hours using Swiss timezone (Europe/Zurich).

## Configuration

Operating hours are defined in `settings.json`:

```json
{
  "prizes": {
    "algorithm": {
      "openTime": "10:00",
      "closeTime": "20:00"
    }
  }
}
```

**Note**: Operating hours may vary by roadshow venue - ensure easy configuration through admin interface.

## Prize Distribution During Operating Hours

### Before Opening (before 10:00 Swiss time)

**Scheduled Prizes:** ❌ Not available
- Check skipped entirely in PrizeEngine
- Falls through to inventory tier

**Inventory Prizes:** ❌ Not available
- AdaptiveDistribution returns 0% probability
- Falls through to consolation tier

**Consolation Prizes:** ✅ Available
- Visitors always get consolation (lose scene)

### During Operating Hours (10:00 - 20:00 Swiss time)

**Scheduled Prizes:** ✅ Available (highest priority)
- Awarded if scheduled time has passed
- Example: Prize scheduled for 14:30 will be awarded on first buzzer press at or after 14:30

**Inventory Prizes:** ✅ Available (adaptive probability)
- Probability calculated based on remaining time and inventory
- Adaptive algorithm distributes lottery tickets throughout the day

**Consolation Prizes:** ✅ Available (fallback)
- Awarded if no scheduled/inventory prizes given

### After Closing (after 20:00 Swiss time)

**Scheduled Prizes:** ❌ Not available
- Operating hours check fails
- Falls through to inventory tier

**Inventory Prizes:** ⚡ Urgent mode (95% probability)
- Algorithm tries to deplete remaining inventory
- Any remaining lottery tickets get awarded quickly

**Consolation Prizes:** ✅ Available (fallback)
- Awarded on the 5% of plays that don't win urgent inventory

## Edge Case: Scheduled Prizes Outside Operating Hours

### Problem Scenario

Admin schedules a gift card for 08:00 (before opening):
```sql
INSERT INTO scheduled_prizes (prize_id, datetime)
VALUES (2, '2025-11-24 08:00:00');
```

### Expected Behavior

1. **At 08:00**: Kiosk is closed, prize is in database but not checked
2. **At 10:00** (opening time): Kiosk opens
3. **At 10:01** (first buzzer press):
   - PrizeEngine checks `isWithinOperatingHours()` → ✅ true
   - Database query finds prize (scheduled for 08:00, not yet awarded)
   - **Prize is awarded** on first play after opening

### Why This Works

The scheduled prize check uses two conditions:
```typescript
// 1. Operating hours check (Swiss timezone)
const isOpen = isWithinOperatingHours(openTime, closeTime, currentTime);

if (isOpen) {
  // 2. Database query: datetime <= currentTime
  const scheduledPrizes = this.db.getScheduledPrizesForTime(currentTime.toISOString());
}
```

At 10:01:
- Condition 1: ✅ `isOpen = true` (10:01 is within 10:00-20:00)
- Condition 2: ✅ Prize scheduled for 08:00 is <= 10:01

**Result**: Prize is awarded on first play after opening, even though scheduled time was before opening.

### Alternative Scenarios

**Scheduled for 22:00 (after closing):**
- At 22:00: Kiosk is closed
- Next day at 10:00: Prize is still pending (datetime <= currentTime still true)
- **Prize is awarded** on first play next day

**Scheduled for 14:30 (during hours):**
- At 14:30: Kiosk is open, prize is awarded immediately (if buzzer pressed)
- At 14:35: Prize is still awarded (if no one pressed before)
- **Normal behavior** - prize waits for next buzzer press

## Timezone Implementation

All time comparisons use Swiss timezone (Europe/Zurich):

### Utility Functions

**`getSwissTime(date)`** - Converts any Date to Swiss local time
```typescript
const swissTime = getSwissTime(new Date());
// Returns Date object where getHours(), getMinutes() return Swiss time
```

**`isWithinOperatingHours(openTime, closeTime, date)`** - Checks if time is within hours
```typescript
const isOpen = isWithinOperatingHours("10:00", "20:00", new Date());
// Returns true if current Swiss time is 10:00-19:59
```

**`getSwissDate(date)`** - Gets date in YYYY-MM-DD format (Swiss timezone)
```typescript
const today = getSwissDate();
// Returns "2025-11-24" based on Swiss calendar
```

### Why Swiss Timezone Matters

The server might be running in different timezones:
- **Development**: Developer's local machine (could be anywhere)
- **Production**: Intel NUC in Switzerland (might be UTC, might be Swiss)
- **Docker**: Containers often default to UTC

By always converting to Swiss timezone, we ensure:
- Operating hours (10:00-20:00) match kiosk's physical location
- Date boundaries align with Swiss calendar (inventory resets at midnight Swiss time)
- Scheduled prizes trigger at correct local time

### Example Timeline

Server running in **UTC** timezone (1 hour behind Swiss time in winter):

| UTC Time | Swiss Time | Server `new Date()` | What Happens |
|----------|------------|---------------------|--------------|
| 09:00 | 10:00 | `2025-11-24T09:00:00.000Z` | `getSwissTime()` → 10:00, kiosk opens ✅ |
| 13:30 | 14:30 | `2025-11-24T13:30:00.000Z` | Prize scheduled for 14:30 Swiss time is awarded ✅ |
| 19:00 | 20:00 | `2025-11-24T19:00:00.000Z` | Kiosk closes ✅ |

Without timezone conversion:
- Kiosk would open at 10:00 UTC (11:00 Swiss) ❌
- Scheduled prizes would trigger at wrong times ❌
- Date boundaries would be wrong ❌

## Testing Operating Hours

### Manual Testing

Test outside operating hours:
```bash
cd docker/app/server
npm run test-buzzer
```

Expected:
- Before 10:00 Swiss time: Always get consolation (lose scene)
- 10:00-20:00 Swiss time: Can get scheduled/inventory prizes
- After 20:00 Swiss time: High probability of inventory (urgent mode), or consolation

### Unit Testing

Test timezone utilities:
```typescript
import { getSwissTime, isWithinOperatingHours } from "../utils/timezone";

// Simulate 08:00 Swiss time (before opening)
const before = new Date("2025-11-24T07:00:00.000Z"); // UTC time
const isOpen = isWithinOperatingHours("10:00", "20:00", before);
console.log(isOpen); // false

// Simulate 14:00 Swiss time (during hours)
const during = new Date("2025-11-24T13:00:00.000Z"); // UTC time
const isOpen2 = isWithinOperatingHours("10:00", "20:00", during);
console.log(isOpen2); // true
```

## Database Considerations

### Scheduled Prize Storage

Scheduled prizes are stored as ISO timestamps (UTC):
```sql
CREATE TABLE scheduled_prizes (
  datetime TEXT NOT NULL  -- ISO format: "2025-11-24T14:30:00.000Z"
);
```

**Why UTC?** ISO timestamps are unambiguous and portable. The conversion to Swiss timezone happens in application code, not in database.

### Query Pattern

```typescript
// currentTime is UTC ISO string
const scheduledPrizes = this.db.getScheduledPrizesForTime(currentTime.toISOString());

// SQL: SELECT * FROM scheduled_prizes WHERE datetime <= ?
```

This works because:
1. Both `datetime` column and `currentTime` parameter are UTC
2. String comparison of ISO timestamps works correctly
3. Operating hours check is done separately in Swiss timezone

## Summary

✅ **Operating hours respected**: No inventory/scheduled prizes outside 10:00-20:00 Swiss time
✅ **Timezone safe**: All calculations use Europe/Zurich timezone
✅ **Edge cases handled**: Prizes scheduled outside hours are awarded on first play after opening
✅ **Server timezone independent**: Works regardless of server's local timezone setting
✅ **Database portable**: Uses UTC timestamps in database, converts to Swiss time in code
