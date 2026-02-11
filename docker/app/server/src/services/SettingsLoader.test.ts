import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SettingsLoader } from "./SettingsLoader";
import * as fs from "fs";

// Mock the fs module
vi.mock("fs");

describe("SettingsLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load valid settings from file", () => {
    const mockSettings = {
      game: {
        title: "Test Game",
        version: "1.0.0",
      },
      prizes: {
        prizeTypes: {
          "prize-a": {
            type: "inventory",
            inventory: [["2025-11-24", 200]],
            textureKey: "prize-a",
            displayName: "Prize A",
          },
        },
        consolationWishes: Array(30).fill("Test wish"),
        operatingHours: {
          openTime: "10:00",
          closeTime: "20:00",
        },
        algorithm: {
          openTime: "10:00",
          closeTime: "20:00",
          windowStart: 0.7,
          windowEnd: 1.5,
          minProbability: 0.02,
          rampStart: 0.15,
          rampEnd: 0.75,
          urgentProbability: 0.95,
        },
      },
    };

    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(mockSettings));

    const loader = new SettingsLoader("./test-settings.json");
    const settings = loader.getAllSettings();

    expect(settings).toEqual(mockSettings);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      "./test-settings.json",
      "utf8"
    );
  });

  it("should throw error if settings file cannot be read", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File not found");
    });

    expect(() => {
      new SettingsLoader("./nonexistent.json");
    }).toThrow("Failed to load settings");
  });

  it("should throw error if settings do not contain game object", () => {
    const invalidSettings = {
      notGame: {},
    };

    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify(invalidSettings)
    );

    expect(() => {
      new SettingsLoader("./invalid-settings.json");
    }).toThrow('Settings must contain a "game" object');
  });

  it("should return a copy of settings (not original object)", () => {
    const mockSettings = {
      game: {
        title: "Test Game",
      },
      prizes: {
        prizeTypes: {
          "prize-a": {
            type: "inventory",
            inventory: [["2025-11-24", 200]],
            textureKey: "prize-a",
            displayName: "Prize A",
          },
        },
        consolationWishes: Array(30).fill("Test wish"),
        operatingHours: {
          openTime: "10:00",
          closeTime: "20:00",
        },
        algorithm: {
          openTime: "10:00",
          closeTime: "20:00",
          windowStart: 0.7,
          windowEnd: 1.5,
          minProbability: 0.02,
          rampStart: 0.15,
          rampEnd: 0.75,
          urgentProbability: 0.95,
        },
      },
    };

    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(mockSettings));

    const loader = new SettingsLoader("./test-settings.json");
    const settings1 = loader.getAllSettings();
    const settings2 = loader.getAllSettings();

    expect(settings1).toEqual(settings2);
    expect(settings1).not.toBe(settings2); // Different objects
  });
});
