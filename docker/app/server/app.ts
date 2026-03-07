import express = require("express");
import { Socket } from "socket.io";
import GameEvents from "../shared/GameEvents";
import "dotenv/config";
import { initPhidgets } from "./src/utils/phidgets";
import { SettingsLoader } from "./src/services/SettingsLoader";
import { createHealthRoutes } from "./src/routes/health";
import { tunnelProtection } from "./src/middleware/tunnelProtection";
const path = require("path");

const app: express.Application = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: true,
  origins: ["*"],
});
const cors = require("cors");

const port = parseInt(process.env.PORT || "3000", 10);
const isDev = process.env.NODE_ENV !== "production";

// Load configuration from settings.json
const settingsPath = "./content/settings.json";
let settingsLoader: SettingsLoader;

try {
  settingsLoader = new SettingsLoader(settingsPath);
  console.log("Settings loaded successfully");
} catch (error) {
  console.error("Failed to load settings:", error);
  process.exit(1);
}

// Initialize Phidgets hardware input (USB via VINT hub)
initPhidgets(io);

// Express middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tunnel protection middleware - blocks game access via Cloudflare tunnel
// Must be before static file serving and routes
app.use(tunnelProtection);

app.options("*", cors());

// Static file serving and routes
if (isDev) {
  // Development: Client runs on separate dev server (port 8080)
  app.get("/", (req, res) => {
    res.send(`
      <html>
        <head><title>Development Server</title></head>
        <body style="font-family: system-ui; padding: 2rem;">
          <h1>Mobiliar Arena - Dev Server</h1>
          <p>The server is running on port ${port}.</p>
          <p><strong>To view the game, open:</strong> <a href="http://localhost:8080">http://localhost:8080</a></p>
          <p>Make sure the client dev server is running:</p>
          <pre>cd docker/app/client && npm run dev</pre>
        </body>
      </html>
    `);
  });

  // Serve static files from public directory even in dev mode
  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));
} else {
  // Production: Serve built client files
  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));

  app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

// Settings API endpoint
app.get("/api/settings", (req, res) => {
  try {
    const settings = settingsLoader.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error serving settings:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// Theme API endpoint
app.get("/api/admin/theme", (req, res) => {
  try {
    const settings = settingsLoader.getAllSettings();
    res.json({
      success: true,
      data: {
        active: (settings as any).theme || "basketball",
        available: (settings as any).availableThemes || ["basketball", "handball", "volleyball", "floorball", "corporate"],
      },
    });
  } catch (error) {
    console.error("Error fetching theme:", error);
    res.status(500).json({ success: false, error: "Failed to fetch theme" });
  }
});

app.put("/api/admin/theme", (req, res) => {
  try {
    const { theme } = req.body;
    const settings = settingsLoader.getAllSettings();
    const available = (settings as any).availableThemes || ["basketball", "handball", "volleyball", "floorball", "corporate"];

    if (!theme || !available.includes(theme)) {
      return res.status(400).json({
        success: false,
        error: `Invalid theme. Must be one of: ${available.join(", ")}`,
      });
    }

    // Update settings.json on disk
    const fs = require("fs");
    const rawSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    rawSettings.theme = theme;
    fs.writeFileSync(settingsPath, JSON.stringify(rawSettings, null, 2));

    // Reload settings in memory
    (settingsLoader as any).settings = rawSettings;

    // Notify clients to reload
    io.emit(GameEvents.Reload);

    console.log(`Theme changed to: ${theme}`);
    res.json({ success: true, data: { active: theme, available } });
  } catch (error) {
    console.error("Error updating theme:", error);
    res.status(500).json({ success: false, error: "Failed to update theme" });
  }
});

// Language API endpoints
app.get("/api/admin/language", (req, res) => {
  try {
    const settings = settingsLoader.getAllSettings() as any;
    res.json({
      success: true,
      data: { active: settings.language || "de" },
    });
  } catch (error) {
    console.error("Error fetching language:", error);
    res.status(500).json({ success: false, error: "Failed to fetch language" });
  }
});

app.put("/api/admin/language", (req, res) => {
  try {
    const { language } = req.body;
    const valid = ["de", "fr"];

    if (!language || !valid.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Invalid language. Must be one of: ${valid.join(", ")}`,
      });
    }

    const fs = require("fs");
    const rawSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    rawSettings.language = language;
    fs.writeFileSync(settingsPath, JSON.stringify(rawSettings, null, 2));
    (settingsLoader as any).settings = rawSettings;

    io.emit(GameEvents.Reload);

    console.log(`Language changed to: ${language}`);
    res.json({ success: true, data: { active: language } });
  } catch (error) {
    console.error("Error updating language:", error);
    res.status(500).json({ success: false, error: "Failed to update language" });
  }
});

// High score API endpoints
app.get("/api/highscore", (req, res) => {
  try {
    const settings = settingsLoader.getAllSettings() as any;
    res.json({ highScore: settings.highScore ?? 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch high score" });
  }
});

app.put("/api/highscore", (req, res) => {
  try {
    const { highScore } = req.body;
    if (typeof highScore !== "number" || highScore < 0) {
      return res.status(400).json({ error: "Invalid high score value" });
    }

    const fs = require("fs");
    const rawSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    rawSettings.highScore = highScore;
    fs.writeFileSync(settingsPath, JSON.stringify(rawSettings, null, 2));
    (settingsLoader as any).settings = rawSettings;

    console.log(`High score updated: ${highScore}`);
    res.json({ success: true, highScore });
  } catch (error) {
    console.error("Error updating high score:", error);
    res.status(500).json({ error: "Failed to update high score" });
  }
});

// Game settings API endpoints (game duration)
app.get("/api/admin/game-settings", (req, res) => {
  try {
    const settings = settingsLoader.getAllSettings() as any;
    res.json({
      success: true,
      data: {
        gameDurationMs: settings.gameDurationMs ?? 30000,
      },
    });
  } catch (error) {
    console.error("Error fetching game settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch game settings" });
  }
});

app.put("/api/admin/game-settings", (req, res) => {
  try {
    const { gameDurationMs } = req.body;
    const fs = require("fs");
    const rawSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

    if (gameDurationMs !== undefined) {
      rawSettings.gameDurationMs = Number(gameDurationMs);
    }

    fs.writeFileSync(settingsPath, JSON.stringify(rawSettings, null, 2));
    (settingsLoader as any).settings = rawSettings;

    // Notify clients to reload
    io.emit(GameEvents.Reload);

    console.log(`Game settings updated: gameDurationMs=${rawSettings.gameDurationMs}`);
    res.json({
      success: true,
      data: {
        gameDurationMs: rawSettings.gameDurationMs,
      },
    });
  } catch (error) {
    console.error("Error updating game settings:", error);
    res.status(500).json({ success: false, error: "Failed to update game settings" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Health check routes (no authentication required)
app.use("/health", createHealthRoutes());

// Socket.io connection handling
io.on("connection", (socket: Socket) => {
  // Check if connection is coming through Cloudflare tunnel
  const isTunnel = socket.handshake.headers['cf-connecting-ip'] ||
                   socket.handshake.headers['cf-ray'] ||
                   socket.handshake.headers['cf-visitor'];

  if (isTunnel) {
    console.log(`Tunnel Socket.io connection blocked: ${socket.id}`);
    socket.emit('error', { message: 'Game not available via tunnel' });
    socket.disconnect(true);
    return;
  }

  console.log(`Client connected: ${socket.id}`);

  // Handle preload finished event
  socket.on(GameEvents.PreloadFinished, () => {
    console.log(`Client ${socket.id} finished preloading`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
http.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Mode: ${isDev ? "Development" : "Production"}`);
  console.log(`Settings loaded from: ${settingsPath}`);

  if (isDev) {
    console.log(`\n🎮 Development mode - Client should run on http://localhost:8080`);
    console.log(`   Run: cd docker/app/client && npm run dev\n`);
  }
});
