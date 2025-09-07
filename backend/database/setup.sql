-- Sports League Database Setup Script
-- Run this script to create the database and initial data

CREATE DATABASE IF NOT EXISTS sports_league;
USE sports_league;

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS ScoreEvent;
DROP TABLE IF EXISTS PlayerStat;
DROP TABLE IF EXISTS Cricket;
DROP TABLE IF EXISTS Basketball;
DROP TABLE IF EXISTS Football;
DROP TABLE IF EXISTS Game;
DROP TABLE IF EXISTS Player;
DROP TABLE IF EXISTS Team;

-- ==========================
-- TEAM (initially without leader FK)
-- ==========================
CREATE TABLE Team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    leader_id INT NULL
);

-- ==========================
-- PLAYER
-- ==========================
CREATE TABLE Player (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    team_id INT NOT NULL,
    CONSTRAINT fk_player_team FOREIGN KEY (team_id) REFERENCES Team(id)
);

-- ==========================
-- Fix circular FK: now add leader_id → Player
-- ==========================
ALTER TABLE Team
ADD CONSTRAINT fk_team_leader FOREIGN KEY (leader_id) REFERENCES Player(id);

-- ==========================
-- GAME
-- ==========================
CREATE TABLE Game (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sport ENUM('FOOTBALL', 'BASKETBALL', 'CRICKET') DEFAULT 'FOOTBALL',
    status ENUM('SCHEDULED', 'LIVE', 'FINISHED') DEFAULT 'SCHEDULED',
    scheduled_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    team1_score INT UNSIGNED DEFAULT 0,
    team2_score INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_team1 FOREIGN KEY (team1_id) REFERENCES Team(id),
    CONSTRAINT fk_game_team2 FOREIGN KEY (team2_id) REFERENCES Team(id)
);

-- ==========================
-- FOOTBALL
-- ==========================
CREATE TABLE Football (
    game_ptr_id INT PRIMARY KEY,
    CONSTRAINT fk_football_game FOREIGN KEY (game_ptr_id) REFERENCES Game(id) ON DELETE CASCADE
);

-- ==========================
-- BASKETBALL
-- ==========================
CREATE TABLE Basketball (
    game_ptr_id INT PRIMARY KEY,
    CONSTRAINT fk_basketball_game FOREIGN KEY (game_ptr_id) REFERENCES Game(id) ON DELETE CASCADE
);

-- ==========================
-- CRICKET
-- ==========================
CREATE TABLE Cricket (
    game_ptr_id INT PRIMARY KEY,
    team1_deaths INT UNSIGNED DEFAULT 0,
    team2_deaths INT UNSIGNED DEFAULT 0,
    batting_side ENUM('TEAM1', 'TEAM2') DEFAULT 'TEAM1',
    current_batsman_id INT NULL,
    current_bowler_id INT NULL,
    CONSTRAINT fk_cricket_game FOREIGN KEY (game_ptr_id) REFERENCES Game(id) ON DELETE CASCADE,
    CONSTRAINT fk_cricket_batsman FOREIGN KEY (current_batsman_id) REFERENCES Player(id),
    CONSTRAINT fk_cricket_bowler FOREIGN KEY (current_bowler_id) REFERENCES Player(id)
);

-- ==========================
-- PLAYER STAT
-- ==========================
CREATE TABLE PlayerStat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    points INT UNSIGNED DEFAULT 0,
    runs INT UNSIGNED DEFAULT 0,
    balls INT UNSIGNED DEFAULT 0,
    wickets INT UNSIGNED DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_player_game (game_id, player_id),
    INDEX idx_game (game_id),
    INDEX idx_player (player_id),
    CONSTRAINT fk_stat_game FOREIGN KEY (game_id) REFERENCES Game(id) ON DELETE CASCADE,
    CONSTRAINT fk_stat_player FOREIGN KEY (player_id) REFERENCES Player(id) ON DELETE CASCADE,
    CONSTRAINT fk_stat_team FOREIGN KEY (team_id) REFERENCES Team(id) ON DELETE CASCADE
);

-- ==========================
-- SCORE EVENT
-- ==========================
CREATE TABLE ScoreEvent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    team_id INT NOT NULL,
    player_id INT NULL,
    sport ENUM('FOOTBALL', 'BASKETBALL', 'CRICKET') NOT NULL,
    points INT UNSIGNED DEFAULT 0,
    runs INT UNSIGNED DEFAULT 0,
    wicket BOOLEAN DEFAULT FALSE,
    batting_side ENUM('TEAM1', 'TEAM2') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_game_created (game_id, created_at),
    INDEX idx_team_created (team_id, created_at),
    CONSTRAINT fk_event_game FOREIGN KEY (game_id) REFERENCES Game(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_team FOREIGN KEY (team_id) REFERENCES Team(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_player FOREIGN KEY (player_id) REFERENCES Player(id) ON DELETE SET NULL
);

-- ==========================
-- INSERT SAMPLE DATA
-- ==========================

-- Insert Teams
INSERT INTO Team (name) VALUES ('Red Warriors'), ('Blue Titans'), ('Green Hawks');

-- Insert Players
INSERT INTO Player (name, team_id) VALUES
('Alice', 1), ('Bob', 1),
('Charlie', 2), ('David', 2),
('Eve', 3), ('Frank', 3);

-- Set Team Leaders
UPDATE Team SET leader_id = 1 WHERE id = 1;
UPDATE Team SET leader_id = 3 WHERE id = 2;
UPDATE Team SET leader_id = 5 WHERE id = 3;

-- Insert Games
INSERT INTO Game (sport, status, scheduled_time, team1_id, team2_id)
VALUES
('FOOTBALL', 'SCHEDULED', '2025-09-10 18:00:00', 1, 2),
('CRICKET', 'LIVE', '2025-09-11 15:00:00', 2, 3),
('BASKETBALL', 'FINISHED', '2025-09-05 20:00:00', 1, 3);

-- Specializations
INSERT INTO Football (game_ptr_id) VALUES (1);
INSERT INTO Cricket (game_ptr_id, team1_deaths, team2_deaths, batting_side, current_batsman_id, current_bowler_id)
VALUES (2, 1, 0, 'TEAM1', 3, 5);
INSERT INTO Basketball (game_ptr_id) VALUES (3);

-- Player Stats
INSERT INTO PlayerStat (game_id, player_id, team_id, points, runs, balls, wickets)
VALUES
(1, 1, 1, 2, 0, 0, 0), -- Alice scored 2 pts in football
(1, 3, 2, 1, 0, 0, 0), -- Charlie scored 1 pt in football
(2, 3, 2, 0, 35, 28, 0), -- Charlie batting in cricket
(2, 5, 3, 0, 0, 24, 2);  -- Eve bowling in cricket

-- Score Events
INSERT INTO ScoreEvent (game_id, team_id, player_id, sport, points, runs, wicket, batting_side)
VALUES
(1, 1, 1, 'FOOTBALL', 2, 0, FALSE, NULL), -- Alice scored goal
(1, 2, 3, 'FOOTBALL', 1, 0, FALSE, NULL), -- Charlie scored goal
(2, 2, 3, 'CRICKET', 0, 4, FALSE, 'TEAM1'), -- Charlie hit a boundary
(2, 3, 5, 'CRICKET', 0, 0, TRUE, 'TEAM1'); -- Eve took a wicket

-- Show created tables
SHOW TABLES;

-- Display sample data
SELECT 'Teams:' as Info;
SELECT * FROM Team;

SELECT 'Players:' as Info;
SELECT p.*, t.name as team_name FROM Player p JOIN Team t ON p.team_id = t.id;

SELECT 'Games:' as Info;
SELECT g.*, t1.name as team1_name, t2.name as team2_name 
FROM Game g 
JOIN Team t1 ON g.team1_id = t1.id 
JOIN Team t2 ON g.team2_id = t2.id;

SELECT 'Recent Score Events:' as Info;
SELECT se.*, t.name as team_name, p.name as player_name 
FROM ScoreEvent se 
JOIN Team t ON se.team_id = t.id 
LEFT JOIN Player p ON se.player_id = p.id 
ORDER BY se.created_at DESC;

COMMIT;
