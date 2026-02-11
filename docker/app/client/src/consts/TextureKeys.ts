/**
 * Texture keys for game assets
 *
 * Keys must match the asset loading in Preload.ts.
 * Add your game-specific texture keys here.
 */
const TextureKeys = {
  /** Game logo */
  Logo: "logo",
  /** Background image */
  Background: "background",
  /** Arena border/ring graphic */
  ArenaBorder: "arena-border",
  /** Ball sprite */
  Ball: "ball",
} as const;

export default TextureKeys;
