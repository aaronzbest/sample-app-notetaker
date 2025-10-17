const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DatabaseMigrations = require('./migrations');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'notes.sqlite');
        this.connectionPool = [];
        this.maxConnections = 10;
        this.currentConnections = 0;

        // Initialize main database connection
        this.db = this.createConnection();
        this.initializeDatabase();
    }

    createConnection() {
        return new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            }
        });
    }

    async getConnection() {
        return new Promise((resolve, reject) => {
            if (this.connectionPool.length > 0) {
                resolve(this.connectionPool.pop());
            } else if (this.currentConnections < this.maxConnections) {
                const conn = this.createConnection();
                this.currentConnections++;
                resolve(conn);
            } else {
                // Wait for a connection to be returned
                setTimeout(() => {
                    this.getConnection().then(resolve).catch(reject);
                }, 50);
            }
        });
    }

    releaseConnection(conn) {
        if (this.connectionPool.length < this.maxConnections / 2) {
            this.connectionPool.push(conn);
        } else {
            conn.close();
            this.currentConnections--;
        }
    }

    async initializeDatabase() {
        console.log('Connected to SQLite database');
        await this.initializeTables();
        await this.runMigrations();
    }

    async initializeTables() {
        return new Promise((resolve) => {
            this.db.serialize(() => {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS notes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        content TEXT,
                        color TEXT DEFAULT '#fef3c7',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                `);

                // Add color column to existing notes table if it doesn't exist
                this.db.run(`
                    ALTER TABLE notes ADD COLUMN color TEXT DEFAULT '#fef3c7'
                `, (err) => {
                    // Ignore error if column already exists
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding color column:', err);
                    }
                    resolve();
                });
            });
        });
    }

    async runMigrations() {
        const migrations = new DatabaseMigrations(this.db);
        try {
            await migrations.runAllMigrations();
            console.log('All database migrations completed');
        } catch (error) {
            console.error('Migration failed:', error);
        }
    }

    getUser(username, callback) {
        const startTime = Date.now();
        // Optimized: only select needed columns, use index on username
        this.db.get('SELECT id, username, password FROM users WHERE username = ? LIMIT 1', [username], (err, result) => {
            this.logSlowQuery('getUser', [username], Date.now() - startTime);
            callback(err, result);
        });
    }

    createUser(username, hashedPassword, callback) {
        this.db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], callback);
    }

    getNotes(userId, callback) {
        const startTime = Date.now();
        // Optimized: uses composite index idx_notes_user_updated, limits initial load
        this.db.all(
            'SELECT id, title, content, color, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100',
            [userId],
            (err, result) => {
                this.logSlowQuery('getNotes', [userId], Date.now() - startTime);
                callback(err, result);
            }
        );
    }

    getNote(id, userId, callback) {
        const startTime = Date.now();
        // Optimized: uses composite index idx_notes_id_user
        this.db.get(
            'SELECT id, title, content, color, created_at, updated_at FROM notes WHERE id = ? AND user_id = ? LIMIT 1',
            [id, userId],
            (err, result) => {
                this.logSlowQuery('getNote', [id, userId], Date.now() - startTime);
                callback(err, result);
            }
        );
    }

    createNote(userId, title, content, color, callback) {
        const startTime = Date.now();
        this.db.run(
            'INSERT INTO notes (user_id, title, content, color) VALUES (?, ?, ?, ?)',
            [userId, title, content, color || '#fef3c7'],
            function(err) {
                const duration = Date.now() - startTime;
                if (duration > 50) {
                    console.warn(`Slow insert (${duration}ms): createNote`);
                }
                callback.call(this, err);
            }
        );
    }

    updateNote(id, userId, title, content, color, callback) {
        const startTime = Date.now();
        this.db.run(
            'UPDATE notes SET title = ?, content = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [title, content, color || '#fef3c7', id, userId],
            function(err) {
                const duration = Date.now() - startTime;
                if (duration > 50) {
                    console.warn(`Slow update (${duration}ms): updateNote`);
                }
                callback.call(this, err);
            }
        );
    }

    deleteNote(id, userId, callback) {
        const startTime = Date.now();
        this.db.run(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [id, userId],
            function(err) {
                const duration = Date.now() - startTime;
                if (duration > 50) {
                    console.warn(`Slow delete (${duration}ms): deleteNote`);
                }
                callback.call(this, err);
            }
        );
    }

    close() {
        // Close all pooled connections
        this.connectionPool.forEach(conn => conn.close());
        this.connectionPool = [];

        // Close main connection
        this.db.close();

        console.log('Database connections closed');
    }

    // Performance monitoring helper
    logSlowQuery(query, params, duration) {
        if (duration > 100) { // Log queries taking more than 100ms
            console.warn(`Slow query (${duration}ms):`, query, params);
        }
    }
}

module.exports = new Database();