/**
 * Game type definitions (client-side)
 *
 * Note: These are simplified versions of server types.
 * Full type definitions are in server/src/types/
 */

/**
 * Prize outcome received from server
 */
export interface PrizeOutcome {
  prizeId: string;
  prizeType: "scheduled" | "inventory" | "consolation";
  displayName: string;
  textureKey: string;
  wishText?: string;
  timestamp: string;
}

/**
 * Basic game settings (subset used by client)
 */
export interface GameSettings {
  game?: {
    title?: string;
    version?: string;
  };
  prizes?: {
    consolationWishes?: string[];
  };
}
