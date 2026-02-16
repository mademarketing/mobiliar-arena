import phidget22 = require("phidget22");
import { Server } from "socket.io";
import GameEvents from "../../../shared/GameEvents";

const TAG = "[phidgets]";
const DEBOUNCE_MS = 20;
const TOTAL_CHANNELS = 12;

/**
 * Initialize all 12 DAQ1301 digital inputs and wire them to Socket.io.
 * Connects via USB (VINT hub), NOT network server.
 * Gracefully falls back if hardware is unavailable.
 */
export async function initPhidgets(io: Server): Promise<void> {
  const hubPort = parseInt(process.env.PHIDGET_HUB_PORT || "0", 10);

  const conn = new phidget22.USBConnection();
  try {
    await conn.connect();
    console.log(`${TAG} USB connection established`);
  } catch (err) {
    console.warn(`${TAG} USB connection failed: ${err}`);
    console.warn(`${TAG} Continuing without hardware button support`);
    return;
  }

  for (let ch = 0; ch < TOTAL_CHANNELS; ch++) {
    const player = Math.floor(ch / 2);
    const direction: "left" | "right" = ch % 2 === 0 ? "left" : "right";

    const input = new phidget22.DigitalInput();
    input.setHubPort(hubPort);
    input.setChannel(ch);

    let lastEmitTime = 0;

    input.onStateChange = (state: boolean) => {
      const now = Date.now();
      if (now - lastEmitTime < DEBOUNCE_MS) return;
      lastEmitTime = now;

      const label = state ? "DOWN" : "UP";
      console.log(`${TAG} ch${ch} -> P${player} ${direction} ${label}`);

      io.emit(GameEvents.PlayerInput, {
        player,
        direction,
        pressed: state,
        timestamp: now,
      });
    };

    input.onAttach = () => {
      console.log(`${TAG} ch${ch} attached (P${player} ${direction})`);
    };

    input.onDetach = () => {
      console.warn(`${TAG} ch${ch} detached (P${player} ${direction})`);
    };

    input.onError = (code: number, msg: string) => {
      console.error(`${TAG} ch${ch} error ${code}: ${msg}`);
    };

    try {
      await input.open(5000);
    } catch (err) {
      console.error(`${TAG} Failed to open ch${ch}: ${err}`);
    }
  }
}
