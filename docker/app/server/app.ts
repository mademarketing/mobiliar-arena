import express = require("express");
import { Socket } from "socket.io";
import GameEvents from "../shared/GameEvents";
import "dotenv/config";
import { initPhidgets } from "./src/utils/phidgets";
import { SettingsLoader } from "./src/services/SettingsLoader";
import { PrizeEngine, PauseCallback } from "./src/services/PrizeEngine";
import { PrizeDatabase } from "./src/database/PrizeDatabase";
import { createAdminRoutes } from "./src/routes/admin";
import { createPromoterRoutes } from "./src/routes/promoter";
import { createDashboardRoutes } from "./src/routes/dashboard";
import { createHealthRoutes } from "./src/routes/health";
// Printer utilities available if needed
// import { printReceipt, printGameReceipt, ReceiptType } from "./src/utils/printer";
import { tunnelProtection } from "./src/middleware/tunnelProtection";
import session = require("express-session");
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
const databasePath = "./content/prizes.db";
let settingsLoader: SettingsLoader;
let prizeDatabase: PrizeDatabase;
let prizeEngine: PrizeEngine;

// Game pause state
let isGamePaused: boolean = false;
let pauseText: string = "Pause";

// Promotion settings
let promotionEndTime: string = "18:00";

// Machine identification (from environment variable)
const machineId = process.env.MACHINE_ID || "1";
const machineName = `Arena ${machineId}`;

/**
 * Get current game pause state
 */
function getGamePaused(): boolean {
  return isGamePaused;
}

/**
 * Set game pause state and broadcast to all clients
 */
function setGamePaused(paused: boolean): void {
  isGamePaused = paused;
  const event = paused ? GameEvents.GamePaused : GameEvents.GameResumed;
  const payload = { timestamp: new Date().toISOString() };
  io.emit(event, payload);
  console.log(`Game ${paused ? 'PAUSED' : 'RESUMED'} at ${payload.timestamp}`);
}

/**
 * Get promotion end time
 */
function getPromotionEndTime(): string {
  return promotionEndTime;
}

/**
 * Set promotion end time
 */
function setPromotionEndTime(time: string): void {
  promotionEndTime = time;
  console.log(`Promotion end time set to: ${time}`);
}

/**
 * Get pause text
 */
function getPauseText(): string {
  return pauseText;
}

/**
 * Set pause text
 */
function setPauseText(text: string): void {
  pauseText = text;
}

/**
 * Get machine name
 */
function getMachineName(): string {
  return machineName;
}

/**
 * Pause callback for when QR codes are depleted
 */
const pauseCallback: PauseCallback = (reason: string) => {
  console.log(`Auto-pausing game: ${reason}`);
  setPauseText(reason);
  setGamePaused(true);
};

try {
  settingsLoader = new SettingsLoader(settingsPath);
  console.log("Settings loaded successfully");

  // Initialize database
  prizeDatabase = new PrizeDatabase(databasePath);
  console.log("Prize database initialized successfully");

  // Initialize prize engine with database, pause check function, pause callback, and dynamic closeTime
  prizeEngine = new PrizeEngine(prizeDatabase, settingsLoader.getAllSettings(), getGamePaused, pauseCallback, getPromotionEndTime);
  console.log("Prize engine initialized successfully (Database Mode)");
} catch (error) {
  console.error("Failed to load settings, initialize database, or prize engine:", error);
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

// Session middleware for admin authentication
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mobiliar-arena-secret-2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.options("*", cors());

// Static file serving and routes
if (isDev) {
  // Development: Client runs on separate dev server (port 8080)
  app.get("/", (req, res) => {
    res.send(`
      <html>
        <head><title>Development Server</title></head>
        <body style="font-family: system-ui; padding: 2rem;">
          <h1>🎮 Mobiliar Arena - Dev Server</h1>
          <p>The server is running on port ${port}.</p>
          <p><strong>To view the game, open:</strong> <a href="http://localhost:8080">http://localhost:8080</a></p>
          <p><strong>To view the admin interface, open:</strong> <a href="http://localhost:${port}/admin">http://localhost:${port}/admin</a></p>
          <p>Make sure the client dev server is running:</p>
          <pre>cd docker/app/client && npm run dev</pre>
        </body>
      </html>
    `);
  });

  // Serve admin files from public directory even in dev mode
  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));

  app.get("/admin", (req, res) => {
    res.sendFile(path.join(publicPath, "admin.html"));
  });

  app.get("/promoter", (req, res) => {
    res.sendFile(path.join(publicPath, "promoter.html"));
  });

  app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(publicPath, "dashboard.html"));
  });
} else {
  // Production: Serve built client files
  // When compiled, app.js is in dist/server/, so public is in the same directory
  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));

  app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  app.get("/admin", (req, res) => {
    res.sendFile(path.join(publicPath, "admin.html"));
  });

  app.get("/promoter", (req, res) => {
    res.sendFile(path.join(publicPath, "promoter.html"));
  });

  app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(publicPath, "dashboard.html"));
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

// Admin API routes
app.use("/api/admin", createAdminRoutes(prizeDatabase));

// Promoter API routes
app.use("/api/promoter", createPromoterRoutes(
  prizeEngine,
  getGamePaused,
  setGamePaused,
  prizeDatabase,
  getPromotionEndTime,
  setPromotionEndTime,
  getPauseText,
  setPauseText,
  () => io.emit(GameEvents.Reload)  // Emit reload when settings change
));

// Dashboard API routes (public, no auth)
app.use("/api/dashboard", createDashboardRoutes(
  prizeEngine,
  getGamePaused,
  getPromotionEndTime,
  getMachineName
));

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

  // Log printer configuration
  console.log(`\n📠 Printer Configuration:`);
  console.log(`   PRINTER_ENABLED: ${process.env.PRINTER_ENABLED || '(not set)'}`);
  console.log(`   PRINTER_IP: ${process.env.PRINTER_IP || '(not set)'}`);
  if (process.env.PRINTER_ENABLED === 'true' && process.env.PRINTER_IP) {
    console.log(`   ✓ Printer enabled at ${process.env.PRINTER_IP}`);
  } else {
    console.log(`   ✗ Printer disabled or not configured`);
  }

  if (isDev) {
    console.log(`\n🎮 Development mode - Client should run on http://localhost:8080`);
    console.log(`   Run: cd docker/app/client && npm run dev\n`);
  }
});
