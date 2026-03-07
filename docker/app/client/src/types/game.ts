/**
 * Game type definitions (client-side)
 *
 * Note: These are simplified versions of server types.
 * Full type definitions are in server/src/types/
 */

/**
 * Basic game settings (subset used by client)
 */
export interface GameSettings {
  game?: {
    title?: string;
    version?: string;
  };
}
