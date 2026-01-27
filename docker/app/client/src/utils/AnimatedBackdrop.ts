import Phaser from "phaser";
import { CANVAS, DEPTH } from "../consts/GameConstants";
import TextureKeys from "../consts/TextureKeys";
import ThemeManager from "../managers/ThemeManager";

/**
 * Configuration options for the animated backdrop
 */
export interface BackdropConfig {
  /** Enable animated sparkles (default: true) */
  animateSparkles?: boolean;
  /** Background texture key (default: theme background or TextureKeys.Background) */
  backgroundTexture?: string;
  /** Use theme background (default: true) */
  useTheme?: boolean;
}

/**
 * AnimatedBackdrop
 *
 * Displays a background image with an optional animated sparkle
 * particle overlay for dynamic visual effects.
 *
 * Performance optimized: Uses a pre-rendered PNG background with
 * Phaser's particle system for efficient sparkle animations.
 */
export default class AnimatedBackdrop {
  private scene: Phaser.Scene;
  private config: Required<BackdropConfig>;
  private container: Phaser.GameObjects.Container;
  private backgroundSprite?: Phaser.GameObjects.Image;
  private sparkleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, config: BackdropConfig = {}) {
    this.scene = scene;

    // Determine background texture: prefer theme, fallback to default
    let backgroundTexture = config.backgroundTexture;
    if (!backgroundTexture && config.useTheme !== false) {
      const themeManager = ThemeManager.getInstance();
      const themeKey = themeManager.getBackgroundKey();
      if (scene.textures.exists(themeKey)) {
        backgroundTexture = themeKey;
      }
    }
    backgroundTexture = backgroundTexture ?? TextureKeys.Background;

    this.config = {
      animateSparkles: config.animateSparkles ?? true,
      backgroundTexture,
      useTheme: config.useTheme ?? true,
    };

    this.container = scene.add.container(0, 0);
    this.container.setDepth(DEPTH.BACKGROUND);
  }

  /**
   * Create and display the backdrop
   */
  create(): this {
    // Load the static background image
    this.backgroundSprite = this.scene.add.image(
      CANVAS.WIDTH / 2,
      CANVAS.HEIGHT / 2,
      this.config.backgroundTexture
    );

    // Scale to fit canvas if dimensions don't match
    this.backgroundSprite.setDisplaySize(CANVAS.WIDTH, CANVAS.HEIGHT);

    this.container.add(this.backgroundSprite);

    // Add animated sparkles on top if enabled
    if (this.config.animateSparkles) {
      this.createSparkleEmitter();
    }

    return this;
  }

  /**
   * Create sparkle particle emitter for animated effects
   * Uses Phaser's optimized particle system with object pooling
   */
  private createSparkleEmitter(): void {
    const sparkleKey = "backdrop-sparkle";

    // Create sparkle texture if it doesn't exist
    if (!this.scene.textures.exists(sparkleKey)) {
      const gfx = this.scene.make.graphics({ x: 0, y: 0 }, false);
      // Soft glow circle
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(8, 8, 6);
      gfx.fillStyle(0xffffff, 0.5);
      gfx.fillCircle(8, 8, 8);
      gfx.generateTexture(sparkleKey, 16, 16);
      gfx.destroy();
    }

    // Get theme-specific colors for particles
    const themeManager = ThemeManager.getInstance();
    const themeColors = themeManager.getThemeColors();
    const sparkleColors = [0xffffff, ...themeColors.slice(0, 2)];

    // Create particle emitter with optimized settings
    this.sparkleEmitter = this.scene.add.particles(0, 0, sparkleKey, {
      x: { min: 0, max: CANVAS.WIDTH },
      y: { min: 0, max: CANVAS.HEIGHT },
      lifespan: { min: 600, max: 1200 },
      frequency: 60,
      quantity: 1,
      scale: { start: 0, end: 0, ease: "quad.out" },
      alpha: { start: 0, end: 0 },
      tint: sparkleColors,
      blendMode: Phaser.BlendModes.ADD,
      maxAliveParticles: 38,
    });

    // Override with smooth fade in/out
    this.sparkleEmitter.particleClass = class extends Phaser.GameObjects
      .Particles.Particle {
      update(
        delta: number,
        step: number,
        processors: Phaser.GameObjects.Particles.ParticleProcessor[]
      ): boolean {
        const result = super.update(delta, step, processors);
        // Calculate life progress (0 = just born, 1 = about to die)
        const lifeProgress = 1 - this.lifeCurrent / this.life;
        // Smooth fade in (0-30%) and fade out (70-100%)
        if (lifeProgress < 0.3) {
          this.alpha = lifeProgress / 0.3;
          this.scaleX = this.scaleY = 0.3 + (lifeProgress / 0.3) * 0.5;
        } else if (lifeProgress > 0.7) {
          const fadeOut = (1 - lifeProgress) / 0.3;
          this.alpha = fadeOut;
          this.scaleX = this.scaleY = 0.8 * fadeOut;
        } else {
          this.alpha = 1;
          this.scaleX = this.scaleY = 0.8;
        }
        return result;
      }
    };

    this.sparkleEmitter.setDepth(DEPTH.BACKGROUND + 1);
  }

  /**
   * Set visibility of the backdrop
   */
  setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }

  /**
   * Set alpha/opacity of the entire backdrop
   */
  setAlpha(alpha: number): this {
    this.container.setAlpha(alpha);
    return this;
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Stop and destroy particle emitter
    if (this.sparkleEmitter) {
      this.sparkleEmitter.stop();
      this.sparkleEmitter.destroy();
      this.sparkleEmitter = undefined;
    }

    // Destroy container (destroys all children including background sprite)
    this.container.destroy();
  }
}
