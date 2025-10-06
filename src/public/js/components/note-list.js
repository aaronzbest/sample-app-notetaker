class NoteList extends HTMLElement {
    constructor() {
        super();
        this.notes = [];
    }

    connectedCallback() {
        this.loadNotes();
        eventBus.on('note-created', () => this.loadNotes());
        eventBus.on('note-updated', () => this.loadNotes());
    }

    async loadNotes() {
        try {
            this.notes = await ApiService.getNotes();
            this.render();
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.renderError('Failed to load notes');
        }
    }

    render() {
        if (this.notes.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.innerHTML = `
            <div class="notes-header">
                <h2>Your Notes</h2>
                <button class="btn" onclick="eventBus.emit('show-editor', null)">
                    New Note
                </button>
            </div>

            <div class="notes-grid">
                ${this.notes.map(note => this.renderNoteCard(note)).join('')}
            </div>
        `;

        this.setupEventListeners();
    }

    renderNoteCard(note) {
        const preview = note.content
            ? note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '')
            : 'No content';

        return `
            <div class="note-card" data-note-id="${note.id}">
                <h3>${this.escapeHtml(note.title)}</h3>
                <p>${this.escapeHtml(preview)}</p>
                <div class="note-date">${formatDate(note.updated_at)}</div>
                <div class="note-actions">
                    <button class="btn btn-secondary edit-note" data-note-id="${note.id}">
                        Edit
                    </button>
                    <button class="btn btn-danger delete-note" data-note-id="${note.id}">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        this.innerHTML = `
            <div class="empty-state">
                <h3>No Notes Yet</h3>
                <p>Create your first note to get started!</p>
                <button class="btn" onclick="eventBus.emit('show-editor', null)">
                    Create Note
                </button>
            </div>
        `;
    }

    renderError(message) {
        this.innerHTML = `
            <div class="error-message">
                ${message}
            </div>
        `;
    }

    setupEventListeners() {
        this.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn')) {
                    return;
                }
                const noteId = card.dataset.noteId;
                eventBus.emit('show-editor', noteId);
            });
        });

        this.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.noteId;
                eventBus.emit('show-editor', noteId);
            });
        });

        this.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.noteId;
                this.deleteNote(noteId);
            });
        });
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await ApiService.deleteNote(noteId);
            showMessage('Note deleted successfully');
            this.loadNotes();
        } catch (error) {
            console.error('Failed to delete note:', error);
            showMessage('Failed to delete note', 'error');
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

customElements.define('note-list', NoteList);