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
                <button class="btn" onclick="router.navigate('/note/new')">
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

        const backgroundColor = note.color || '#fef3c7';

        return `
            <div class="note-card" data-note-id="${note.id}" style="background-color: ${backgroundColor};">
                <h3>${this.escapeHtml(note.title)}</h3>
                <p>${this.escapeHtml(preview)}</p>
                <div class="note-date">${formatDate(note.updated_at)}</div>
            </div>
        `;
    }

    renderEmptyState() {
        this.innerHTML = `
            <div class="empty-state">
                <h3>No Notes Yet</h3>
                <p>Create your first note to get started!</p>
                <button class="btn" onclick="router.navigate('/note/new')">
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
                const noteId = card.dataset.noteId;
                router.navigate(`/note/${noteId}`);
            });
        });
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