const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Import routes
const teamsRouter = require("./routes/teams");
const playersRouter = require("./routes/players");
const gamesRouter = require("./routes/games");
const eventsRouter = require("./routes/events");

// Import middleware
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const {
  generalLimiter,
  createLimiter,
  eventsLimiter,
} = require("./middleware/rateLimiter");

// Import socket handlers
const { socketAuth, handleConnection } = require("./socket/socketHandlers");

// Import database
const db = require("./config/database");

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible throughout the app
app.set("io", io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files for testing
app.use("/public", express.static("public"));

// Rate limiting
app.use("/api/", generalLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Sports League API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/teams", teamsRouter);
app.use("/api/players", playersRouter);
app.use("/api/games", gamesRouter);
app.use("/api/events", eventsLimiter, eventsRouter);

// Apply create limiter to POST routes
app.use("/api/teams", createLimiter);
app.use("/api/players", createLimiter);
app.use("/api/games", createLimiter);

// Socket.IO setup
io.use(socketAuth);
io.on("connection", handleConnection(io));

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Sports League API v1.0.0",
    endpoints: {
      teams: {
        "GET /api/teams": "Get all teams",
        "GET /api/teams/:id": "Get team by ID",
        "GET /api/teams/:id/stats": "Get team statistics",
        "POST /api/teams": "Create new team",
        "PUT /api/teams/:id": "Update team",
        "DELETE /api/teams/:id": "Delete team",
      },
      players: {
        "GET /api/players": "Get all players",
        "GET /api/players/:id": "Get player by ID",
        "GET /api/players/:id/stats": "Get player statistics",
        "POST /api/players": "Create new player",
        "PUT /api/players/:id": "Update player",
        "PUT /api/players/:id/stats/:gameId": "Update player stats",
        "DELETE /api/players/:id": "Delete player",
      },
      games: {
        "GET /api/games": "Get all games (with filters)",
        "GET /api/games/live": "Get live games",
        "GET /api/games/upcoming": "Get upcoming games",
        "GET /api/games/finished": "Get finished games",
        "GET /api/games/:id": "Get game by ID",
        "GET /api/games/:id/info": "Get detailed game info",
        "POST /api/games": "Create new game",
        "PUT /api/games/:id/score": "Update game score",
        "PUT /api/games/:id/status": "Update game status",
        "DELETE /api/games/:id": "Delete game",
      },
      events: {
        "GET /api/events": "Get score events (with filters)",
        "GET /api/events/recent": "Get recent events",
        "POST /api/events": "Create score event",
        "DELETE /api/events/:id": "Delete score event",
      },
      websocket: {
        "/ws/live": "WebSocket endpoint for live updates",
      },
    },
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await db.query("SELECT 1");
    console.log("✅ Database connection successful");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Please:
1. Kill the process using port ${PORT}: taskkill /PID <PID> /F
2. Or use a different port: PORT=3001 node server.js
3. Or wait a moment and try again`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    db.close().then(() => {
      console.log("Database connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    db.close().then(() => {
      console.log("Database connection closed");
      process.exit(0);
    });
  });
});

startServer();

module.exports = app;
