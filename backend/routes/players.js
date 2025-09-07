const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const Joi = require("joi");

// Validation schemas
const playerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  team_id: Joi.number().integer().positive().required(),
});

const playerStatSchema = Joi.object({
  points: Joi.number().integer().min(0),
  runs: Joi.number().integer().min(0),
  balls: Joi.number().integer().min(0),
  wickets: Joi.number().integer().min(0),
});

// GET /api/players - Get all players
router.get("/", async (req, res) => {
  try {
    const { team_id } = req.query;

    let players;
    if (team_id) {
      players = await Player.getByTeam(parseInt(team_id));
    } else {
      players = await Player.getAll();
    }

    res.json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch players",
      error: error.message,
    });
  }
});

// GET /api/players/:id - Get player by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const player = await Player.getById(parseInt(id));

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch player",
      error: error.message,
    });
  }
});

// GET /api/players/:id/stats - Get player statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const { game_id } = req.query;

    const stats = await Player.getPlayerStats(
      parseInt(id),
      game_id ? parseInt(game_id) : null
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch player statistics",
      error: error.message,
    });
  }
});

// POST /api/players - Create new player
router.post("/", async (req, res) => {
  try {
    const { error, value } = playerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const playerId = await Player.create(value);
    const newPlayer = await Player.getById(playerId);

    res.status(201).json({
      success: true,
      data: newPlayer,
      message: "Player created successfully",
    });
  } catch (error) {
    console.error("Error creating player:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create player",
      error: error.message,
    });
  }
});

// PUT /api/players/:id - Update player
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = playerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const updatedPlayer = await Player.update(parseInt(id), value);

    if (!updatedPlayer) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    res.json({
      success: true,
      data: updatedPlayer,
      message: "Player updated successfully",
    });
  } catch (error) {
    console.error("Error updating player:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update player",
      error: error.message,
    });
  }
});

// PUT /api/players/:id/stats/:gameId - Update player stats for a game
router.put("/:id/stats/:gameId", async (req, res) => {
  try {
    const { id, gameId } = req.params;
    const { error, value } = playerStatSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    await Player.updatePlayerStat(parseInt(gameId), parseInt(id), value);

    res.json({
      success: true,
      message: "Player stats updated successfully",
    });
  } catch (error) {
    console.error("Error updating player stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update player stats",
      error: error.message,
    });
  }
});

// DELETE /api/players/:id - Delete player
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Player.delete(parseInt(id));

    res.json({
      success: true,
      message: "Player deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting player:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete player",
      error: error.message,
    });
  }
});

module.exports = router;
