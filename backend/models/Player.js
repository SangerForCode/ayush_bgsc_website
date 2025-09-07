const db = require("../config/database");

class Player {
  static async getAll() {
    const sql = `
            SELECT 
                p.id,
                p.name,
                p.last_updated,
                p.team_id,
                t.name as team_name
            FROM Player p
            LEFT JOIN Team t ON p.team_id = t.id
            ORDER BY p.name
        `;
    return await db.query(sql);
  }

  static async getById(id) {
    const sql = `
            SELECT 
                p.id,
                p.name,
                p.last_updated,
                p.team_id,
                t.name as team_name
            FROM Player p
            LEFT JOIN Team t ON p.team_id = t.id
            WHERE p.id = ?
        `;
    const [player] = await db.query(sql, [id]);
    return player;
  }

  static async getByTeam(teamId) {
    const sql = `
            SELECT id, name, last_updated, team_id
            FROM Player
            WHERE team_id = ?
            ORDER BY name
        `;
    return await db.query(sql, [teamId]);
  }

  static async create(playerData) {
    const sql = "INSERT INTO Player (name, team_id) VALUES (?, ?)";
    const result = await db.query(sql, [playerData.name, playerData.team_id]);
    return result.insertId;
  }

  static async update(id, playerData) {
    const sql = "UPDATE Player SET name = ?, team_id = ? WHERE id = ?";
    await db.query(sql, [playerData.name, playerData.team_id, id]);
    return this.getById(id);
  }

  static async delete(id) {
    const sql = "DELETE FROM Player WHERE id = ?";
    await db.query(sql, [id]);
    return true;
  }

  static async getPlayerStats(id, gameId = null) {
    let sql = `
            SELECT 
                ps.*,
                g.sport,
                g.scheduled_time,
                t1.name as team1_name,
                t2.name as team2_name
            FROM PlayerStat ps
            JOIN Game g ON ps.game_id = g.id
            JOIN Team t1 ON g.team1_id = t1.id
            JOIN Team t2 ON g.team2_id = t2.id
            WHERE ps.player_id = ?
        `;

    const params = [id];

    if (gameId) {
      sql += " AND ps.game_id = ?";
      params.push(gameId);
    }

    sql += " ORDER BY g.scheduled_time DESC";

    return await db.query(sql, params);
  }

  static async updatePlayerStat(gameId, playerId, statData) {
    const sql = `
            UPDATE PlayerStat 
            SET points = ?, runs = ?, balls = ?, wickets = ?, last_updated = NOW()
            WHERE game_id = ? AND player_id = ?
        `;
    await db.query(sql, [
      statData.points || 0,
      statData.runs || 0,
      statData.balls || 0,
      statData.wickets || 0,
      gameId,
      playerId,
    ]);
    return true;
  }
}

module.exports = Player;
