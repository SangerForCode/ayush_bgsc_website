const socketAuth = (socket, next) => {
  // Add authentication logic here if needed
  // For now, allow all connections
  next();
};

const handleConnection = (io) => {
  return (socket) => {
    console.log("Client connected:", socket.id);

    // Join live feed room
    socket.join("live");

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to live feed",
      timestamp: new Date().toISOString(),
    });

    // Handle custom events
    socket.on("join_game", (gameId) => {
      socket.join(`game_${gameId}`);
      console.log(`Client ${socket.id} joined game ${gameId}`);
    });

    socket.on("leave_game", (gameId) => {
      socket.leave(`game_${gameId}`);
      console.log(`Client ${socket.id} left game ${gameId}`);
    });

    socket.on("get_live_status", () => {
      // Send current live games status
      socket.emit("live_status", {
        timestamp: new Date().toISOString(),
        message: "Live status requested",
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  };
};

// Helper function to broadcast live updates
const broadcastUpdate = (io, data) => {
  const updateData = {
    kind: data.kind,
    game_id: data.game_id,
    sport: data.sport,
    team1_score: data.team1_score,
    team2_score: data.team2_score,
    status: data.status,
    team1_name: data.team1_name,
    team2_name: data.team2_name,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all clients in live room
  io.to("live").emit("live_update", updateData);

  // Also broadcast to specific game room
  io.to(`game_${data.game_id}`).emit("game_update", updateData);
};

// Helper function to broadcast score events
const broadcastScoreEvent = (io, eventData) => {
  const scoreEventData = {
    ...eventData,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all clients in live room
  io.to("live").emit("score_event", scoreEventData);

  // Also broadcast to specific game room
  io.to(`game_${eventData.game_id}`).emit("score_event", scoreEventData);
};

module.exports = {
  socketAuth,
  handleConnection,
  broadcastUpdate,
  broadcastScoreEvent,
};
