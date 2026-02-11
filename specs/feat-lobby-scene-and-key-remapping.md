# Plan: Restore Lobby Scene & Remap Player Keys

## Task Description
Re-enable the full game flow (Lobby → Countdown → Game → Result → Lobby) which is currently bypassed by a dev shortcut in Bootstrap, and remap keyboard controls for all 6 players to use specific number keys and arrow keys.

## Objective
When complete:
1. The game starts at the Lobby scene where players join by holding both their assigned keys for 3 seconds
2. All 6 scenes flow correctly: Bootstrap → Preload → Lobby → Countdown → Game → Result → Lobby
3. Keyboard mappings are consistent across all scenes (Lobby, Countdown, Game) using the new mapping:
   - Player 1: `1` (left) / `2` (right)
   - Player 2: `3` (left) / `4` (right)
   - Player 3: `5` (left) / `6` (right)
   - Player 4: `7` (left) / `8` (right)
   - Player 5: `9` (left) / `0` (right)
   - Player 6: `Arrow Left` / `Arrow Right`

## Problem Statement
Currently `Bootstrap.ts` has a dev shortcut at line 56 that skips straight to the Game scene with hardcoded `[0, 1]` players, bypassing Lobby and Countdown entirely. Additionally, each scene (Lobby, Countdown, Game) defines its own keyboard mappings independently and inconsistently — Lobby uses `Arrow/AD/JL/Numpad/UO/BM`, Game uses `Arrow/AD`, and Countdown uses `Arrow/AD`. The new key mapping needs to be centralized so all scenes use the same bindings.

## Solution Approach
1. Create a shared `PlayerKeyMap` constant defining the key bindings for all 6 players in one place
2. Update Bootstrap to route to Lobby instead of Game
3. Update Lobby, Countdown, and Game scenes to use the shared key mapping
4. Ensure the Game scene transitions to Result (not restart), and Result transitions back to Lobby

## Relevant Files

- `docker/app/client/src/scenes/Bootstrap.ts` — Remove dev shortcut, route to Lobby
- `docker/app/client/src/scenes/Lobby.ts` — Update key mapping for join gesture
- `docker/app/client/src/scenes/Countdown.ts` — Update key mapping for paddle practice
- `docker/app/client/src/scenes/Game.ts` — Update key mapping for gameplay; fix endGame to go to Result
- `docker/app/client/src/scenes/Result.ts` — Already transitions to Lobby (confirmed at line 437)
- `docker/app/client/src/consts/GameConstants.ts` — Add centralized key mapping constant

### New Files
None — all changes fit in existing files.

## Step by Step Tasks

### 1. Add centralized key mapping to GameConstants.ts
- Add a `PLAYER_KEYS` constant array to `docker/app/client/src/consts/GameConstants.ts`
- Each entry maps a player index to a pair of Phaser key codes (`left`, `right`)
- Use the requested mapping:
  ```typescript
  export const PLAYER_KEYS = [
    { left: Phaser.Input.Keyboard.KeyCodes.ONE, right: Phaser.Input.Keyboard.KeyCodes.TWO },       // P1
    { left: Phaser.Input.Keyboard.KeyCodes.THREE, right: Phaser.Input.Keyboard.KeyCodes.FOUR },     // P2
    { left: Phaser.Input.Keyboard.KeyCodes.FIVE, right: Phaser.Input.Keyboard.KeyCodes.SIX },       // P3
    { left: Phaser.Input.Keyboard.KeyCodes.SEVEN, right: Phaser.Input.Keyboard.KeyCodes.EIGHT },    // P4
    { left: Phaser.Input.Keyboard.KeyCodes.NINE, right: Phaser.Input.Keyboard.KeyCodes.ZERO },      // P5
    { left: Phaser.Input.Keyboard.KeyCodes.LEFT, right: Phaser.Input.Keyboard.KeyCodes.RIGHT },     // P6
  ] as const;
  ```
- Note: Phaser key codes use `ONE`, `TWO`, etc. for number keys (not `DIGIT_1`). Verify from Phaser source.

### 2. Update Bootstrap.ts to route to Lobby
- In `handlePreloadFinished()` (line 51-59), change:
  ```typescript
  // DEV: Skip directly to Game scene for testing
  this.scene.start(SceneKeys.Game, { players: [0, 1] });
  ```
  to:
  ```typescript
  this.scene.start(SceneKeys.Lobby);
  ```

### 3. Update Lobby.ts to use new key mapping
- Import `PLAYER_KEYS` from `GameConstants`
- Replace the `setupInput()` method (lines 273-317) to build `this.playerKeys` from `PLAYER_KEYS`:
  ```typescript
  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    this.playerKeys = PLAYER_KEYS.map(mapping => ({
      left: keyboard.addKey(mapping.left),
      right: keyboard.addKey(mapping.right),
    }));

    keyboard.on("keydown-ENTER", () => {
      if (this.joinedPlayers.size >= PLAYER.MIN_PLAYERS) {
        this.startGame();
      }
    });
  }
  ```
- Update the slot key hint text in `drawSlot()` (line 188). Currently shows slot index + 1 as text hint. Update hints to show the actual assigned keys for better player guidance. For players 1-5, show the two number keys (e.g., "1/2"). For player 6, show "←/→".

### 4. Update Countdown.ts to use new key mapping
- Import `PLAYER_KEYS` from `GameConstants`
- Remove the module-level key variables (`countdownCursors`, `countdownPlayer2Left`, `countdownPlayer2Right`)
- Add a class property: `private playerKeys: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }[] = [];`
- In `create()`, build `this.playerKeys` from `PLAYER_KEYS` (same pattern as Lobby)
- In `update()`, loop through `this.players` and poll each player's keys:
  ```typescript
  update(_time: number, delta: number): void {
    for (let i = 0; i < this.players.length; i++) {
      const playerIndex = this.players[i];
      const keys = this.playerKeys[playerIndex];
      if (!keys) continue;

      if (keys.left.isDown) {
        this.gameArena?.movePaddle(playerIndex, -1, delta);
      } else if (keys.right.isDown) {
        this.gameArena?.movePaddle(playerIndex, 1, delta);
      }
    }
  }
  ```
- Clean up keys in `shutdown()` (already does `removeAllKeys`)

### 5. Update Game.ts to use new key mapping
- Import `PLAYER_KEYS` from `GameConstants`
- Remove module-level key variables (`cursors`, `player2Left`, `player2Right`)
- Add a class property: `private playerKeys: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }[] = [];`
- In `create()`, build `this.playerKeys` from `PLAYER_KEYS` (same pattern)
- In `update()`, replace the hardcoded 2-player input polling with a loop through `this.players`:
  ```typescript
  for (let i = 0; i < this.players.length; i++) {
    const playerIndex = this.players[i];
    const keys = this.playerKeys[playerIndex];
    if (!keys) continue;

    if (keys.left.isDown) {
      this.gameArena?.movePaddle(playerIndex, -1, delta);
    } else if (keys.right.isDown) {
      this.gameArena?.movePaddle(playerIndex, 1, delta);
    }
  }
  ```

### 6. Fix Game.ts endGame to transition to Result
- In `endGame()` (lines 261-282), replace the current restart logic:
  ```typescript
  // Restart game immediately (skip result screen)
  this.time.delayedCall(500, () => {
    this.scene.restart({ players: this.players });
  });
  ```
  with a transition to Result:
  ```typescript
  this.time.delayedCall(500, () => {
    this.scene.start(SceneKeys.Result, {
      score: finalScore,
      playerCount: playerCount,
      isTeamGame: true,
    });
  });
  ```

### 7. Validate the full game loop
- Start the dev server and verify:
  - Game boots into Lobby (not Game)
  - Holding keys `1` + `2` for 3 seconds joins Player 1
  - Holding keys `3` + `4` for 3 seconds joins Player 2
  - With 2+ players joined, pressing ENTER starts Countdown
  - Countdown transitions to Game
  - Player controls work with correct key mappings during Game
  - Game end transitions to Result
  - Result auto-returns to Lobby after 10 seconds (or Space to skip)

## Acceptance Criteria
- [ ] Bootstrap routes to Lobby, not Game
- [ ] All 6 players can join in Lobby with their assigned key pairs
- [ ] Key mappings are defined in one place (`PLAYER_KEYS` in GameConstants)
- [ ] All scenes (Lobby, Countdown, Game) use the shared key mapping
- [ ] Full game loop works: Lobby → Countdown → Game → Result → Lobby
- [ ] Lobby shows correct key hints for each player slot
- [ ] Players can control their paddles during Countdown and Game with new keys
- [ ] Space and Escape dev shortcuts still work in Game scene

## Validation Commands
- `cd docker/app/client && npx tsc --noEmit` — Ensure TypeScript compiles cleanly
- `cd docker/app/client && npm run dev` — Start dev server and manually test game loop

## Notes
- The `PLAYER_KEYS` constant references `Phaser.Input.Keyboard.KeyCodes` which requires a Phaser import. Since `GameConstants.ts` currently doesn't import Phaser, we need to either import it or use raw key code numbers. Using raw numbers is simpler and avoids the import: `ONE=49, TWO=50, THREE=51, FOUR=52, FIVE=53, SIX=54, SEVEN=55, EIGHT=56, NINE=57, ZERO=48, LEFT=37, RIGHT=39`. This approach keeps GameConstants free of Phaser imports.
- Player 2's inverted controls in the current Game.ts (`A` moves right, `D` moves left — see line 297) should NOT be carried over. The new mapping is straightforward: left key = counterclockwise, right key = clockwise for all players.
