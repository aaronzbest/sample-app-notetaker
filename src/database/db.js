const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'notes.sqlite'), (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
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
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);
        });
    }

    getUser(username, callback) {
        this.db.get('SELECT * FROM users WHERE username = ?', [username], callback);
    }

    createUser(username, hashedPassword, callback) {
        this.db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], callback);
    }

    getNotes(userId, callback) {
        this.db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId], callback);
    }

    getNote(id, userId, callback) {
        this.db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId], callback);
    }

    createNote(userId, title, content, callback) {
        this.db.run('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)', [userId, title, content], callback);
    }

    updateNote(id, userId, title, content, callback) {
        this.db.run(
            'UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [title, content, id, userId],
            callback
        );
    }

    deleteNote(id, userId, callback) {
        this.db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId], callback);
    }

    close() {
        this.db.close();
    }
}

module.exports = new Database();