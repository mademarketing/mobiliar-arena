/**
 * Scene key identifiers for the Phaser game
 *
 * Scene lifecycle flow:
 * 1. Bootstrap - Loads settings from server, initializes game
 * 2. Preload - Loads all game assets
 * 3. Content - Plays theme intro video
 * 4. Lobby - Player join screen (hold buttons to join)
 * 5. Countdown - 3-2-1-GO! before gameplay
 * 6. Game - Main circular Pong gameplay
 * 7. Result - Team score display
 */
enum SceneKeys {
  /** Initial bootstrap scene that loads settings */
  Bootstrap = "bootstrap",
  /** Asset preloading scene */
  Preload = "preload",
  /** Content scene - plays theme intro video */
  Content = "content",
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
