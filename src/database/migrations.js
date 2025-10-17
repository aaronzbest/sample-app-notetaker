const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseMigrations {
    constructor(db) {
        this.db = db;
    }

    async initializeMigrationsTable() {
        return new Promise((resolve, reject) => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async runMigration(name, migrationFunction) {
        return new Promise((resolve, reject) => {
            // Check if migration already ran
            this.db.get(
                'SELECT * FROM migrations WHERE name = ?',
                [name],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }

                    if (row) {
                        console.log(`Migration '${name}' already executed`);
                        return resolve();
                    }

                    // Run the migration
                    console.log(`Running migration: ${name}`);
                    this.db.serialize(() => {
                        this.db.run('BEGIN TRANSACTION');

                        try {
                            migrationFunction(this.db);

                            // Record migration as completed
                            this.db.run(
                                'INSERT INTO migrations (name) VALUES (?)',
                                [name],
                                (err) => {
                                    if (err) {
                                        this.db.run('ROLLBACK');
                                        return reject(err);
                                    }

                                    this.db.run('COMMIT', (err) => {
                                        if (err) {
                                            this.db.run('ROLLBACK');
                                            return reject(err);
                                        }
                                        console.log(`Migration '${name}' completed successfully`);
                                        resolve();
                                    });
                                }
                            );
                        } catch (error) {
                            this.db.run('ROLLBACK');
                            reject(error);
                        }
                    });
                }
            );
        });
    }

    async runAllMigrations() {
        // Initialize migrations table first
        await this.initializeMigrationsTable();

        const migrations = [
            {
                name: '001_add_performance_indexes',
                migration: (db) => {
                    // Index for note lookups by user (most common query)
                    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)`);

                    // Index for note ordering by updated_at
                    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)`);

                    // Composite index for user notes ordered by update time (covers getNotes query completely)
                    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC)`);

                    // Index for individual note lookups
                    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_id_user ON notes(id, user_id)`);

                    // Index for username lookups (login performance)
                    db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

                    console.log('Performance indexes created successfully');
                }
            },
            {
                name: '002_analyze_tables',
                migration: (db) => {
                    // Update SQLite statistics for query optimizer
                    db.run(`ANALYZE`);
                    console.log('Database statistics updated');
                }
            }
        ];

        for (const { name, migration } of migrations) {
            await this.runMigration(name, migration);
        }
    }
}

module.exports = DatabaseMigrations;