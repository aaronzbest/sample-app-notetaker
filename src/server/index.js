const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../src/public')));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.createUser(username, hashedPassword, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Failed to create user' });
            }

            res.status(201).json({ message: 'User created successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.getUser(username, async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token, user: { id: user.id, username: user.username } });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
});

app.get('/api/notes', authenticateToken, (req, res) => {
    db.getNotes(req.user.id, (err, notes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch notes' });
        }
        res.json(notes);
    });
});

app.get('/api/notes/:id', authenticateToken, (req, res) => {
    const noteId = req.params.id;

    db.getNote(noteId, req.user.id, (err, note) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch note' });
        }

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json(note);
    });
});

app.post('/api/notes', authenticateToken, (req, res) => {
    const { title, content } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    db.createNote(req.user.id, title, content || '', function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create note' });
        }

        res.status(201).json({
            id: this.lastID,
            title,
            content: content || '',
            user_id: req.user.id
        });
    });
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
    const noteId = req.params.id;
    const { title, content } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    db.updateNote(noteId, req.user.id, title, content || '', function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update note' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ message: 'Note updated successfully' });
    });
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    const noteId = req.params.id;

    db.deleteNote(noteId, req.user.id, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete note' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ message: 'Note deleted successfully' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/public/index.html'));
});

app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../../src/public/index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});