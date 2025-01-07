import { Module, system } from '../core/system.js';

class AuthModule extends Module {
    #isAuthenticated = false;  // 使用私有欄位
    #currentUser = null;
    #token = null;

    constructor() {
        super();
        this._initialized = false;
        this.tokenRefreshTimer = null;
        this.ui = {
            loginWrapper: null,
            mainSystem: null
        };
        this.dependencies = ['storage'];
        this.checkAuth();
    }

    get isAuthenticated() {
        return this.#isAuthenticated;
    }

    get currentUser() {
        return this.#currentUser;
    }

    async init() {
        if (this._initialized) return true;
        await this.checkAuthStatus();
        this._initialized = true;
        return true;
    }

    bindEvents() {
        document.getElementById('loginForm')?.addEventListener('submit', this.handleLogin.bind(this));
    }

    async restoreSession() {
        const storage = this.getModule('storage');
        const savedToken = await storage.getItem('auth_token');
        if (savedToken) {
            try {
                const user = await this._validateToken(savedToken);
                this.#isAuthenticated = true;
                this.#currentUser = user;
                this.#token = savedToken;
                return true;
            } catch (error) {
                await this.clearSession();
            }
        }
        return false;
    }

    async moduleSetup() {
        if (window.location.pathname.includes('login.html')) {
            this.bindLoginEvents();
        } else {
            this.checkAuth();
        }
    }

    updateUIState(isAuthenticated) {
        if (this.ui.loginWrapper && this.ui.mainSystem) {
            this.ui.loginWrapper.classList.toggle('hidden', isAuthenticated);
            this.ui.mainSystem.classList.toggle('hidden-system', !isAuthenticated);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const success = await this.authenticate(username, password);
            if (success) {
                document.getElementById('mainSystem')?.classList.remove('hidden-system');
                document.getElementById('loginForm').closest('.login-wrapper')?.classList.add('hidden');
                this.emit('login-success', { username });
            }
        } catch (error) {
            console.error('登入失敗:', error);
            this.emit('login-error', error);
        }
    }

    async login(credentials) {
        try {
            const { token, user } = await this._authenticate(credentials);
            this.#isAuthenticated = true;
            this.#currentUser = user;
            this.#token = token;
            this.emit('auth:login', { user });
            return true;
        } catch (error) {
            console.error('登入失敗:', error);
            throw error;
        }
    }

    async logout() {
        this.#isAuthenticated = false;
        this.#currentUser = null;
        this.#token = null;
        await this.clearSession();
        this.emit('auth:logout');
    }

    getUserRole() {
        return this.user?.role || 'guest';
    }

    async validatePermission(requiredRole) {
        const userRole = this.getUserRole();
        const roles = {
            admin: 3,
            manager: 2,
            staff: 1,
            guest: 0
        };
        return roles[userRole] >= roles[requiredRole];
    }

    async authenticate(username, password) {
        // 實作驗證邏輯
        return username === 'admin' && password === 'password';
    }

    async validateCredentials(username, password) {
        return new Promise((resolve) => {
            if (username === 'uno' && password === 'uno') {
                resolve({
                    success: true,
                    user: {
                        username: 'uno',
                        role: 'admin',
                        name: '管理員'
                    },
                    token: 'test-token'
                });
            } else {
                resolve({ 
                    success: false, 
                    message: '使用者名稱或密碼錯誤' 
                });
            }
        });
    }

    async setSession(user, token) {
        this.user = user;
        this.token = token;
        
        const storage = this.getModule('storage');
        await storage.setItem('session', {
            user,
            token,
            expiry: Date.now() + (24 * 60 * 60 * 1000) // 24小時
        });
    }

    async clearSession() {
        const storage = this.getModule('storage');
        await storage.removeItem('auth_token');
        clearInterval(this.tokenRefreshTimer);
    }

    setupTokenRefresh() {
        if (this.tokenRefreshTimer) {
            clearInterval(this.tokenRefreshTimer);
        }

        this.tokenRefreshTimer = setInterval(async () => {
            if (this.isAuthenticated()) {
                await this.refreshToken();
            }
        }, 20 * 60 * 1000); // 每20分鐘
    }

    async refreshToken() {
        if (!this.token) return;

        try {
            const newToken = this.generateToken();
            await this.setSession(this.user, newToken);
        } catch (error) {
            console.error('Token 更新失敗:', error);
            await this.logout();
        }
    }

    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    hashPassword(password) {
        // 實際應用中應使用更安全的雜湊方法
        return password;
    }

    setupEventListeners() {
        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                await this.login(username, password);
            } catch (error) {
                this.showError(error.message);
            }
        });
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 3000);
        } else {
            console.warn('找不到錯誤訊息元素');
        }
    }

    showMainSystem() {
        this.loginScreen.classList.add('hidden');
        this.mainSystem.classList.remove('hidden');
    }

    async checkAuthStatus() {
        // 檢查是否已經登入
        const storedAuth = window.HimanSystem.core.getModule('storage').getItem('auth');
        if (storedAuth && storedAuth.isAuthenticated) {
            this.isAuthenticated = true;
            this.showMainSystem();
        }
    }

    async setCurrentUser(userData) {
        try {
            const storage = this.getModule('storage');
            this.currentUser = userData;
            
            if (userData) {
                await storage.setItem('currentUser', userData);
                this.emit('auth:userChanged', userData);
            } else {
                await storage.removeItem('currentUser');
                this.emit('auth:userChanged', null);
            }
            
            return true;
        } catch (error) {
            console.error('設置使用者資料失敗:', error);
            throw error;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async validateLogin(username, password) {
        try {
            // 使用現有的 validateCredentials 方法
            const result = await this.validateCredentials(username, password);
            
            if (result.success) {
                // 設置認證狀態
                this.#isAuthenticated = true;
                this.#currentUser = result.user;
                this.#token = result.token;
                
                // 使用 localStorage 作為臨時解決方案
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                
                // 設置 token 更新計時器
                this.setupTokenRefresh();
                
                this.emit('auth:login', { user: result.user });
                return true;
            } else {
                this.showError(result.message);
                return false;
            }
        } catch (error) {
            console.error('登入驗證失敗:', error);
            this.showError('登入過程發生錯誤，請稍後再試');
            return false;
        }
    }

    bindLoginEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    if (await this.validateLogin(username, password)) {
                        window.location.href = '/index.html';
                    }
                } catch (error) {
                    console.error('登入處理失敗:', error);
                    this.showError('登入失敗，請稍後再試');
                }
            });
        }
    }

    checkAuth() {
        // 也使用 localStorage
        const token = localStorage.getItem('auth_token');
        if (!token && !window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
    }
}

// 修改模組導出方式
export const authModule = new AuthModule();
export default authModule;

// 移除重複的事件監聽器綁定
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const auth = new AuthModule();
        auth.bindLoginEvents();
    });
}