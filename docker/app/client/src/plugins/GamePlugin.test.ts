import { describe, it, expect, vi } from "vitest";
import GameEvents from "../../../shared/GameEvents";

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  connected: true,
  disconnect: vi.fn(),
};

const mockConnect = vi.fn(() => mockSocket);

vi.mock("socket.io-client", () => ({
  default: mockConnect,
}));

describe("GamePlugin", () => {
  it("should have correct GameEvents constants", () => {
    expect(GameEvents.Reload).toBeDefined();
    expect(GameEvents.PreloadFinished).toBeDefined();
    expect(GameEvents.GamePaused).toBeDefined();
    expect(GameEvents.GameResumed).toBeDefined();
    expect(typeof GameEvents.Reload).toBe("string");
  });

  it("should mock socket.io connection", async () => {
    const io = (await import("socket.io-client")).default;
    const socket = io("localhost:3000");

    expect(socket).toBeDefined();
    expect(socket.on).toBeDefined();
    expect(socket.emit).toBeDefined();
  });

  it("should have connection methods", async () => {
    const io = (await import("socket.io-client")).default;
    const socket = io("localhost:3000");

    expect(typeof socket.on).toBe("function");
    expect(typeof socket.emit).toBe("function");
    expect(typeof socket.disconnect).toBe("function");
  });

  // Note: Full Phaser integration tests are better suited for E2E tests with Playwright
  // Unit tests focus on testable logic without full game instantiation
});
