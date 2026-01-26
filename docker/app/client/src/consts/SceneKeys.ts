/**
 * Scene key identifiers for the Phaser game
 *
 * Scene lifecycle flow:
 * 1. Bootstrap - Loads settings from server, initializes game
 * 2. Preload - Loads all game assets
 * 3. Lobby - Player join screen (hold buttons to join)
 * 4. Countdown - 3-2-1-GO! before gameplay
 * 5. Game - Main circular Pong gameplay
 * 6. Result - Team score display
 */
enum SceneKeys {
  /** Initial bootstrap scene that loads settings */
  Bootstrap = "bootstrap",
  /** Asset preloading scene */
  Preload = "preload",
  /** Idle/attract scene - waits for buzzer press */
  Idle = "idle",
  /** Lobby scene - players join by holding buttons */
  Lobby = "lobby",
  /** Countdown scene - 3-2-1-GO! before game */
  Countdown = "countdown",
  /** Main game scene - circular Pong gameplay */
  Game = "game",
  /** Combined win/lose result scene */
  Result = "result",
}

export default SceneKeys;
