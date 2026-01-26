import Phaser from "phaser";
import io from "socket.io-client";
import GameEvents from "../../../shared/GameEvents";

export default class GamePlugin extends Phaser.Plugins.BasePlugin {
  // @ts-ignore:
  private _socket: SocketIOClient.Socket;
  private _events: Phaser.Events.EventEmitter;
  private _data: Phaser.Data.DataManager;
  private _startupTime: Date;
  private _isPaused = false;

  constructor(pluginManager: Phaser.Plugins.PluginManager) {
    super(pluginManager);
    // @ts-ignore:
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '3000';
    this._socket = io(`${window.location.hostname}:${backendPort}`);
    this._events = new Phaser.Events.EventEmitter();
    this._data = this.game.registry;
    this._startupTime = new Date();
  }

  init(): void {
    console.log("GamePlugin initialized");

    // Core events
    this._socket.on(GameEvents.Reload, () => {
      console.log("Reloading game");
      location.reload();
    });

    this._socket.on(GameEvents.BuzzerPress, (channel: number) => {
      console.log("Button pressed on channel:", channel);
      this._events.emit(GameEvents.BuzzerPress, channel);
    });

    // Prize awarded event
    this._socket.on(GameEvents.PrizeAwarded, (outcome: any) => {
      console.log("Prize awarded:", outcome);
      this._events.emit(GameEvents.PrizeAwarded, outcome);
    });

    // Game pause/resume events - update global state and emit
    this._socket.on(GameEvents.GamePaused, (payload: any) => {
      console.log("Game paused event from server:", payload);
      this._isPaused = true;
      this._events.emit(GameEvents.GamePaused, payload);
    });

    this._socket.on(GameEvents.GameResumed, (payload: any) => {
      console.log("Game resumed event from server:", payload);
      this._isPaused = false;
      this._events.emit(GameEvents.GameResumed, payload);
    });
  }

  get startupTime() {
    return this._startupTime;
  }

  get serverSocket() {
    return this._socket;
  }

  get events() {
    return this._events;
  }

  get data() {
    return this._data;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this._socket.connected;
  }

  /**
   * Check if game is currently paused
   */
  get isPaused(): boolean {
    return this._isPaused;
  }
}
