/**
 * Scene key identifiers for the Phaser game
 *
 * Scene lifecycle flow:
 * 1. Bootstrap - Loads settings from server, initializes game
 * 2. Preload - Loads all game assets
 * 3. Idle - Attract screen, waits for buzzer press
 * 4. Game - Main game scene (implement your game mechanic here)
 * 5. Result - Win celebration or lose consolation
 */
enum SceneKeys {
  /** Initial bootstrap scene that loads settings */
  Bootstrap = "bootstrap",
  /** Asset preloading scene */
  Preload = "preload",
  /** Idle/attract scene - waits for buzzer press */
  Idle = "idle",
  /** Main game scene - implement your game mechanic here */
  Game = "game",
  /** Combined win/lose result scene */
  Result = "result",
}

export default SceneKeys;
