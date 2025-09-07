const db = require("../config/database");

class ScoreEvent {
  static async getAll(gameId = null, teamId = null, limit = 50) {
    let sql = `
            SELECT 
                se.*,
                p.name as player_name,
                t.name as team_name,
                g.sport as game_sport
            FROM ScoreEvent se
            JOIN Team t ON se.team_id = t.id
            JOIN Game g ON se.game_id = g.id
            LEFT JOIN Player p ON se.player_id = p.id
            WHERE 1=1
        `;

    const params = [];

    if (gameId) {
      sql += " AND se.game_id = ?";
      params.push(gameId);
    }

    if (teamId) {
      sql += " AND se.team_id = ?";
      params.push(teamId);
    }

    sql += " ORDER BY se.created_at DESC";

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    return await db.query(sql, params);
  }

  static async create(eventData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Insert score event
      const eventSql = `
                INSERT INTO ScoreEvent (game_id, team_id, player_id, sport, points, runs, wicket, batting_side)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
      const [eventResult] = await connection.execute(eventSql, [
        eventData.game_id,
        eventData.team_id,
        eventData.player_id || null,
        eventData.sport,
        eventData.points || 0,
        eventData.runs || 0,
        eventData.wicket || false,
        eventData.batting_side || null,
      ]);

      // Update game scores
      if (eventData.points > 0) {
        // Determine which team scored
        const [game] = await connection.execute(
          "SELECT team1_id, team2_id FROM Game WHERE id = ?",
          [eventData.game_id]
        );

        if (game.team1_id === eventData.team_id) {
          await connection.execute(
            "UPDATE Game SET team1_score = team1_score + ? WHERE id = ?",
            [eventData.points, eventData.game_id]
          );
        } else {
          await connection.execute(
            "UPDATE Game SET team2_score = team2_score + ? WHERE id = ?",
            [eventData.points, eventData.game_id]
          );
        }
      }

      // Update player stats if player is specified
      if (eventData.player_id) {
        const updateStatSql = `
                    UPDATE PlayerStat 
                    SET 
                        points = points + ?,
                        runs = runs + ?,
                        wickets = wickets + ?,
                        last_updated = NOW()
                    WHERE game_id = ? AND player_id = ?
                `;
        await connection.execute(updateStatSql, [
          eventData.points || 0,
          eventData.runs || 0,
          eventData.wicket ? 1 : 0,
          eventData.game_id,
          eventData.player_id,
        ]);
      }

      await connection.commit();
      return eventResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getRecentEvents(limit = 20) {
    const sql = `
            SELECT 
                se.*,
                p.name as player_name,
                t.name as team_name,
                g.sport as game_sport,
                t1.name as team1_name,
                t2.name as team2_name
            FROM ScoreEvent se
            JOIN Team t ON se.team_id = t.id
            JOIN Game g ON se.game_id = g.id
            JOIN Team t1 ON g.team1_id = t1.id
            JOIN Team t2 ON g.team2_id = t2.id
            LEFT JOIN Player p ON se.player_id = p.id
            ORDER BY se.created_at DESC
            LIMIT ?
        `;
    return await db.query(sql, [limit]);
  }

  static async delete(id) {
    const sql = "DELETE FROM ScoreEvent WHERE id = ?";
    await db.query(sql, [id]);
    return true;
  }
}

module.exports = ScoreEvent;
