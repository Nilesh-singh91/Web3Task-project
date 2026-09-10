// database.js
// SQLite database setup for the YouTube Watch Party backend.
// We use SQLite to persist room information and log major events.

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create or open the SQLite database file in the backend directory
const dbPath = path.resolve(__dirname, "../watchparty.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Table to store rooms and their current video
    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        roomId TEXT PRIMARY KEY,
        videoId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table to log watch party actions (play, pause, seek, role changes)
    db.run(`
      CREATE TABLE IF NOT EXISTS room_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomId TEXT NOT NULL,
        eventType TEXT NOT NULL,
        details TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

// Save or update room in SQLite
function saveRoom(roomId, videoId) {
  const query = `
    INSERT INTO rooms (roomId, videoId)
    VALUES (?, ?)
    ON CONFLICT(roomId) DO UPDATE SET videoId = excluded.videoId
  `;
  db.run(query, [roomId, videoId], function (err) {
    if (err) {
      console.error("Error saving room to database:", err.message);
    }
  });
}

// Fetch room details from SQLite
function getRoomFromDb(roomId, callback) {
  db.get("SELECT * FROM rooms WHERE roomId = ?", [roomId], (err, row) => {
    if (err) {
      console.error("Error getting room from database:", err.message);
      return callback(err, null);
    }
    callback(null, row);
  });
}

// Log an event for history/auditing
function logRoomEvent(roomId, eventType, details = "") {
  const query = `
    INSERT INTO room_events (roomId, eventType, details)
    VALUES (?, ?, ?)
  `;
  db.run(query, [roomId, eventType, JSON.stringify(details)], function (err) {
    if (err) {
      console.error("Error logging room event:", err.message);
    }
  });
}

module.exports = {
  db,
  initDatabase,
  saveRoom,
  getRoomFromDb,
  logRoomEvent,
};
