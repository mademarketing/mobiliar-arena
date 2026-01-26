import Phaser from "phaser";
import SceneKeys from "./consts/SceneKeys";
import config from "./consts/config";
import Bootstrap from "./scenes/Bootstrap";
import Preload from "./scenes/Preload";
import Idle from "./scenes/Idle";
import Lobby from "./scenes/Lobby";
import Countdown from "./scenes/Countdown";
import Game from "./scenes/Game";
import Result from "./scenes/Result";
import { initTestHelper } from "./utils/TestHelper";

const game = new Phaser.Game(config);

// Initialize test helper for automated testing (agent-browser eval)
initTestHelper(game);

// Register all scenes
game.scene.add(SceneKeys.Bootstrap, Bootstrap);
game.scene.add(SceneKeys.Preload, Preload);
game.scene.add(SceneKeys.Idle, Idle);
game.scene.add(SceneKeys.Lobby, Lobby);
game.scene.add(SceneKeys.Countdown, Countdown);
game.scene.add(SceneKeys.Game, Game);
game.scene.add(SceneKeys.Result, Result);

// Start the game
game.scene.start(SceneKeys.Bootstrap);
