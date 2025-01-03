class AuthManager extends window.HimanSystem.Module {
    constructor() {
        super();
        this.isAuthenticated = false;
        this.currentUser = null;
    }

    async moduleSetup() {
        await this.initialize();
    }

    async initialize() {
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        }
    }

    login(username, password) {
        if (username === 'admin' && password === 'password') {
            this.isAuthenticated = true;
            this.currentUser = { username };
            localStorage.setItem('authToken', 'dummy-token');
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

window.HimanSystem.core.registerModule('auth', new AuthManager());