/**
 * Lobby Scene - Player join screen
 *
 * Players join by holding both buttons for 3 seconds (keyboard: hold number key).
 * Minimum 2 players required to start.
 * Auto-transitions to Countdown when 2+ players are ready.
 */

import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import {
  CANVAS,
  ARENA,
  PLAYER,
  DEPTH,
  ANIMATION_DURATION,
} from "../consts/GameConstants";
import {
  polarToCartesian,
  degreesToRadians,
} from "../utils/CircularPhysics";
import AnimatedBackdrop from "../utils/AnimatedBackdrop";

interface PlayerSlot {
  index: number;
  isJoined: boolean;
  joinProgress: number; // 0-1
  graphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  progressArc: Phaser.GameObjects.Graphics;
}

export default class Lobby extends Phaser.Scene {
  private backdrop?: AnimatedBackdrop;
  private arenaGraphics?: Phaser.GameObjects.Graphics;
  private playerSlots: PlayerSlot[] = [];
  private titleText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;
  private playerCountText?: Phaser.GameObjects.Text;
  private startHintText?: Phaser.GameObjects.Text;
  private joinedPlayers: Set<number> = new Set();
  private holdStartTimes: Map<number, number> = new Map();
  private autoStartTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super(SceneKeys.Lobby);
  }

  create(): void {
    this.events.once("shutdown", this.shutdown, this);

    // Reset state
    this.joinedPlayers.clear();
    this.holdStartTimes.clear();
    this.playerSlots = [];

    // Animated backdrop
    this.backdrop = new AnimatedBackdrop(this).create();

    // Draw arena outline
    this.drawArena();

    // Create player slots
    this.createPlayerSlots();

    // Create UI text
    this.createUI();

    // Setup input
    this.setupInput();

    // Fade in
    this.cameras.main.fadeIn(ANIMATION_DURATION.FADE_IN, 0, 0, 0);
  }

  /**
   * Draw the arena outline
   */
  private drawArena(): void {
    this.arenaGraphics = this.add.graphics();
    this.arenaGraphics.setDepth(DEPTH.ARENA);

    // Arena border
    this.arenaGraphics.lineStyle(ARENA.BORDER_WIDTH, 0x333333, 1);
    this.arenaGraphics.strokeCircle(
      ARENA.CENTER_X,
      ARENA.CENTER_Y,
      ARENA.RADIUS
    );

    // Inner guide circle
    this.arenaGraphics.lineStyle(2, 0x333333, 0.3);
    this.arenaGraphics.strokeCircle(
      ARENA.CENTER_X,
      ARENA.CENTER_Y,
      ARENA.RADIUS - 50
    );
  }

  /**
   * Create player slot indicators around the arena
   */
  private createPlayerSlots(): void {
    const slotRadius = ARENA.RADIUS + 80;

    for (let i = 0; i < PLAYER.MAX_PLAYERS; i++) {
      const angle = (i * 360) / PLAYER.MAX_PLAYERS;
      const pos = polarToCartesian(angle, slotRadius);

      // Slot background
      const graphics = this.add.graphics();
      graphics.setDepth(DEPTH.UI_ELEMENTS);

      // Progress arc
      const progressArc = this.add.graphics();
      progressArc.setDepth(DEPTH.UI_ELEMENTS + 1);

      // Player number text
      const text = this.add
        .text(pos.x, pos.y, `P${i + 1}`, {
          fontFamily: "MuseoSansBold, sans-serif",
          fontSize: "28px",
          color: "#666666",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.UI_ELEMENTS + 2);

      const slot: PlayerSlot = {
        index: i,
        isJoined: false,
        joinProgress: 0,
        graphics,
        text,
        progressArc,
      };

      this.playerSlots.push(slot);
      this.drawSlot(slot);
    }
  }

  /**
   * Draw a player slot
   */
  private drawSlot(slot: PlayerSlot): void {
    const slotRadius = ARENA.RADIUS + 80;
    const angle = (slot.index * 360) / PLAYER.MAX_PLAYERS;
    const pos = polarToCartesian(angle, slotRadius);
    const color = PLAYER.COLORS[slot.index];

    slot.graphics.clear();
    slot.progressArc.clear();

    if (slot.isJoined) {
      // Filled circle for joined player
      slot.graphics.fillStyle(color, 1);
      slot.graphics.fillCircle(pos.x, pos.y, 40);
      slot.graphics.lineStyle(3, 0xffffff, 0.8);
      slot.graphics.strokeCircle(pos.x, pos.y, 40);
      slot.text.setColor("#ffffff");
      slot.text.setText(`P${slot.index + 1}`);
    } else {
      // Empty circle for waiting slot
      slot.graphics.lineStyle(3, color, 0.5);
      slot.graphics.strokeCircle(pos.x, pos.y, 40);
      slot.text.setColor("#666666");

      // Show key hint
      slot.text.setText(`${slot.index + 1}`);

      // Draw join progress arc
      if (slot.joinProgress > 0) {
        slot.progressArc.lineStyle(6, color, 1);
        slot.progressArc.beginPath();
        slot.progressArc.arc(
          pos.x,
          pos.y,
          40,
          degreesToRadians(-90),
          degreesToRadians(-90 + slot.joinProgress * 360),
          false
        );
        slot.progressArc.strokePath();
      }
    }
  }

  /**
   * Create UI text elements
   */
  private createUI(): void {
    const centerX = CANVAS.WIDTH / 2;

    // Title
    this.titleText = this.add
      .text(centerX, 80, "MOBILIAR ARENA", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "72px",
        color: "#ffffff",
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#333333",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Instructions
    this.instructionText = this.add
      .text(centerX, ARENA.CENTER_Y, "Press a number key (1-6) to join", {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "36px",
        color: "#cccccc",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Player count
    this.playerCountText = this.add
      .text(centerX, CANVAS.HEIGHT - 120, "Waiting for players...", {
        fontFamily: "MuseoSans, sans-serif",
        fontSize: "32px",
        color: "#888888",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS);

    // Start hint (hidden initially)
    this.startHintText = this.add
      .text(centerX, CANVAS.HEIGHT - 60, "Press ENTER to start", {
        fontFamily: "MuseoSansBold, sans-serif",
        fontSize: "36px",
        color: "#4ecdc4",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI_ELEMENTS)
      .setAlpha(0);
  }

  /**
   * Setup input handling
   */
  private setupInput(): void {
    // Number keys 1-6 for instant join (dev mode)
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const keyNum = parseInt(event.key);
      if (keyNum >= 1 && keyNum <= PLAYER.MAX_PLAYERS) {
        this.togglePlayer(keyNum - 1);
      }
    });

    // Enter to force start
    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this.joinedPlayers.size >= PLAYER.MIN_PLAYERS) {
        this.startGame();
      }
    });
  }

  /**
   * Toggle a player's join status
   */
  private togglePlayer(playerIndex: number): void {
    const slot = this.playerSlots[playerIndex];
    if (!slot) return;

    if (this.joinedPlayers.has(playerIndex)) {
      // Leave
      this.joinedPlayers.delete(playerIndex);
      slot.isJoined = false;
      slot.joinProgress = 0;
    } else {
      // Join
      this.joinedPlayers.add(playerIndex);
      slot.isJoined = true;
      slot.joinProgress = 1;
    }

    this.drawSlot(slot);
    this.updateUI();
  }

  /**
   * Update UI based on current state
   */
  private updateUI(): void {
    const playerCount = this.joinedPlayers.size;
    const minPlayers = PLAYER.MIN_PLAYERS;

    if (playerCount === 0) {
      this.playerCountText?.setText("Waiting for players...");
      this.startHintText?.setAlpha(0);
    } else if (playerCount < minPlayers) {
      this.playerCountText?.setText(
        `${playerCount} player${playerCount > 1 ? "s" : ""} - Need ${minPlayers - playerCount} more`
      );
      this.startHintText?.setAlpha(0);
    } else {
      this.playerCountText?.setText(
        `${playerCount} player${playerCount > 1 ? "s" : ""} ready!`
      );
      this.playerCountText?.setColor("#4ecdc4");
      this.startHintText?.setAlpha(1);

      // Pulse the start hint
      if (!this.startHintText?.getData("pulsing")) {
        this.startHintText?.setData("pulsing", true);
        this.tweens.add({
          targets: this.startHintText,
          alpha: { from: 1, to: 0.5 },
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }

      // Auto-start after 5 seconds when minimum players joined
      this.scheduleAutoStart();
    }
  }

  /**
   * Schedule auto-start when minimum players are ready
   */
  private scheduleAutoStart(): void {
    // Cancel existing timer
    if (this.autoStartTimer) {
      this.autoStartTimer.remove();
    }

    // Start new timer
    this.autoStartTimer = this.time.delayedCall(5000, () => {
      if (this.joinedPlayers.size >= PLAYER.MIN_PLAYERS) {
        this.startGame();
      }
    });
  }

  /**
   * Start the game
   */
  private startGame(): void {
    // Cancel auto-start timer
    if (this.autoStartTimer) {
      this.autoStartTimer.remove();
      this.autoStartTimer = undefined;
    }

    // Get array of joined player indices
    const players = Array.from(this.joinedPlayers).sort((a, b) => a - b);

    console.log("Starting game with players:", players);

    // Transition to Countdown
    this.scene.start(SceneKeys.Countdown, { players });
  }

  update(_time: number, _delta: number): void {
    // Update join progress for players holding both buttons
    // (This would work with Phidgets - for keyboard we use instant toggle)
  }

  shutdown(): void {
    this.tweens.killAll();

    // Remove all keyboard listeners and keys
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard?.removeAllKeys(true);

    this.autoStartTimer?.remove();
    this.autoStartTimer = undefined;

    // Clean up player slots
    for (const slot of this.playerSlots) {
      slot.graphics.destroy();
      slot.text.destroy();
      slot.progressArc.destroy();
    }
    this.playerSlots = [];

    this.backdrop?.destroy();
    this.backdrop = undefined;
    this.arenaGraphics?.destroy();
    this.arenaGraphics = undefined;
    this.titleText?.destroy();
    this.titleText = undefined;
    this.instructionText?.destroy();
    this.instructionText = undefined;
    this.playerCountText?.destroy();
    this.playerCountText = undefined;
    this.startHintText?.destroy();
    this.startHintText = undefined;
  }
}
