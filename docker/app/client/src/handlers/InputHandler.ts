/**
 * InputHandler - Unified input handling for the circular Pong game
 *
 * Uses standard Phaser keyboard handling pattern.
 */

import Phaser from "phaser";

export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}

export default class InputHandler {
  private scene: Phaser.Scene;

  // Cursor keys for player 1 (arrow keys)
  public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // WASD/AD keys for player 2
  public player2Keys!: PlayerKeys;

  // Additional player keys
  public player3Keys!: PlayerKeys;
  public player4Keys!: PlayerKeys;
  public player5Keys!: PlayerKeys;
  public player6Keys!: PlayerKeys;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeys();
  }

  private setupKeys(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // Player 1: Arrow keys (using cursor keys)
    this.cursors = keyboard.createCursorKeys();

    // Player 2: A/D keys
    this.player2Keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Player 3: J/L keys
    this.player3Keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
    };

    // Player 4: Numpad 4/6
    this.player4Keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX),
    };

    // Player 5: U/O keys
    this.player5Keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
    };

    // Player 6: B/M keys
    this.player6Keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
    };
  }

  /**
   * Get input state for a player
   * Call this in update() loop
   */
  getInput(playerIndex: number): { left: boolean; right: boolean } {
    switch (playerIndex) {
      case 0:
        return {
          left: this.cursors.left.isDown,
          right: this.cursors.right.isDown,
        };
      case 1:
        return {
          left: this.player2Keys.left.isDown,
          right: this.player2Keys.right.isDown,
        };
      case 2:
        return {
          left: this.player3Keys.left.isDown,
          right: this.player3Keys.right.isDown,
        };
      case 3:
        return {
          left: this.player4Keys.left.isDown,
          right: this.player4Keys.right.isDown,
        };
      case 4:
        return {
          left: this.player5Keys.left.isDown,
          right: this.player5Keys.right.isDown,
        };
      case 5:
        return {
          left: this.player6Keys.left.isDown,
          right: this.player6Keys.right.isDown,
        };
      default:
        return { left: false, right: false };
    }
  }

  destroy(): void {
    // Keys are cleaned up automatically by Phaser when scene shuts down
  }
}
