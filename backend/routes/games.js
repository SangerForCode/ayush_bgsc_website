const express = require("express");
const router = express.Router();
const Game = require("../models/Game");
const Joi = require("joi");

// Validation schemas
const gameSchema = Joi.object({
  sport: Joi.string().valid("FOOTBALL", "BASKETBALL", "CRICKET").required(),
  status: Joi.string()
    .valid("SCHEDULED", "LIVE", "FINISHED")
    .default("SCHEDULED"),
  scheduled_time: Joi.date().required(),
  team1_id: Joi.number().integer().positive().required(),
  team2_id: Joi.number().integer().positive().required(),
  team1_score: Joi.number().integer().min(0).default(0),
  team2_score: Joi.number().integer().min(0).default(0),
  // Cricket specific fields
  team1_deaths: Joi.number().integer().min(0).default(0),
  team2_deaths: Joi.number().integer().min(0).default(0),
  batting_side: Joi.string().valid("TEAM1", "TEAM2").default("TEAM1"),
  current_batsman_id: Joi.number().integer().positive().allow(null),
  current_bowler_id: Joi.number().integer().positive().allow(null),
});

const scoreUpdateSchema = Joi.object({
  team1_score: Joi.number().integer().min(0).required(),
  team2_score: Joi.number().integer().min(0).required(),
  status: Joi.string().valid("SCHEDULED", "LIVE", "FINISHED").default("LIVE"),
});

// GET /api/games - Get all games with optional filters
router.get("/", async (req, res) => {
  try {
    const { status, sport } = req.query;
    const games = await Game.getAll(status, sport);

    res.json({
      success: true,
      data: games,
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
      error: error.message,
    });
  }
});

// GET /api/games/live - Get live games
router.get("/live", async (req, res) => {
  try {
    const games = await Game.getLiveGames();

    res.json({
      success: true,
      data: games,
    });
  } catch (error) {
    console.error("Error fetching live games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live games",
      error: error.message,
    });
  }
});

// GET /api/games/upcoming - Get upcoming games
router.get("/upcoming", async (req, res) => {
  try {
    const games = await Game.getUpcomingGames();

    res.json({
      success: true,
      data: games,
    });
  } catch (error) {
    console.error("Error fetching upcoming games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming games",
      error: error.message,
    });
  }
});

// GET /api/games/finished - Get finished games
router.get("/finished", async (req, res) => {
  try {
    const games = await Game.getFinishedGames();

    res.json({
      success: true,
      data: games,
    });
  } catch (error) {
    console.error("Error fetching finished games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch finished games",
      error: error.message,
    });
  }
});

// GET /api/games/:id - Get game by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.getById(parseInt(id));

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game",
      error: error.message,
    });
  }
});

// GET /api/games/:id/info - Get detailed game information
router.get("/:id/info", async (req, res) => {
  try {
    const { id } = req.params;
    const gameInfo = await Game.getGameInfo(parseInt(id));

    if (!gameInfo) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      data: gameInfo,
    });
  } catch (error) {
    console.error("Error fetching game info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game information",
      error: error.message,
    });
  }
});

// POST /api/games - Create new game
router.post("/", async (req, res) => {
  try {
    const { error, value } = gameSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const gameId = await Game.create(value);
    const newGame = await Game.getById(gameId);

    res.status(201).json({
      success: true,
      data: newGame,
      message: "Game created successfully",
    });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create game",
      error: error.message,
    });
  }
});

// PUT /api/games/:id/score - Update game score
router.put("/:id/score", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = scoreUpdateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const updatedGame = await Game.updateScore(parseInt(id), value);

    if (!updatedGame) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Emit socket event for live updates
    if (req.app.get("io")) {
      req.app.get("io").emit("game_update", {
        kind: "score_update",
        game_id: updatedGame.id,
        sport: updatedGame.sport,
        team1_score: updatedGame.team1_score,
        team2_score: updatedGame.team2_score,
        status: updatedGame.status,
        team1_name: updatedGame.team1_name,
        team2_name: updatedGame.team2_name,
      });
    }

    res.json({
      success: true,
      data: updatedGame,
      message: "Game score updated successfully",
    });
  } catch (error) {
    console.error("Error updating game score:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update game score",
      error: error.message,
    });
  }
});

// PUT /api/games/:id/status - Update game status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["SCHEDULED", "LIVE", "FINISHED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be SCHEDULED, LIVE, or FINISHED",
      });
    }

    const updatedGame = await Game.updateStatus(parseInt(id), status);

    if (!updatedGame) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Emit socket event for live updates
    if (req.app.get("io")) {
      req.app.get("io").emit("game_update", {
        kind: "status_update",
        game_id: updatedGame.id,
        sport: updatedGame.sport,
        team1_score: updatedGame.team1_score,
        team2_score: updatedGame.team2_score,
        status: updatedGame.status,
        team1_name: updatedGame.team1_name,
        team2_name: updatedGame.team2_name,
      });
    }

    res.json({
      success: true,
      data: updatedGame,
      message: "Game status updated successfully",
    });
  } catch (error) {
    console.error("Error updating game status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update game status",
      error: error.message,
    });
  }
});

// DELETE /api/games/:id - Delete game
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Game.delete(parseInt(id));

    res.json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete game",
      error: error.message,
    });
  }
});

module.exports = router;
