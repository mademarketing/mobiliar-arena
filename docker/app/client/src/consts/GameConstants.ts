/**
 * Game Constants
 *
 * Centralized configuration values for the game.
 * Add your own constants here as needed.
 */

// Canvas Dimensions
export const CANVAS = {
  WIDTH: 1920,
  HEIGHT: 1080,
} as const;

// Arena Configuration
export const ARENA = {
  CENTER_X: 960, // CANVAS.WIDTH / 2
  CENTER_Y: 540, // CANVAS.HEIGHT / 2
  RADIUS: 450, // Main play area radius
  BORDER_WIDTH: 10,
} as const;

// Player Configuration
export const PLAYER = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  COLORS: [
    0xff6b6b, // Red
    0x4ecdc4, // Teal
    0xffe66d, // Yellow
    0x95e1d3, // Mint
    0xf38181, // Coral
    0xaa96da, // Purple
  ] as const,
} as const;

// Paddle Configuration
export const PADDLE = {
  INNER_RADIUS: 400, // Distance from center to paddle inner edge
  OUTER_RADIUS: 450, // Distance from center to paddle outer edge (matches ARENA.RADIUS)
  BASE_ARC_DEGREES: 40, // Base paddle arc width in degrees
  MIN_ARC_DEGREES: 20, // Minimum paddle arc after difficulty scaling
  MOVE_SPEED: 180, // Angular speed in degrees per second
} as const;

// Ball Configuration
export const BALL = {
  RADIUS: 23, // 50% larger than original 15
  BASE_SPEED: 250, // Pixels per second (Arcade Physics)
  MAX_SPEED: 500,
  SPEED_INCREMENT: 25, // Speed increase per bounce
  SPAWN_INTERVAL_MS: 5000, // New ball every 5 seconds
  MAX_BALLS: 5,
} as const;

// Game Configuration
export const GAME = {
  DURATION_MS: 60000, // 60 seconds
  COUNTDOWN_SECONDS: 3,
  JOIN_HOLD_MS: 3000, // Hold buttons for 3 seconds to join
  RESULT_DISPLAY_MS: 10000, // Show result for 10 seconds
  COMBO_TIMEOUT_MS: 2000, // Combo resets after 2 seconds without bounce
} as const;

// Scoring Configuration
export const SCORING = {
  POINTS_PER_BOUNCE: 10,
  COMBO_MULTIPLIER: 0.5, // Each combo adds 50% to base score
  MAX_COMBO_MULTIPLIER: 5,
} as const;

// Animation Durations (milliseconds)
export const ANIMATION_DURATION = {
  FADE_IN: 500,
  FADE_OUT: 500,
} as const;

// Rendering Depths (Z-Index)
export const DEPTH = {
  BACKGROUND: 0,
  ARENA: 5,
  PADDLES: 10,
  BALLS: 15,
  GAME_OBJECTS: 10,
  UI_ELEMENTS: 30,
  PARTICLES: 50,
} as const;

// Colors
export const COLORS = {
  WHITE: "#ffffff",
  BLACK: "#000000",
  ARENA_BORDER: 0x333333,
  ARENA_FILL: 0x1a1a2e,
  TEXT_SHADOW: "#333333",
} as const;

// Session Configuration
export const SESSION = {
  COOKIE_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  STATS_REFRESH_INTERVAL_MS: 30000, // 30 seconds
} as const;

// Theme Configuration
export const THEMES = {
  AVAILABLE: ['basketball', 'handball', 'volleyball', 'floorball', 'corporate'] as const,
  DEFAULT: 'basketball',
} as const;

// Visual Effects Configuration
export const EFFECTS = {
  BALL_TRAIL_LENGTH: 5,
  BALL_TRAIL_ALPHA: 0.3,
  BALL_ROTATION_SPEED: 0.05, // radians per pixel traveled
  PADDLE_GLOW_INTENSITY: 0.4,
  PADDLE_GLOW_RADIUS: 12,
  PADDLE_SHRINK_DURATION: 500, // ms for shrink animation
  COLLISION_PARTICLES: 8,
  COLLISION_PARTICLE_SPEED: 150,
  FLOATING_TEXT_DURATION: 800,
  FLOATING_TEXT_RISE: 50,
  COMBO_MILESTONES: [5, 10, 15, 20, 25, 30] as const,
} as const;

// Default export
const GameConstants = {
  CANVAS,
  ARENA,
  PLAYER,
  PADDLE,
  BALL,
  GAME,
  SCORING,
  ANIMATION_DURATION,
  DEPTH,
  COLORS,
  SESSION,
  THEMES,
  EFFECTS,
};

export default GameConstants;
