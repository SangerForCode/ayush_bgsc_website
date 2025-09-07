const express = require("express");
const router = express.Router();
const ScoreEvent = require("../models/ScoreEvent");
const Joi = require("joi");

// Validation schema
const scoreEventSchema = Joi.object({
  game_id: Joi.number().integer().positive().required(),
  team_id: Joi.number().integer().positive().required(),
  player_id: Joi.number().integer().positive().allow(null),
  sport: Joi.string().valid("FOOTBALL", "BASKETBALL", "CRICKET").required(),
  points: Joi.number().integer().min(0).default(0),
  runs: Joi.number().integer().min(0).default(0),
  wicket: Joi.boolean().default(false),
  batting_side: Joi.string().valid("TEAM1", "TEAM2").allow(null),
});

// GET /api/events - Get score events with optional filters
router.get("/", async (req, res) => {
  try {
    const { game_id, team_id, limit } = req.query;

    const events = await ScoreEvent.getAll(
      game_id ? parseInt(game_id) : null,
      team_id ? parseInt(team_id) : null,
      limit ? parseInt(limit) : 50
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching score events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch score events",
      error: error.message,
    });
  }
});

// GET /api/events/recent - Get recent score events across all games
router.get("/recent", async (req, res) => {
  try {
    const { limit } = req.query;
    const events = await ScoreEvent.getRecentEvents(
      limit ? parseInt(limit) : 20
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching recent events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent events",
      error: error.message,
    });
  }
});

// POST /api/events - Create new score event
router.post("/", async (req, res) => {
  try {
    const { error, value } = scoreEventSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const eventId = await ScoreEvent.create(value);

    // Emit socket event for live updates
    if (req.app.get("io")) {
      const eventData = {
        kind: "score_event",
        event_id: eventId,
        game_id: value.game_id,
        team_id: value.team_id,
        player_id: value.player_id,
        sport: value.sport,
        points: value.points,
        runs: value.runs,
        wicket: value.wicket,
        batting_side: value.batting_side,
        timestamp: new Date().toISOString(),
      };

      req.app.get("io").emit("score_event", eventData);
    }

    res.status(201).json({
      success: true,
      data: { id: eventId },
      message: "Score event created successfully",
    });
  } catch (error) {
    console.error("Error creating score event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create score event",
      error: error.message,
    });
  }
});

// DELETE /api/events/:id - Delete score event
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ScoreEvent.delete(parseInt(id));

    res.json({
      success: true,
      message: "Score event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting score event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete score event",
      error: error.message,
    });
  }
});

module.exports = router;
