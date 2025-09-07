const db = require("../config/database");

class Game {
  static async getAll(status = null, sport = null) {
    let sql = `
            SELECT 
                g.id,
                g.sport,
                g.status,
                g.scheduled_time,
                g.team1_score,
                g.team2_score,
                g.created_at,
                g.updated_at,
                t1.name as team1_name,
                t2.name as team2_name
            FROM Game g
            JOIN Team t1 ON g.team1_id = t1.id
            JOIN Team t2 ON g.team2_id = t2.id
            WHERE 1=1
        `;

    const params = [];

    if (status) {
      sql += " AND g.status = ?";
      params.push(status);
    }

    if (sport) {
      sql += " AND g.sport = ?";
      params.push(sport);
    }

    sql += " ORDER BY g.scheduled_time DESC";

    return await db.query(sql, params);
  }

  static async getById(id) {
    const sql = `
            SELECT 
                g.id,
                g.sport,
                g.status,
                g.scheduled_time,
                g.team1_id,
                g.team2_id,
                g.team1_score,
                g.team2_score,
                g.created_at,
                g.updated_at,
                t1.name as team1_name,
                t2.name as team2_name
            FROM Game g
            JOIN Team t1 ON g.team1_id = t1.id
            JOIN Team t2 ON g.team2_id = t2.id
            WHERE g.id = ?
        `;
    const [game] = await db.query(sql, [id]);

    if (game && game.sport === "CRICKET") {
      const cricketSql = `
                SELECT 
                    team1_deaths,
                    team2_deaths,
                    batting_side,
                    current_batsman_id,
                    current_bowler_id,
                    p1.name as current_batsman_name,
                    p2.name as current_bowler_name
                FROM Cricket c
                LEFT JOIN Player p1 ON c.current_batsman_id = p1.id
                LEFT JOIN Player p2 ON c.current_bowler_id = p2.id
                WHERE c.game_ptr_id = ?
            `;
      const [cricketData] = await db.query(cricketSql, [id]);
      if (cricketData) {
        game.cricket_data = cricketData;
      }
    }

    return game;
  }

  static async getGameInfo(id) {
    const game = await this.getById(id);

    if (!game) return null;

    // Get player stats for this game
    const statsSql = `
            SELECT 
                ps.*,
                p.name as player_name,
                t.name as team_name
            FROM PlayerStat ps
            JOIN Player p ON ps.player_id = p.id
            JOIN Team t ON ps.team_id = t.id
            WHERE ps.game_id = ?
            ORDER BY t.name, p.name
        `;
    game.player_stats = await db.query(statsSql, [id]);

    // Get score events for this game
    const eventsSql = `
            SELECT 
                se.*,
                p.name as player_name,
                t.name as team_name
            FROM ScoreEvent se
            JOIN Team t ON se.team_id = t.id
            LEFT JOIN Player p ON se.player_id = p.id
            WHERE se.game_id = ?
            ORDER BY se.created_at DESC
            LIMIT 50
        `;
    game.score_events = await db.query(eventsSql, [id]);

    return game;
  }

  static async create(gameData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Insert main game record
      const gameSql = `
                INSERT INTO Game (sport, status, scheduled_time, team1_id, team2_id, team1_score, team2_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
      const [gameResult] = await connection.execute(gameSql, [
        gameData.sport,
        gameData.status || "SCHEDULED",
        gameData.scheduled_time,
        gameData.team1_id,
        gameData.team2_id,
        gameData.team1_score || 0,
        gameData.team2_score || 0,
      ]);

      const gameId = gameResult.insertId;

      // Insert sport-specific record
      if (gameData.sport === "FOOTBALL") {
        await connection.execute(
          "INSERT INTO Football (game_ptr_id) VALUES (?)",
          [gameId]
        );
      } else if (gameData.sport === "BASKETBALL") {
        await connection.execute(
          "INSERT INTO Basketball (game_ptr_id) VALUES (?)",
          [gameId]
        );
      } else if (gameData.sport === "CRICKET") {
        const cricketSql = `
                    INSERT INTO Cricket (game_ptr_id, team1_deaths, team2_deaths, batting_side, current_batsman_id, current_bowler_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
        await connection.execute(cricketSql, [
          gameId,
          gameData.team1_deaths || 0,
          gameData.team2_deaths || 0,
          gameData.batting_side || "TEAM1",
          gameData.current_batsman_id || null,
          gameData.current_bowler_id || null,
        ]);
      }

      // Create player stats for all players in both teams
      const playersSql = `
                SELECT id, team_id FROM Player 
                WHERE team_id IN (?, ?)
            `;
      const players = await connection.execute(playersSql, [
        gameData.team1_id,
        gameData.team2_id,
      ]);

      for (const player of players[0]) {
        const statSql = `
                    INSERT INTO PlayerStat (game_id, player_id, team_id, points, runs, balls, wickets)
                    VALUES (?, ?, ?, 0, 0, 0, 0)
                `;
        await connection.execute(statSql, [gameId, player.id, player.team_id]);
      }

      await connection.commit();
      return gameId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateScore(id, scoreData) {
    const sql = `
            UPDATE Game 
            SET team1_score = ?, team2_score = ?, status = ?, updated_at = NOW()
            WHERE id = ?
        `;
    await db.query(sql, [
      scoreData.team1_score,
      scoreData.team2_score,
      scoreData.status || "LIVE",
      id,
    ]);
    return this.getById(id);
  }

  static async updateStatus(id, status) {
    const sql = "UPDATE Game SET status = ?, updated_at = NOW() WHERE id = ?";
    await db.query(sql, [status, id]);
    return this.getById(id);
  }

  static async getLiveGames() {
    return await this.getAll("LIVE");
  }

  static async getUpcomingGames() {
    return await this.getAll("SCHEDULED");
  }

  static async getFinishedGames() {
    return await this.getAll("FINISHED");
  }

  static async delete(id) {
    // Due to cascade delete, this will remove all related records
    const sql = "DELETE FROM Game WHERE id = ?";
    await db.query(sql, [id]);
    return true;
  }
}

module.exports = Game;
