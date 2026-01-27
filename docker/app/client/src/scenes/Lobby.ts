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
  GAME,
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
  glowGraphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  progressArc: Phaser.GameObjects.Graphics;
}

interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
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
  private playerKeys: PlayerKeys[] = [];

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

      // Glow graphics (behind slot)
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(DEPTH.UI_ELEMENTS - 1);
      glowGraphics.setBlendMode(Phaser.BlendModes.ADD);

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
        glowGraphics,
        text,
        progressArc,
      };

      this.playerSlots.push(slot);
      this.drawSlot(slot);
    }
  }

  /**
   * Draw a player slot with glow effect during hold
   */
  private drawSlot(slot: PlayerSlot): void {
    const slotRadius = ARENA.RADIUS + 80;
    const angle = (slot.index * 360) / PLAYER.MAX_PLAYERS;
    const pos = polarToCartesian(angle, slotRadius);
    const color = PLAYER.COLORS[slot.index];

    slot.graphics.clear();
    slot.progressArc.clear();
    slot.glowGraphics.clear();

    if (slot.isJoined) {
      // Filled circle for joined player
      slot.graphics.fillStyle(color, 1);
      slot.graphics.fillCircle(pos.x, pos.y, 40);
      slot.graphics.lineStyle(3, 0xffffff, 0.8);
      slot.graphics.strokeCircle(pos.x, pos.y, 40);
      slot.text.setColor("#ffffff");
      slot.text.setText(`P${slot.index + 1}`);

      // Subtle glow for joined players
      slot.glowGraphics.fillStyle(color, 0.2);
      slot.glowGraphics.fillCircle(pos.x, pos.y, 50);
    } else {
      // Empty circle for waiting slot
      slot.graphics.lineStyle(3, color, 0.5);
      slot.graphics.strokeCircle(pos.x, pos.y, 40);
      slot.text.setColor("#666666");

      // Show key hint
      slot.text.setText(`${slot.index + 1}`);

      // Draw join progress arc and glow
      if (slot.joinProgress > 0) {
        // Pulsing glow effect that intensifies with progress
        const glowAlpha = 0.3 * slot.joinProgress;
        const glowRadius = 50 + 10 * slot.joinProgress;

        slot.glowGraphics.fillStyle(color, glowAlpha);
        slot.glowGraphics.fillCircle(pos.x, pos.y, glowRadius);

        // Progress arc
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
      .text(centerX, ARENA.CENTER_Y, "Hold BOTH buttons for 3 seconds to join", {
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
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    // Create keys for all 6 players
    this.playerKeys = [
      // Player 1: Arrow keys
      {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      },
      // Player 2: A/D
      {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      },
      // Player 3: J/L
      {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      },
      // Player 4: Numpad 4/6
      {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX),
      },
      // Player 5: U/O
      {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      },
      // Player 6: B/M
      {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      },
    ];

    // Enter to force start (dev convenience)
    keyboard.on("keydown-ENTER", () => {
      if (this.joinedPlayers.size >= PLAYER.MIN_PLAYERS) {
        this.startGame();
      }
    });
  }

  /**
   * Join a player with pop animation (one-way - no leaving once joined)
   */
  private joinPlayer(playerIndex: number): void {
    const slot = this.playerSlots[playerIndex];
    if (!slot || slot.isJoined) return;

    this.joinedPlayers.add(playerIndex);
    slot.isJoined = true;
    slot.joinProgress = 0;
    this.drawSlot(slot);

    // Pop animation for the slot
    const slotRadius = ARENA.RADIUS + 80;
    const angle = (slot.index * 360) / PLAYER.MAX_PLAYERS;
    const pos = polarToCartesian(angle, slotRadius);

    // Scale pop effect using graphics
    slot.graphics.setScale(0.5);
    this.tweens.add({
      targets: slot.graphics,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.out",
    });

    // Text pop effect
    slot.text.setScale(0.5);
    this.tweens.add({
      targets: slot.text,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.out",
    });

    // Particle burst effect
    this.createJoinParticleBurst(pos.x, pos.y, PLAYER.COLORS[playerIndex]);

    this.updateUI();
  }

  /**
   * Create particle burst effect when player joins
   */
  private createJoinParticleBurst(x: number, y: number, color: number): void {
    if (!this.textures.exists("particle")) return;

    const particles = this.add.particles(x, y, "particle", {
      speed: { min: 80, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 12,
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });

    particles.setDepth(DEPTH.PARTICLES);
    particles.explode(12);

    this.time.delayedCall(600, () => {
      particles.destroy();
    });
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

  update(time: number, _delta: number): void {
    for (let i = 0; i < PLAYER.MAX_PLAYERS; i++) {
      const keys = this.playerKeys[i];
      if (!keys) continue;

      const slot = this.playerSlots[i];
      if (!slot) continue;

      // Skip already joined players (no leave option)
      if (slot.isJoined) continue;

      const bothDown = keys.left.isDown && keys.right.isDown;

      if (bothDown) {
        // Start tracking if not already
        if (!this.holdStartTimes.has(i)) {
          this.holdStartTimes.set(i, time);
        }

        // Calculate progress
        const startTime = this.holdStartTimes.get(i)!;
        const elapsed = time - startTime;
        const progress = Math.min(1, elapsed / GAME.JOIN_HOLD_MS);

        // Update slot visual
        slot.joinProgress = progress;
        this.drawSlot(slot);

        // Check if hold complete
        if (progress >= 1) {
          this.joinPlayer(i);
          this.holdStartTimes.delete(i);
        }
      } else {
        // Released - reset progress
        if (this.holdStartTimes.has(i) || slot.joinProgress > 0) {
          this.holdStartTimes.delete(i);
          slot.joinProgress = 0;
          this.drawSlot(slot);
        }
      }
    }
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
      slot.glowGraphics.destroy();
      slot.text.destroy();
      slot.progressArc.destroy();
    }
    this.playerSlots = [];
    this.playerKeys = [];

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
