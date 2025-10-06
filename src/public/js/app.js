class App {
    constructor() {
        this.currentView = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        eventBus.on('auth-success', () => {
            this.showNotes();
            this.updateNavigation();
        });

        eventBus.on('show-notes', () => this.showNotes());
        eventBus.on('show-editor', (noteId) => this.showEditor(noteId));

        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => this.logout());
    }

    checkAuthState() {
        if (AuthService.isLoggedIn()) {
            this.showNotes();
            this.updateNavigation();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        this.clearMainContent();
        this.currentView = 'auth';

        const authForm = document.createElement('auth-form');
        document.getElementById('main-content').appendChild(authForm);

        this.updateNavigation();
    }

    showNotes() {
        this.clearMainContent();
        this.currentView = 'notes';

        const noteList = document.createElement('note-list');
        document.getElementById('main-content').appendChild(noteList);
    }

    showEditor(noteId) {
        this.clearMainContent();
        this.currentView = 'editor';

        const noteEditor = document.createElement('note-editor');
        if (noteId) {
            noteEditor.setAttribute('note-id', noteId);
        }
        document.getElementById('main-content').appendChild(noteEditor);
    }

    clearMainContent() {
        const mainContent = document.getElementById('main-content');
        while (mainContent.firstChild) {
            mainContent.removeChild(mainContent.firstChild);
        }
    }

    updateNavigation() {
        const logoutBtn = document.getElementById('logout-btn');
        const isLoggedIn = AuthService.isLoggedIn();

        logoutBtn.style.display = isLoggedIn ? 'block' : 'none';

        if (isLoggedIn) {
            const user = AuthService.getUser();
            if (user) {
                logoutBtn.textContent = `Logout (${user.username})`;
            }
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            AuthService.logout();
            this.showAuth();
            showMessage('Logged out successfully');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});