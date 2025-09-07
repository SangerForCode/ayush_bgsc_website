const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const Joi = require("joi");

// Validation schemas
const teamSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  leader_id: Joi.number().integer().positive().allow(null),
});

// GET /api/teams - Get all teams
router.get("/", async (req, res) => {
  try {
    const teams = await Team.getAll();
    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
});

// GET /api/teams/:id - Get team by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.getById(parseInt(id));

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team",
      error: error.message,
    });
  }
});

// GET /api/teams/:id/stats - Get team statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await Team.getTeamStats(parseInt(id));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching team stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team statistics",
      error: error.message,
    });
  }
});

// POST /api/teams - Create new team
router.post("/", async (req, res) => {
  try {
    const { error, value } = teamSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const teamId = await Team.create(value);
    const newTeam = await Team.getById(teamId);

    res.status(201).json({
      success: true,
      data: newTeam,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create team",
      error: error.message,
    });
  }
});

// PUT /api/teams/:id - Update team
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = teamSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const updatedTeam = await Team.update(parseInt(id), value);

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.json({
      success: true,
      data: updatedTeam,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update team",
      error: error.message,
    });
  }
});

// DELETE /api/teams/:id - Delete team
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Team.delete(parseInt(id));

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete team",
      error: error.message,
    });
  }
});

module.exports = router;
