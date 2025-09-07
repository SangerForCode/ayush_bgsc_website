const db = require("../config/database");

class Team {
  static async getAll() {
    const sql = `
            SELECT 
                t.id,
                t.name,
                t.leader_id,
                p.name as leader_name,
                COUNT(players.id) as player_count
            FROM Team t
            LEFT JOIN Player p ON t.leader_id = p.id
            LEFT JOIN Player players ON t.id = players.team_id
            GROUP BY t.id, t.name, t.leader_id, p.name
            ORDER BY t.name
        `;
    return await db.query(sql);
  }

  static async getById(id) {
    const sql = `
            SELECT 
                t.id,
                t.name,
                t.leader_id,
                p.name as leader_name
            FROM Team t
            LEFT JOIN Player p ON t.leader_id = p.id
            WHERE t.id = ?
        `;
    const [team] = await db.query(sql, [id]);

    if (team) {
      // Get team players
      const playersSql = `
                SELECT id, name, last_updated
                FROM Player
                WHERE team_id = ?
                ORDER BY name
            `;
      team.players = await db.query(playersSql, [id]);
    }

    return team;
  }

  static async create(teamData) {
    const sql = "INSERT INTO Team (name, leader_id) VALUES (?, ?)";
    const result = await db.query(sql, [
      teamData.name,
      teamData.leader_id || null,
    ]);
    return result.insertId;
  }

  static async update(id, teamData) {
    const sql = "UPDATE Team SET name = ?, leader_id = ? WHERE id = ?";
    await db.query(sql, [teamData.name, teamData.leader_id || null, id]);
    return this.getById(id);
  }

  static async delete(id) {
    const sql = "DELETE FROM Team WHERE id = ?";
    await db.query(sql, [id]);
    return true;
  }

  static async getTeamStats(id) {
    const sql = `
            SELECT 
                COUNT(DISTINCT g.id) as games_played,
                SUM(CASE WHEN g.status = 'FINISHED' AND 
                    ((g.team1_id = ? AND g.team1_score > g.team2_score) OR 
                     (g.team2_id = ? AND g.team2_score > g.team1_score)) 
                    THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN g.status = 'FINISHED' AND 
                    ((g.team1_id = ? AND g.team1_score < g.team2_score) OR 
                     (g.team2_id = ? AND g.team2_score < g.team1_score)) 
                    THEN 1 ELSE 0 END) as losses,
                SUM(CASE WHEN g.status = 'FINISHED' AND g.team1_score = g.team2_score 
                    THEN 1 ELSE 0 END) as draws
            FROM Game g
            WHERE g.team1_id = ? OR g.team2_id = ?
        `;
    const [stats] = await db.query(sql, [id, id, id, id, id, id]);
    return stats || { games_played: 0, wins: 0, losses: 0, draws: 0 };
  }
}

module.exports = Team;
