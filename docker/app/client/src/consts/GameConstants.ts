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

// Animation Durations (milliseconds)
export const ANIMATION_DURATION = {
  FADE_IN: 500,
  FADE_OUT: 500,
  // Add your animation durations here
} as const;

// Rendering Depths (Z-Index)
export const DEPTH = {
  BACKGROUND: 0,
  GAME_OBJECTS: 10,
  UI_ELEMENTS: 30,
  PARTICLES: 50,
} as const;

// Colors
export const COLORS = {
  WHITE: "#ffffff",
  BLACK: "#000000",
  // Add your colors here
} as const;

// Session Configuration
export const SESSION = {
  COOKIE_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  STATS_REFRESH_INTERVAL_MS: 30000, // 30 seconds
} as const;

// Default export
const GameConstants = {
  CANVAS,
  ANIMATION_DURATION,
  DEPTH,
  COLORS,
  SESSION,
};

export default GameConstants;
