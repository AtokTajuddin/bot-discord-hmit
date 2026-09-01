const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/scores.db'));

//Ini bukan vibecoding -_-
db.pragma('journal_mode = WAL') // Write ahead logging
db.pragma('synchronous = NORMAL') //For speed & safety balance in DB 
db.pragma('busy_timeout = 5000') // Timeout for DB operations 5s
db.pragma('cache_size = -32000') // 32MB cache size for instant querying

db.prepare(`
    CREATE TABLE IF NOT EXISTS levels(
    id      TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    guild_id     TEXT NOT NULL,
    xp      INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    messages INTEGER DEFAULT 0,
    last_message_at INTEGER DEFAULT 0    
    )
`).run();
// messages use INTEGER type to count/save how the user actively make a chat.
// last_message_at is a unix timestamp, to know when the user actively chat last time.
db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_guild_xp
    ON levels (guild_id,xp DESC)
    `).run();

const statements = {
    getUser: db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?'),// Parameterized query to prevent SQL Injection

    setUser: db.prepare(`
    INSERT INTO levels (id, user_id, guild_id, xp, level, messages, last_message_at)
    VALUES (@id, @user_id, @guild_id, @xp, @level, @messages, @last_message_at)
    ON CONFLICT(id) DO UPDATE SET
    xp          = excluded.xp,
    level       = excluded.level,
    messages    = excluded.messages,
    last_message_at = excluded.last_message_at
        `), // Upsert method

    upsertXP: db.prepare(`
        INSERT INTO levels (id, user_id, guild_id, xp, level, messages, last_message_at)
        VALUES (@id, @user_id, @guild_id, @xp, @level, 1, @last_message_at)
        ON CONFLICT(id) DO UPDATE SET
        xp = levels.xp + excluded.xp,
        level = excluded.level,
        messages = levels.messages + 1,
        last_message_at = excluded.last_message_at
        `),

    getLeaderboard: db.prepare(`
        SELECT * FROM levels
        WHERE guild_id=? 
        ORDER BY xp DESC
        LIMIT ?`), // Show 10 Leaderboard
    getUserRank: db.prepare(`
        SELECT COUNT(*) AS rank
        FROM levels
        WHERE guild_id = ?
        AND xp > (
            SELECT xp
            FROM levels
            WHERE user_id = ? AND guild_id = ?
        )
    `),
};
module.exports = { db, ...statements };
