/**
 * Shared game events for Socket.io communication
 * Used by both client (Phaser scenes) and server
 *
 * IMPORTANT: This file is shared between client and server to ensure
 * event name consistency across the application.
 */

enum GameEvents {
  /** Emitted when asset preload is complete */
  PreloadFinished = "preload-finished",

  /** Reload command from server */
  Reload = "reload",

  /** Game paused by admin */
  GamePaused = "game-paused",

  /** Game resumed by admin */
  GameResumed = "game-resumed",

  /** Player input (button press/release) from Phidgets */
  PlayerInput = "player-input",

  /** Player has joined the game */
  PlayerJoined = "player-joined",

  /** Player has left the game */
  PlayerLeft = "player-left",

  /** Game countdown started */
  GameStart = "game-start",

  /** Game has ended */
  GameEnd = "game-end",

  /** Score update */
  ScoreUpdate = "score-update",
}

export interface PlayerInputPayload {
  player: number;
  direction: "left" | "right";
  pressed: boolean;
  timestamp: number;
}

export default GameEvents;
