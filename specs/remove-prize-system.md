# Implementation Plan: Remove Prize System

## Overview

**Objective**: Completely remove the prize/prizing system from the Mobiliar Arena codebase, including the adaptive distribution algorithm, prize database, admin/promoter panels, QR code management, and all related infrastructure.

**Scope**: This is a large-scale removal affecting 25+ files for deletion and 9+ files for modification across server, client, and shared code.

**Risk Level**: Medium-High (extensive changes to core server initialization and game flow)

## Problem Statement

The codebase contains a comprehensive prize distribution system that includes:
- Two-tier prize engine (inventory prizes + consolation prizes)
- Adaptive probability distribution algorithm
- SQLite database with 5+ prize-related tables
- Admin and promoter control panels
- QR code management and tracking
- PDF report generation
- Prize simulation and testing tools
- Receipt printing integration

This system needs to be completely removed while ensuring:
1. The core game (circular Pong) continues to function
2. No broken imports or TypeScript errors
3. The game flow (Lobby → Game → Result) remains intact
4. The Result scene displays scores without prize logic

## Technical Approach

### Architecture Changes

**Before**:
```
Server: Bootstrap → Initialize PrizeEngine → Setup Routes → Game Loop
Result Scene: Display Score + Prize Outcome
```

**After**:
```
Server: Bootstrap → Setup Routes → Game Loop (simplified)
Result Scene: Display Score Only
```

### Removal Strategy

**Three-phase approach**:
1. **Phase 1: Delete Files** - Remove all prize-specific files
2. **Phase 2: Clean Integrations** - Remove prize code from core files
3. **Phase 3: Verify & Test** - Ensure system works without prizes

## Implementation Steps

### Phase 1: Delete Prize-Specific Files (25 files)

#### 1.1 Delete Core Prize Services
```bash
rm docker/app/server/src/services/PrizeEngine.ts
rm docker/app/server/src/services/AdaptiveDistribution.ts
rm docker/app/server/src/database/PrizeDatabase.ts
rm docker/app/server/src/services/ReportGenerator.ts
```

#### 1.2 Delete Database Schema
```bash
rm docker/app/server/src/database/schema.sql
```

#### 1.3 Delete Type Definitions
```bash
rm docker/app/server/src/types/prizes.ts
rm docker/app/shared/PrizeTextureKeys.ts
```

#### 1.4 Delete API Routes
```bash
rm docker/app/server/src/routes/admin.ts
rm docker/app/server/src/routes/promoter.ts
rm docker/app/server/src/routes/dashboard.ts
```

#### 1.5 Delete Frontend Panels
```bash
rm docker/app/server/public/admin.html
rm docker/app/server/public/admin.js
rm docker/app/server/public/admin-login.html
rm docker/app/server/public/promoter.html
rm docker/app/server/public/promoter.js
rm docker/app/server/public/promoter-login.html
rm docker/app/server/public/dashboard.html
rm docker/app/server/public/dashboard.js
```

#### 1.6 Delete Configuration Files
```bash
rm docker/app/server/content/prizes.json
rm docker/app/server/content/distribution-config.json
```

#### 1.7 Delete Testing & Simulation
```bash
rm docker/app/server/scripts/lib/SimulationReporter.ts
rm docker/app/server/scripts/lib/TrafficGenerator.ts
rm docker/app/server/simulate-prizes.test.ts
```

#### 1.8 Delete Utilities & Middleware
```bash
rm docker/app/server/src/utils/printer.ts
rm docker/app/server/src/middleware/auth.ts
```

### Phase 2: Modify Core Files

#### 2.1 Modify `docker/app/server/app.ts`

**Remove**:
- Import statements for PrizeEngine, PrizeDatabase, ReportGenerator
- Import statements for admin/promoter/dashboard routes
- Import statement for auth middleware
- PrizeDatabase initialization
- PrizeEngine initialization
- Pause callback functions
- Route registrations for /api/admin, /api/promoter, /api/dashboard
- Static file serving for admin/promoter/dashboard HTML pages

**Keep**:
- Express server setup
- Socket.io configuration
- Game socket event handlers
- Settings loader
- Phidgets input handling (if present)
- Game state management

**Before (example)**:
```typescript
import { PrizeEngine } from './services/PrizeEngine';
import { PrizeDatabase } from './database/PrizeDatabase';
import { createAdminRoutes } from './routes/admin';
import { createPromoterRoutes } from './routes/promoter';
import { createDashboardRoutes } from './routes/dashboard';

const prizeDb = new PrizeDatabase('./data/prizes.db');
const prizeEngine = new PrizeEngine(prizeDb, settings, ...);

app.use('/api/admin', createAdminRoutes(prizeDb));
app.use('/api/promoter', createPromoterRoutes(prizeEngine, ...));
app.use('/api/dashboard', createDashboardRoutes(prizeEngine, ...));
```

**After**:
```typescript
// Removed: All prize-related imports and initialization
// Game server continues with core functionality only
```

#### 2.2 Modify `docker/app/server/src/types/settings.ts`

**Remove**:
- `PrizesConfig` interface
- `AdaptiveAlgorithmConfig` interface (if defined here)
- All prize-related fields from `GameSettings`

**Before**:
```typescript
export interface GameSettings {
  // ... other settings
  prizes: PrizesConfig;
}

export interface PrizesConfig {
  algorithm: AdaptiveAlgorithmConfig;
  operatingHours: {
    openTime: string;
    closeTime: string;
  };
}
```

**After**:
```typescript
export interface GameSettings {
  // ... other settings only (no prizes field)
}
```

#### 2.3 Modify `docker/app/server/src/services/SettingsLoader.ts`

**Remove**:
- Validation logic for prize settings
- Default values for prize configuration
- Any prize-related imports

**Keep**:
- Game settings validation (lobby, game duration, physics, etc.)
- Theme settings
- Other non-prize configuration

#### 2.4 Modify `docker/app/server/content/settings.json`

**Remove**:
```json
{
  "prizes": {
    "algorithm": { ... },
    "operatingHours": { ... }
  }
}
```

**Keep**: All other game settings (lobby, game, themes, etc.)

#### 2.5 Modify `docker/app/client/src/types/game.ts`

**Remove**:
```typescript
export interface PrizeOutcome {
  prizeId: string;
  prizeType: string;
  displayName: string;
  textureKey: string;
  timestamp: string;
  qrCode?: string;
}
```

**Remove** from GameSettings:
- Any prize-related fields

#### 2.6 Modify `docker/app/client/src/scenes/Result.ts`

**Remove**:
- Prize outcome display logic
- Prize texture rendering
- QR code display
- Win/lose conditional UI based on prizes

**Keep**:
- Score display
- High score detection
- Team score animation
- "Better together" messaging
- Continue/replay flow

**Before (example)**:
```typescript
if (prizeOutcome && prizeOutcome.prizeType === 'inventory') {
  this.showPrizeWin(prizeOutcome);
} else {
  this.showConsolation();
}
```

**After**:
```typescript
// Always show score result, no prize logic
this.showTeamScore(this.score);
```

#### 2.7 Modify `docker/app/client/src/consts/TextureKeys.ts`

**Remove**:
- Prize-related texture keys (e.g., "giveaway", "prize-a", "prize-b")
- QR code texture keys

**Keep**:
- Game texture keys (background, ball, logo, etc.)

#### 2.8 Modify `docker/app/server/src/middleware/tunnelProtection.ts`

**Review and remove**:
- Any references to prize routes (/api/admin, /api/promoter, etc.)
- Prize-related tunnel blocking logic (if any)

**Keep**:
- Core tunnel protection for game access

#### 2.9 Modify `docker/app/server/package.json`

**Remove dependencies** (only if exclusively used by prize system):
```json
{
  "dependencies": {
    "better-sqlite3": "^x.x.x",  // Only if used for prizes
    "multer": "^x.x.x",           // Only if used for QR CSV upload
    "pdfkit": "^x.x.x"            // Only if used for prize reports
  }
}
```

**Investigation needed**: Check if these packages are used elsewhere:
- `better-sqlite3` - Prize database only? → **REMOVE**
- `multer` - CSV upload only? → **REMOVE**
- `pdfkit` - Prize reports only? → **REMOVE**

**After removing, run**:
```bash
npm install
```

### Phase 3: Verification & Testing

#### 3.1 TypeScript Compilation
```bash
cd docker/app/server
npm run build

cd ../client
npm run build
```

**Expected**: No TypeScript errors, clean build

#### 3.2 Server Startup Test
```bash
cd docker/app/server
npm start
```

**Verify**:
- Server starts without errors
- No missing module errors
- No database initialization errors
- Socket.io server running
- No warnings about missing prize routes

#### 3.3 Game Flow Test

**Manual test sequence**:
1. Open game client (http://localhost:8080)
2. Join players in Lobby (keyboard 1-6)
3. Start game (Enter)
4. Play through 60-second game
5. View Result scene
6. Verify score displays correctly
7. Return to Lobby

**Expected**:
- All scenes load without errors
- Result scene shows team score
- No console errors about missing prize data
- Game loop completes successfully

#### 3.4 Route Verification

**Test that these routes return 404**:
- `GET /api/admin/*`
- `GET /api/promoter/*`
- `GET /api/dashboard`
- `GET /admin.html`
- `GET /promoter.html`
- `GET /dashboard.html`

**Expected**: All return 404 Not Found (routes removed)

#### 3.5 Socket.io Event Check

**Review socket event handlers** in app.ts:
- Remove any prize-related event emissions
- Verify game events still work (player join, game start, game end)

**Events to verify**:
- `player:join` ✓
- `game:start` ✓
- `game:update` ✓
- `game:end` ✓
- `prize:award` ✗ (should be removed)

## Edge Cases & Considerations

### 1. Existing Database Files
**Problem**: Deployed instances may have existing `prizes.db` files

**Solution**:
- Database is optional - server won't create it if PrizeDatabase isn't initialized
- Old files can be manually deleted or left (won't cause errors)

### 2. Environment Variables
**Problem**: `.env` may reference prize-related vars (PRINTER_IP, PRINTER_ENABLED)

**Solution**:
- Remove from `.env.example` if present
- Document that these vars are no longer used
- They won't cause errors if present (just unused)

### 3. Game Settings Migration
**Problem**: Existing `settings.json` files have prize section

**Solution**:
- Update default `settings.json` to remove prizes
- SettingsLoader should not fail if prizes field is present (just ignore it)
- Add migration note in commit message

### 4. Result Scene Timing
**Problem**: Result scene may have timing based on prize animations

**Solution**:
- Adjust Result scene duration if needed
- Ensure score display has appropriate timing
- Test that scene doesn't feel too quick or too slow

### 5. High Score Tracking
**Problem**: High scores might have been tied to prize awards

**Solution**:
- Keep high score tracking (it's independent)
- Remove any prize-related celebrations
- Keep confetti/celebration for high scores

## Rollback Strategy

If issues arise during removal:

1. **Git checkout**: Revert specific files
2. **Partial removal**: Keep some files temporarily
3. **Feature flag**: Add `PRIZES_ENABLED` env var (not recommended)

**Recommended**: Complete removal in one PR with thorough testing

## Success Criteria

✅ **Build Success**
- Server builds without TypeScript errors
- Client builds without TypeScript errors
- No missing module errors

✅ **Server Startup**
- Server starts without initialization errors
- No database errors
- All remaining routes work

✅ **Game Flow**
- Players can join in Lobby
- Game starts and runs for 60 seconds
- Result scene displays score
- Return to Lobby works

✅ **Code Cleanup**
- No unused imports
- No dead code references
- No orphaned types

✅ **Documentation**
- Update README if it mentions prizes
- Remove prize-related setup instructions
- Update architecture docs

## Testing Checklist

**Before Deletion**:
- [ ] Identify all files that import from prize modules
- [ ] List all socket events related to prizes
- [ ] Check environment variables for prize-related config
- [ ] Review settings.json structure

**During Modification**:
- [ ] Remove all prize imports from app.ts
- [ ] Update GameSettings interface
- [ ] Clean Result.ts of prize logic
- [ ] Remove prize texture keys
- [ ] Update package.json dependencies

**After Deletion**:
- [ ] TypeScript compilation succeeds
- [ ] Server starts without errors
- [ ] Game flow works end-to-end
- [ ] No console errors in browser
- [ ] Prize routes return 404
- [ ] No broken links in HTML files

## Dependencies to Remove

Based on investigation, these packages can be removed:

```json
{
  "better-sqlite3": "Prize database only - REMOVE",
  "multer": "QR code CSV upload only - REMOVE",
  "pdfkit": "Prize PDF reports only - REMOVE"
}
```

**Verify before removal**: Grep codebase to confirm no other usage:
```bash
grep -r "better-sqlite3" docker/app/server/src --exclude-dir=node_modules
grep -r "multer" docker/app/server/src --exclude-dir=node_modules
grep -r "pdfkit" docker/app/server/src --exclude-dir=node_modules
```

## File-by-File Modification Guide

### `app.ts` - Detailed Changes

**Remove these imports**:
```typescript
import { PrizeEngine } from './services/PrizeEngine';
import { PrizeDatabase } from './database/PrizeDatabase';
import { ReportGenerator } from './services/ReportGenerator';
import { createAdminRoutes } from './routes/admin';
import { createPromoterRoutes } from './routes/promoter';
import { createDashboardRoutes } from './routes/dashboard';
import { requireAuth, requirePromoterAuth } from './middleware/auth';
```

**Remove initialization code**:
```typescript
// Remove database initialization
const prizeDb = new PrizeDatabase(path.join(__dirname, '../data/prizes.db'));

// Remove engine initialization
const prizeEngine = new PrizeEngine(
  prizeDb,
  settings,
  getPausedFn,
  setPausedFn,
  getCloseTimeFn
);

// Remove pause callbacks
const handlePrizeEngineAutoPause = (reason: string) => {
  console.log('Auto-pause triggered:', reason);
  setPaused(true);
};
```

**Remove route registrations**:
```typescript
// Remove admin routes
app.use('/api/admin', createAdminRoutes(prizeDb));

// Remove promoter routes
app.use('/api/promoter', createPromoterRoutes(
  prizeEngine,
  getPausedFn,
  setPausedFn,
  prizeDb,
  getPromotionEndTimeFn,
  setPromotionEndTimeFn
));

// Remove dashboard routes
app.use('/api/dashboard', createDashboardRoutes(
  prizeEngine,
  getPausedFn,
  getPromotionEndTimeFn,
  getMachineNameFn
));
```

**Remove static file serving**:
```typescript
// Remove these express.static middleware if they serve prize panel pages
app.get('/admin.html', requireAuth, (req, res) => { ... });
app.get('/promoter.html', requirePromoterAuth, (req, res) => { ... });
app.get('/dashboard.html', (req, res) => { ... });
```

**Remove socket events**:
```typescript
socket.on('game:end', async (data) => {
  // REMOVE: Prize determination logic
  const prizeOutcome = prizeEngine.determinePrizeOutcome();

  // KEEP: Score tracking and game state
  const score = data.score;
  console.log('Game ended, score:', score);
});
```

### `Result.ts` - Detailed Changes

**Before** (with prizes):
```typescript
create() {
  const prizeOutcome = this.registry.get('prizeOutcome');

  if (prizeOutcome && prizeOutcome.prizeType === 'inventory') {
    this.showPrizeWin(prizeOutcome);
  } else {
    this.showConsolation();
  }
}

showPrizeWin(outcome: PrizeOutcome) {
  // Display prize graphic
  // Show QR code
  // Celebration animation
}

showConsolation() {
  // Display "better luck next time"
  // Show wish message
}
```

**After** (score only):
```typescript
create() {
  const score = this.registry.get('teamScore') || 0;
  const highScore = this.registry.get('highScore') || 0;

  this.showTeamScore(score, highScore);

  if (score > highScore) {
    this.showNewHighScore();
  }
}

showTeamScore(score: number, highScore: number) {
  // Display team score
  // Show "Besser zusammen" message
  // Celebration animation
}

showNewHighScore() {
  // Confetti or special celebration
}
```

## Timeline Estimate

**Phase 1: Delete Files** - 30 minutes
- Straightforward file deletion
- No merge conflicts expected

**Phase 2: Modify Core Files** - 2-3 hours
- app.ts modifications (complex)
- Type system updates
- Settings cleanup
- Client scene simplification

**Phase 3: Testing & Verification** - 1-2 hours
- Build testing
- Manual game flow testing
- Route verification
- Bug fixes if needed

**Total**: 4-6 hours

## Post-Removal Cleanup

After successful removal:

1. **Update Documentation**
   - Remove prize system from README
   - Update architecture diagrams
   - Remove setup instructions for prize admin

2. **Git Commit Message**
   ```
   refactor: remove prize distribution system

   Removes the entire prize/prizing infrastructure including:
   - PrizeEngine, AdaptiveDistribution, PrizeDatabase services
   - Admin, promoter, and dashboard panels
   - Prize configuration and simulation tools
   - QR code management and tracking
   - PDF report generation

   The core game (circular Pong) continues to function with
   score-only Result scene.

   BREAKING CHANGE: Prize-related API routes, database, and
   configuration are no longer available.
   ```

3. **Deploy Notes**
   - Existing prize database files can be ignored/deleted
   - Environment variables (PRINTER_IP, etc.) no longer used
   - Admin/promoter/dashboard URLs will 404

## Risk Mitigation

**Medium Risk**: Server fails to start
- **Mitigation**: Thorough testing before deployment
- **Fallback**: Git revert

**Low Risk**: Result scene rendering issues
- **Mitigation**: Test Result scene extensively
- **Fallback**: Adjust timing/animations as needed

**Low Risk**: Orphaned imports in tests
- **Mitigation**: Run full test suite
- **Fallback**: Update test files

## Conclusion

This plan provides a comprehensive, step-by-step approach to removing the prize system from Mobiliar Arena while maintaining core game functionality. The removal is straightforward but extensive, requiring careful attention to imports, types, and initialization code. Thorough testing at each phase ensures a smooth transition to a prize-free implementation.
