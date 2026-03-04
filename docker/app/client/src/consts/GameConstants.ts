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
  CENTER_X: 1230, // Centered in right portion (540 + (1920-540)/2)
  CENTER_Y: 540, // CANVAS.HEIGHT / 2
  RADIUS: 520, // Main play area radius
  BORDER_WIDTH: 10,
} as const;

// Layout Configuration (second screen split)
export const LAYOUT = {
  PANEL_WIDTH: 540,
} as const;

// Player Configuration
export const PLAYER = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  COLORS: [
    0xdedcd2, // Light Beige
    0x70c3d4, // Light Blue
    0x009d78, // Green
    0xbe0078, // Magenta
    0xffac2a, // Orange
    0xafcd5f, // Lime
  ] as const,
} as const;

// Paddle Configuration
export const PADDLE = {
  INNER_RADIUS: 425, // Distance from center to paddle inner edge
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
  SPAWN_INTERVAL_MS: 3000, // New ball every 3 seconds (testing)
  MAX_BALLS: 5,
} as const;

// Game Configuration
export const GAME = {
  DURATION_MS: 30000, // 30 seconds (testing)
  COUNTDOWN_SECONDS: 3,
  JOIN_HOLD_MS: 1000, // Hold buttons for 1 second to join
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

// Player Keyboard Mapping (raw key codes to avoid Phaser import)
// "left" = counter-clockwise, "right" = clockwise
// Smaller number is clockwise (right), except P5 where 9 is CW and P6 where ← is CW
export const PLAYER_KEYS = [
  { left: 50, right: 49 },   // P1: 2=CCW / 1=CW
  { left: 52, right: 51 },   // P2: 4=CCW / 3=CW
  { left: 54, right: 53 },   // P3: 6=CCW / 5=CW
  { left: 56, right: 55 },   // P4: 8=CCW / 7=CW
  { left: 48, right: 57 },   // P5: 0=CCW / 9=CW
  { left: 39, right: 37 },   // P6: →=CCW / ←=CW
] as const;

// Key hint labels for Lobby display
export const PLAYER_KEY_HINTS = [
  "1/2", "3/4", "5/6", "7/8", "9/0", "←/→",
] as const;

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
  BALL_DEPTH_SCALE_MAX: 1.4, // Scale multiplier at arena center
  BALL_DEPTH_SCALE_MIN: 0.7, // Scale multiplier at arena edge
  FIRE_HIT_THRESHOLD: 4,        // Hits before fire activates
  FIRE_TRAIL_LENGTH: 8,         // Longer trail when on fire
  FIRE_TRAIL_ALPHA: 0.6,        // Brighter trail
  FIRE_SCORE_MULTIPLIER: 2,     // Double points
} as const;

// Default export
const GameConstants = {
  CANVAS,
  LAYOUT,
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
  PLAYER_KEYS,
  PLAYER_KEY_HINTS,
  EFFECTS,
};

export default GameConstants;
