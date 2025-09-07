# Sports League Backend API

A comprehensive Express.js backend for managing sports leagues with real-time updates using Socket.IO and MySQL database.

## Features

- RESTful API for managing teams, players, games, and score events
- Real-time live updates via WebSocket (Socket.IO)
- Support for multiple sports: Football, Basketball, Cricket
- Comprehensive game statistics and player performance tracking
- Rate limiting and security middleware
- MySQL database with proper schema design
- Input validation with Joi
- Error handling and logging

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with mysql2 driver
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## Installation

1. **Clone and navigate to the project:**

   ```bash
   cd d:\bgsc
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env` file and configure your database settings:

   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=sports_league
   SOCKET_CORS_ORIGIN=http://localhost:3000
   ```

4. **Set up MySQL database:**

   - Create the database and tables using the SQL script provided
   - Make sure MySQL server is running

5. **Start the server:**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `GET /api/teams/:id/stats` - Get team statistics
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Players

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `GET /api/players/:id/stats` - Get player statistics
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `PUT /api/players/:id/stats/:gameId` - Update player stats
- `DELETE /api/players/:id` - Delete player

### Games

- `GET /api/games` - Get all games (with filters: ?status=LIVE&sport=FOOTBALL)
- `GET /api/games/live` - Get live games
- `GET /api/games/upcoming` - Get upcoming games
- `GET /api/games/finished` - Get finished games
- `GET /api/games/:id` - Get game by ID
- `GET /api/games/:id/info` - Get detailed game info with stats and events
- `POST /api/games` - Create new game
- `PUT /api/games/:id/score` - Update game score
- `PUT /api/games/:id/status` - Update game status
- `DELETE /api/games/:id` - Delete game

### Score Events

- `GET /api/events` - Get score events (with filters: ?game_id=1&limit=20)
- `GET /api/events/recent` - Get recent events across all games
- `POST /api/events` - Create score event
- `DELETE /api/events/:id` - Delete score event

### Utility

- `GET /health` - Health check endpoint
- `GET /api` - API documentation

## WebSocket Events

Connect to `/ws/live` for real-time updates:

### Client Events (Send to server):

- `join_game` - Join a specific game room for updates
- `leave_game` - Leave a specific game room
- `get_live_status` - Request current live status

### Server Events (Receive from server):

- `connected` - Connection confirmation
- `live_update` - Real-time game updates
- `game_update` - Specific game updates
- `score_event` - New score events
- `live_status` - Current live status

### Example WebSocket Usage:

```javascript
const socket = io("http://localhost:3000");

socket.on("connected", (data) => {
  console.log("Connected:", data);
});

socket.on("live_update", (data) => {
  console.log("Live update:", data);
  // Update UI with new game data
});

socket.on("score_event", (data) => {
  console.log("Score event:", data);
  // Update UI with new score event
});

// Join a specific game for updates
socket.emit("join_game", gameId);
```

## Database Schema

The API uses the MySQL database schema you provided with tables for:

- `Team` - Team information
- `Player` - Player details linked to teams
- `Game` - Main game records
- `Football`, `Basketball`, `Cricket` - Sport-specific game data
- `PlayerStat` - Player statistics for each game
- `ScoreEvent` - Individual scoring events

## Error Handling

The API includes comprehensive error handling for:

- Database connection errors
- Validation errors
- MySQL constraint violations
- Rate limiting
- 404 Not Found
- 500 Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Create operations: 10 requests per 15 minutes per IP
- Score events: 30 requests per minute per IP

## Development

For development with auto-restart:

```bash
npm run dev
```

The server will restart automatically when you make changes to the code.

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention (parameterized queries)
- Error message sanitization

## Project Structure

```
d:\bgsc\
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── errorHandler.js      # Error handling middleware
│   └── rateLimiter.js       # Rate limiting configuration
├── models/
│   ├── Team.js              # Team model
│   ├── Player.js            # Player model
│   ├── Game.js              # Game model
│   └── ScoreEvent.js        # Score event model
├── routes/
│   ├── teams.js             # Team routes
│   ├── players.js           # Player routes
│   ├── games.js             # Game routes
│   └── events.js            # Score event routes
├── socket/
│   └── socketHandlers.js    # WebSocket event handlers
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── server.js                # Main server file
└── README.md                # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
