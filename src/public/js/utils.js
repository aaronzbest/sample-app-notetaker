const API_BASE = '/api';

class ApiService {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    static async register(username, password) {
        return this.request('/register', {
            method: 'POST',
            body: { username, password },
        });
    }

    static async login(username, password) {
        return this.request('/login', {
            method: 'POST',
            body: { username, password },
        });
    }

    static async getNotes() {
        return this.request('/notes');
    }

    static async getNote(id) {
        return this.request(`/notes/${id}`);
    }

    static async createNote(title, content, color) {
        return this.request('/notes', {
            method: 'POST',
            body: { title, content, color },
        });
    }

    static async updateNote(id, title, content, color) {
        return this.request(`/notes/${id}`, {
            method: 'PUT',
            body: { title, content, color },
        });
    }

    static async deleteNote(id) {
        return this.request(`/notes/${id}`, {
            method: 'DELETE',
        });
    }
}

class AuthService {
    static isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static login(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

const eventBus = new EventBus();

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return 'a few seconds ago';
    } else if (diffMinutes === 1) {
        return '1 minute ago';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else if (diffHours === 1) {
        return '1 hour ago';
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return '1 day ago';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffWeeks === 1) {
        return '1 week ago';
    } else if (diffWeeks < 4) {
        return `${diffWeeks} weeks ago`;
    } else if (diffMonths === 1) {
        return '1 month ago';
    } else if (diffMonths < 12) {
        return `${diffMonths} months ago`;
    } else if (diffYears === 1) {
        return '1 year ago';
    } else {
        return `${diffYears} years ago`;
    }
}

function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;

    const container = document.getElementById('main-content');
    container.insertBefore(messageEl, container.firstChild);

    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}