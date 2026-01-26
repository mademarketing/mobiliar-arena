import Phaser from "phaser";
import SceneKeys from "../consts/SceneKeys";
import GamePlugin from "../plugins/GamePlugin";

/**
 * TestHelper - Exposes game state for automated testing via agent-browser eval
 *
 * Usage with agent-browser:
 *   agent-browser eval "window.__gameTest.getState()"
 *   agent-browser eval "window.__gameTest.pressKey('Space')"
 *   agent-browser eval "window.__gameTest.forceWin()"
 *
 * All methods return JSON-serializable data for easy assertion.
 */
export interface GameTestState {
  ready: boolean;
  currentScene: string | null;
  isPaused: boolean;
  isConnected: boolean;
  sceneState: Record<string, unknown>;
}

export interface TestHelperAPI {
  // State queries
  getState: () => GameTestState;
  getCurrentScene: () => string | null;
  isReady: () => boolean;
  isPaused: () => boolean;
  isConnected: () => boolean;
  getSceneState: () => Record<string, unknown>;

  // Actions
  pressKey: (key: string) => void;
  forceWin: () => void;
  forceLose: () => void;
  goToScene: (sceneKey: string, data?: Record<string, unknown>) => void;
  triggerBuzzer: () => void;

  // Wait helpers (return promises for polling)
  waitForScene: (sceneKey: string, timeoutMs?: number) => Promise<boolean>;
  waitForReady: (timeoutMs?: number) => Promise<boolean>;
}

declare global {
  interface Window {
    __gameTest: TestHelperAPI;
    game: Phaser.Game;
  }
}

/**
 * Initialize the test helper and expose it on window.__gameTest
 */
export function initTestHelper(game: Phaser.Game): TestHelperAPI {
  const getActiveScene = (): Phaser.Scene | null => {
    const scenes = game.scene.getScenes(true);
    // Filter out Bootstrap and Preload as they're setup scenes
    const activeScenes = scenes.filter(
      (s) => s.scene.key !== SceneKeys.Bootstrap && s.scene.key !== SceneKeys.Preload
    );
    return activeScenes[0] || scenes[0] || null;
  };

  const getGamePlugin = (): GamePlugin | null => {
    return game.plugins.get("GamePlugin") as GamePlugin | null;
  };

  const api: TestHelperAPI = {
    /**
     * Get complete game state snapshot
     */
    getState(): GameTestState {
      const scene = getActiveScene();
      const plugin = getGamePlugin();

      return {
        ready: game.isBooted && scene !== null,
        currentScene: scene?.scene.key || null,
        isPaused: plugin?.isPaused ?? false,
        isConnected: plugin?.isConnected() ?? false,
        sceneState: this.getSceneState(),
      };
    },

    /**
     * Get current active scene key
     */
    getCurrentScene(): string | null {
      return getActiveScene()?.scene.key || null;
    },

    /**
     * Check if game is ready for interaction
     */
    isReady(): boolean {
      const scene = getActiveScene();
      return game.isBooted && scene !== null && scene.scene.isActive();
    },

    /**
     * Check if game is paused
     */
    isPaused(): boolean {
      return getGamePlugin()?.isPaused ?? false;
    },

    /**
     * Check if connected to server
     */
    isConnected(): boolean {
      return getGamePlugin()?.isConnected() ?? false;
    },

    /**
     * Get scene-specific state based on current scene
     */
    getSceneState(): Record<string, unknown> {
      const scene = getActiveScene();
      if (!scene) return {};

      const sceneKey = scene.scene.key;
      const state: Record<string, unknown> = { sceneKey };

      // Extract scene-specific state using any to access private members
      const sceneAny = scene as any;

      switch (sceneKey) {
        case SceneKeys.Idle:
          state.isTransitioning = sceneAny.isTransitioning ?? false;
          state.isPaused = sceneAny.isPaused ?? false;
          break;

        case SceneKeys.Game:
          state.outcome = sceneAny.outcome ?? null;
          break;

        case SceneKeys.Result:
          state.isWin = sceneAny.isWin ?? false;
          state.outcome = sceneAny.outcome ?? null;
          break;
      }

      return state;
    },

    /**
     * Simulate a key press
     */
    pressKey(key: string): void {
      const scene = getActiveScene();
      if (!scene) return;

      // Map common key names
      const keyMap: Record<string, string> = {
        space: "SPACE",
        Space: "SPACE",
        enter: "ENTER",
        Enter: "ENTER",
        "1": "ONE",
        "2": "TWO",
        one: "ONE",
        two: "TWO",
      };

      const phaserKey = keyMap[key] || key.toUpperCase();
      scene.input.keyboard?.emit(`keydown-${phaserKey}`);
    },

    /**
     * Force a win outcome (works in Idle scene)
     */
    forceWin(): void {
      this.pressKey("1");
    },

    /**
     * Force a lose outcome (works in Idle scene)
     */
    forceLose(): void {
      this.pressKey("2");
    },

    /**
     * Navigate directly to a scene
     */
    goToScene(sceneKey: string, data?: Record<string, unknown>): void {
      game.scene.start(sceneKey, data);
    },

    /**
     * Trigger buzzer press (Space key)
     */
    triggerBuzzer(): void {
      this.pressKey("Space");
    },

    /**
     * Wait for a specific scene to become active
     */
    waitForScene(sceneKey: string, timeoutMs = 10000): Promise<boolean> {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const check = () => {
          if (this.getCurrentScene() === sceneKey) {
            resolve(true);
            return;
          }
          if (Date.now() - startTime > timeoutMs) {
            resolve(false);
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });
    },

    /**
     * Wait for game to be ready
     */
    waitForReady(timeoutMs = 10000): Promise<boolean> {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const check = () => {
          if (this.isReady()) {
            resolve(true);
            return;
          }
          if (Date.now() - startTime > timeoutMs) {
            resolve(false);
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });
    },
  };

  // Expose on window
  window.__gameTest = api;
  window.game = game;

  console.log("[TestHelper] Initialized - access via window.__gameTest");

  return api;
}
