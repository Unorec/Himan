import { showToast, showLoading } from '../js/ui.js';
import { lockerManager } from './lockers.js';

// 認證相關設定
const authConfig = {
    defaultCredentials: {
        username: 'himan',
        password: 'himan'
    }
};

// 初始化認證功能
const initializeAuth = () => {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');

    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // 檢查是否已登入
    checkAuthStatus();
};

// 處理登入
const handleLogin = async () => {
    try {
        showLoading(true);
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            throw new Error('請輸入帳號和密碼');
        }

        // 驗證帳密
        if (username === authConfig.defaultCredentials.username && 
            password === authConfig.defaultCredentials.password) {
            
            // 設定登入狀態
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', username);

            // 更新界面
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('mainSystem').style.display = 'block';
            document.getElementById('currentUser').textContent = username;

            // 載入預設畫面
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                const defaultSection = 'entry';
                const sectionModule = await import(`../js/${defaultSection}.js`);
                if (sectionModule.default && sectionModule.default.loadSection) {
                    await sectionModule.default.loadSection();
                }
            }

            showToast('登入成功');
        } else {
            throw new Error('帳號或密碼錯誤');
        }

    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || '登入失敗', 'error');
    } finally {
        showLoading(false);
    }
};

// 處理登出
const handleLogout = () => {
    try {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        
        document.getElementById('mainSystem').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        showToast('已登出系統');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('登出失敗', 'error');
    }
};

// 檢查認證狀態
const checkAuthStatus = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const currentUser = localStorage.getItem('currentUser');

    if (isAuthenticated && currentUser) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        document.getElementById('currentUser').textContent = currentUser;
    } else {
        document.getElementById('mainSystem').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
    }
};

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    validateLockerAccess(lockerId) {
        if (!this.isAuthenticated) {
            return false;
        }
        return lockerManager.checkLocker(lockerId);
    }
}

export const authService = new AuthService();

// 初始化
document.addEventListener('DOMContentLoaded', initializeAuth);

export default {
    initializeAuth,
    handleLogin,
    handleLogout,
    checkAuthStatus
};