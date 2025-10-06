class NoteEditor extends HTMLElement {
    constructor() {
        super();
        this.noteId = null;
        this.note = null;
    }

    connectedCallback() {
        const noteId = this.getAttribute('note-id');
        if (noteId && noteId !== 'null') {
            this.noteId = noteId;
            this.loadNote();
        } else {
            this.render();
        }
    }

    async loadNote() {
        try {
            this.note = await ApiService.getNote(this.noteId);
            this.render();
        } catch (error) {
            console.error('Failed to load note:', error);
            showMessage('Failed to load note', 'error');
            eventBus.emit('show-notes');
        }
    }

    render() {
        const isEditing = this.noteId !== null;
        const title = this.note ? this.note.title : '';
        const content = this.note ? this.note.content : '';

        this.innerHTML = `
            <div class="editor-container">
                <div class="editor-header">
                    <h2>${isEditing ? 'Edit Note' : 'New Note'}</h2>
                    <div class="editor-actions">
                        <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
                        <button class="btn" id="save-btn">Save</button>
                    </div>
                </div>

                <form id="note-form">
                    <div class="form-group">
                        <label for="note-title">Title:</label>
                        <input
                            type="text"
                            id="note-title"
                            name="title"
                            value="${this.escapeHtml(title)}"
                            required
                            placeholder="Enter note title..."
                        >
                    </div>

                    <div class="form-group">
                        <label for="note-content">Content:</label>
                        <textarea
                            id="note-content"
                            name="content"
                            placeholder="Start writing your note..."
                        >${this.escapeHtml(content)}</textarea>
                    </div>
                </form>
            </div>
        `;

        this.setupEventListeners();
        this.focusTitleInput();
    }

    setupEventListeners() {
        const form = this.querySelector('#note-form');
        const saveBtn = this.querySelector('#save-btn');
        const cancelBtn = this.querySelector('#cancel-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        saveBtn.addEventListener('click', () => this.handleSave());
        cancelBtn.addEventListener('click', () => this.handleCancel());

        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleKeydown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                this.handleSave();
            } else if (e.key === 'Escape') {
                this.handleCancel();
            }
        }
    }

    async handleSave() {
        const formData = new FormData(this.querySelector('#note-form'));
        const title = formData.get('title').trim();
        const content = formData.get('content').trim();

        if (!title) {
            showMessage('Please enter a title for your note', 'error');
            return;
        }

        try {
            this.setLoading(true);

            if (this.noteId) {
                await ApiService.updateNote(this.noteId, title, content);
                showMessage('Note updated successfully');
                eventBus.emit('note-updated');
            } else {
                await ApiService.createNote(title, content);
                showMessage('Note created successfully');
                eventBus.emit('note-created');
            }

            eventBus.emit('show-notes');
        } catch (error) {
            console.error('Failed to save note:', error);
            showMessage('Failed to save note', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    handleCancel() {
        const form = this.querySelector('#note-form');
        const formData = new FormData(form);
        const title = formData.get('title').trim();
        const content = formData.get('content').trim();

        const originalTitle = this.note ? this.note.title : '';
        const originalContent = this.note ? this.note.content : '';

        const hasChanges = title !== originalTitle || content !== originalContent;

        if (hasChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
        }

        eventBus.emit('show-notes');
    }

    setLoading(loading) {
        const saveBtn = this.querySelector('#save-btn');
        saveBtn.disabled = loading;
        saveBtn.textContent = loading ? 'Saving...' : 'Save';
    }

    focusTitleInput() {
        const titleInput = this.querySelector('#note-title');
        if (titleInput && !this.note) {
            titleInput.focus();
        }
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

customElements.define('note-editor', NoteEditor);