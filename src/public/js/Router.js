class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    init() {
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname, false);
        });

        this.setupRoutes();

        // Use setTimeout to ensure all components are ready
        setTimeout(() => {
            this.handleRoute(window.location.pathname, false);
        }, 0);
    }

    setupRoutes() {
        this.routes.set('/', () => {
            eventBus.emit('show-notes');
        });

        this.routes.set('/login', () => {
            if (AuthService.isLoggedIn()) {
                this.navigate('/');
                return;
            }
            eventBus.emit('show-auth');
        });

        this.routes.set(/^\/note\/new$/, () => {
            if (!AuthService.isLoggedIn()) {
                this.navigate('/login');
                return;
            }
            eventBus.emit('show-editor', null);
        });

        this.routes.set(/^\/note\/(\d+)$/, (match) => {
            if (!AuthService.isLoggedIn()) {
                this.navigate('/login');
                return;
            }
            const noteId = match[1];
            eventBus.emit('show-editor', noteId);
        });
    }

    handleRoute(path, updateHistory = true) {
        this.currentRoute = path;
        console.log('Router handling path:', path, 'Auth status:', AuthService.isLoggedIn());

        for (const [route, handler] of this.routes) {
            if (typeof route === 'string') {
                if (path === route) {
                    console.log('Matched string route:', route);
                    handler();
                    return;
                }
            } else if (route instanceof RegExp) {
                const match = path.match(route);
                if (match) {
                    console.log('Matched regex route:', route, 'with match:', match);
                    handler(match);
                    return;
                }
            }
        }

        console.log('No route matched, redirecting based on auth status');
        if (AuthService.isLoggedIn()) {
            this.navigate('/', updateHistory);
        } else {
            this.navigate('/login', updateHistory);
        }
    }

    navigate(path, updateHistory = true) {
        if (updateHistory && path !== this.currentRoute) {
            window.history.pushState(null, '', path);
        }
        this.handleRoute(path, false);
    }

    replace(path) {
        window.history.replaceState(null, '', path);
        this.handleRoute(path, false);
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getNoteIdFromRoute() {
        const match = this.currentRoute?.match(/^\/note\/(\d+)$/);
        return match ? match[1] : null;
    }
}

let router;