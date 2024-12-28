// auth.js - 登入系統的靈魂
class AuthSystem {
    constructor() {
        this.users = {
            admin: {
            username: 'uno917',
            password: 'uno1069', // updated password
            role: 'admin'
            },
            staff: {
            username: 'himan', 
            password: 'himan', // updated password
            role: 'staff'
            }
        };

        this.currentUser = null;
        this.initializeSystem();
    }

    initializeSystem() {
        // 綁定登入表單事件
        const loginForm = document.getElementById('loginForm');
        if (loginForm !== null) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 綁定登出按鈕事件
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton !== null) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // 檢查現有登入狀態
        this.checkLoginStatus();
    }

    toggleLoginDisplay(showLogin) {
        const loginContainer = document.getElementById('loginContainer');
        const mainSystem = document.getElementById('mainSystem');
        if (loginContainer && mainSystem) {
            loginContainer.style.display = showLogin ? 'block' : 'none';
            mainSystem.style.display = showLogin ? 'none' : 'block';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        try {
            const usernameElement = document.getElementById('username');
            const passwordElement = document.getElementById('password');
            if (!passwordElement) {
                throw new Error('Password element not found');
            }
            if (!usernameElement || !passwordElement) {
                this.showLoginError('帳號或密碼欄位未找到');
                return;
            }
            const username = usernameElement.value;
            const password = passwordElement.value;

            // 顯示載入動畫
            this.toggleLoading(true);

            // 驗證身份
            const loginResult = await this.validateCredentials(username, password);
            
            if (loginResult.success) {
                // 儲存登入狀態
                this.setUserSession(loginResult.user);
                
                // 顯示成功訊息
                this.showToast('登入成功', 'success');
                
                // 切換顯示登入區塊
                this.toggleLoginDisplay(false);
                this.redirectBasedOnRole(loginResult.user.role);
            } else {
                this.showLoginError('登入失敗');
            }
        } catch (error) {
            this.showLoginError(error.message);
        } finally {
            this.toggleLoading(false);
        }
    }

    async validateCredentials(username, password) {
        // 在實際應用中，這裡應該用 API 呼叫來驗證
        const bcrypt = await import('https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js');
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = Object.values(this.users).find(u => u.username === username);
                if (user) {
                    bcrypt.compare(password, user.password, (err, result) => {
                        if (err) {
                            resolve({
                                success: false,
                                user: null
                            });
                            return;
                        }
                        resolve({
                            success: result,
                            user: result ? {...user, password: undefined} : null
                        });
                    });
                } else {
                    resolve({
                        success: false,
                        user: null
                    });
                }
            }, 500); // 模擬網路延遲
        });
    }

    setUserSession(user) {
        this.currentUser = user;
        localStorage.setItem('userSession', JSON.stringify({
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        }));
    }

    checkLoginStatus() {
        const session = localStorage.getItem('userSession');
        if (session) {
            try {
                const user = JSON.parse(session);
                this.currentUser = user;
                this.updateUIWithUserInfo(user);
                this.toggleLoginDisplay(false);
                this.updateRoleBasedUI(user.role);
                return true;
            } catch (error) {
                console.error('Session parsing failed:', error);
                this.handleLogout();
            }
        }
        this.toggleLoginDisplay(true);
        return false;
    }

    updateRoleBasedUI(role) {
        const adminElements = document.querySelectorAll('.admin-only');
        const staffElements = document.querySelectorAll('.staff-only');

        adminElements.forEach(el => {
            el.style.display = role === 'admin' ? 'block' : 'none';
        });

        staffElements.forEach(el => {
            el.style.display = role === 'staff' ? 'block' : 'none';
        });
    }

    async handleLogout() {
        try {
            localStorage.removeItem('userSession');
            this.currentUser = null;
            this.toggleLoginDisplay(true);
            document.getElementById('loginForm')?.reset();
            this.updateRoleBasedUI('');
            this.showToast('已成功登出', 'success');
        } catch (error) {
            this.showToast('登出時發生錯誤', 'error');
            console.error('Logout error:', error);
        }
    }

    updateUIWithUserInfo(user) {
        const userDisplay = document.getElementById('currentUser');
        if (userDisplay) {
            userDisplay.textContent = `${user.username} (${user.role === 'admin' ? '管理員' : '職員'})`;
        }
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // 3秒後自動隱藏錯誤訊息
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    toggleLoading(show) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
}

// 初始化認證系統
window.authSystem = new AuthSystem();