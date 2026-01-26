import { AUTO, Scale, Types } from "phaser";
import GamePlugin from "../plugins/GamePlugin";
// @ts-ignore:
import WebfontLoaderPlugin from "phaser3-rex-plugins/plugins/webfontloader-plugin.js";

const config: Types.Core.GameConfig = {
  type: AUTO,
  parent: "game-container",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    keyboard: true,
  },
  plugins: {
    global: [
      {
        key: "GamePlugin",
        plugin: GamePlugin,
        start: true,
      },
      {
        key: "rexWebfontLoader",
        plugin: WebfontLoaderPlugin,
        start: true,
      },
    ],
  },
};

export default config;
