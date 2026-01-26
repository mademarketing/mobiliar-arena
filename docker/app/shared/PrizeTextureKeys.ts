/**
 * Shared prize texture key constants
 * Used by both client (Phaser rendering) and server (database prize definitions)
 *
 * IMPORTANT: These values must match:
 * - Frontend TextureKeys enum values (docker/app/client/src/consts/TextureKeys.ts)
 * - Database prizes.texture_key column values
 * - Phaser asset loader texture keys
 *
 * Add your prize texture keys here:
 * export const PrizeTextureKeys = {
 *   GIFT_CARD: 'giftcard',
 *   VOUCHER: 'voucher',
 *   TSHIRT: 'tshirt',
 * } as const;
 */
export const PrizeTextureKeys = {
  // Add your prize texture keys here
  // EXAMPLE: 'example',
} as const;

// Type-safe union of all texture key values
export type PrizeTextureKey = typeof PrizeTextureKeys[keyof typeof PrizeTextureKeys];

// Helper function to validate texture key at runtime
export function isValidPrizeTextureKey(key: string): key is PrizeTextureKey {
  return Object.values(PrizeTextureKeys).includes(key as PrizeTextureKey);
}

// Export as array for iteration
export const PRIZE_TEXTURE_KEY_VALUES = Object.values(PrizeTextureKeys);
