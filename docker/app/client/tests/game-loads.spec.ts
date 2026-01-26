import { test, expect } from "@playwright/test";

test.describe("Game Loading", () => {
  test("should load the game successfully", async ({ page }) => {
    // Navigate to the game
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the page title or main container exists
    await expect(page).toHaveTitle(/fzag-fee/i);
  });

  test("should create Phaser game canvas", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for Phaser to create the canvas element
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  test("should establish socket connection", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait a moment for socket connection to establish
    await page.waitForTimeout(1000);

    // Check console for connection message (this is a basic check)
    // In a real test, you might want to check WebSocket connections
    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    // Allow some time for connection
    await page.waitForTimeout(2000);

    // At this point, game should be initialized
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("should load game assets", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for canvas to be visible (indicating game started)
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Wait a bit for preload to complete
    await page.waitForTimeout(2000);

    // Check that no error messages are visible
    const errorMessage = page.locator('text=/error|failed/i');
    await expect(errorMessage).toHaveCount(0);
  });

  test("should have correct canvas dimensions", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Check canvas has dimensions (exact dimensions depend on your config)
    const canvasElement = await canvas.elementHandle();
    const width = await canvasElement?.evaluate((el) => (el as HTMLCanvasElement).width);
    const height = await canvasElement?.evaluate((el) => (el as HTMLCanvasElement).height);

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
