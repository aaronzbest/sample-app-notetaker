class AuthForm extends HTMLElement {
    constructor() {
        super();
        this.isLogin = true;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="auth-container">
                <form class="auth-form">
                    <h2>${this.isLogin ? 'Login' : 'Sign Up'}</h2>

                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>

                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        ${this.isLogin ? 'Login' : 'Sign Up'}
                    </button>

                    <div class="auth-switch">
                        <p>
                            ${this.isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button type="button" class="switch-mode">
                                ${this.isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        `;
    }

    setupEventListeners() {
        const form = this.querySelector('.auth-form');
        const switchBtn = this.querySelector('.switch-mode');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        switchBtn.addEventListener('click', () => this.switchMode());
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const username = formData.get('username').trim();
        const password = formData.get('password');

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            this.setLoading(true);

            if (this.isLogin) {
                const response = await ApiService.login(username, password);
                AuthService.login(response.token, response.user);
                eventBus.emit('auth-success');
            } else {
                await ApiService.register(username, password);
                showMessage('Account created successfully! Please login.');
                this.isLogin = true;
                this.render();
                this.setupEventListeners();
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    switchMode() {
        this.isLogin = !this.isLogin;
        this.render();
        this.setupEventListeners();
        this.clearError();
    }

    setLoading(loading) {
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = loading;
        submitBtn.textContent = loading ? 'Loading...' : (this.isLogin ? 'Login' : 'Sign Up');
    }

    showError(message) {
        this.clearError();
        const form = this.querySelector('.auth-form');
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        form.insertBefore(errorEl, form.firstChild.nextSibling);
    }

    clearError() {
        const errorEl = this.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }
}

customElements.define('auth-form', AuthForm);