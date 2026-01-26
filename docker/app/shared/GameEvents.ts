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

  /** Buzzer press event - emitted by server when physical button is pressed */
  BuzzerPress = "buzzer-press",

  /** Simulate buzzer press - for testing without physical hardware */
  SimulateBuzzerPress = "simulate-buzzer-press",

  /** Client requests a prize from the server */
  RequestPrize = "request-prize",

  /** Prize outcome determined and sent to client */
  PrizeAwarded = "prize-awarded",

  /** Reload command from server */
  Reload = "reload",

  /** Game paused by admin */
  GamePaused = "game-paused",

  /** Game resumed by admin */
  GameResumed = "game-resumed",

  /** Client notifies animation is complete */
  AnimationComplete = "animation-complete",

  /** Client notifies Result scene is shown (triggers print for wins) */
  ResultShown = "result-shown",

  // Arena Pong Events

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

export default GameEvents;
