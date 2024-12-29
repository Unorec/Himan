(function() {
    'use strict';
    
    // 確保全域命名空間存在
    window.HimanSystem = window.HimanSystem || {
        modules: {},
        ModuleManager: {
            register: function(name, module) {
                this.modules[name] = module;
                return module;
            },

            /**
             * Hash the password using a simple hash function (for demonstration purposes).
             * In a real-world application, use a strong hashing algorithm like bcrypt.
             * @param {string} password - The plain text password
             * @returns {string} - The hashed password
             */
            hashPassword(password) {
                // Simple hash function for demonstration (use bcrypt in production)
                let hash = 0;
                for (let i = 0; i < password.length; i++) {
                    const char = password.charCodeAt(i);
                    hash = (hash << 5) - hash + char;
                    hash |= 0; // Convert to 32bit integer
                }
                return hash.toString();
            }
        }
    };

    // 新增：Toast 通知系統
    const Toast = {
        show(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            // 動畫效果
            setTimeout(() => {
                toast.classList.add('show');
            }, 100);
            
            // 自動關閉
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }
    };

    // 註冊全域 showToast 函數
    window.showToast = Toast.show;

    class AuthenticationSystem {
        constructor() {
            try {
                if (window.authSystem) {
                    return window.authSystem;
                }
                this.initializeSystem();
                window.authSystem = this;
            } catch (error) {
                this.handleSystemError(error);
            }
        }

        initializeSystem() {
            // 安全憑證定義：如同精密的存取控制機制
            this.credentials = {
                admin: {
                    username: 'uno',
                    password: 'uno',
                    role: 'superAdmin',
                    privileges: ['systemSettings', 'userManagement', 'securityConfig']
                },
                staff: new Map([
                    ['himan', { password: 'himan', role: 'staff', shift: 'morning' }]
                ])
            };
            // 安全上下文：如同警戒系統的敏感神經
            this.securityContext = {
                maxAttempts: 3
            };

            this.initializeSecurityElements();
        }

        handleSystemError(error) {
            console.error('認證系統錯誤', {
                message: error.message || '未知錯誤',
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            if (typeof error === 'object') {
                window.dispatchEvent(new CustomEvent('authError', {
                    detail: { error }
                }));
            }
        }

        /**
         * 初始化安全元素：建構多層次安全網絡
         */
        initializeSecurityElements() {
            try {
                this.elements = {
                    loginForm: document.querySelector('#loginForm'),
                    usernameInput: document.querySelector('#username'),
                    passwordInput: document.querySelector('#password'),
                    loginButton: document.querySelector('#loginButton'),
                    errorDisplay: document.querySelector('#loginError')
                };

                // 檢查必要元素是否存在
                if (!this.elements.loginForm) {
                    throw new Error('找不到登入表單元素');
                }

                this.attachEventListeners();
            } catch (error) {
                this.handleSystemError(error);
            }
        }

        /**
         * 動態事件監聽：即時感知安全脈動
         */
        attachEventListeners() {
            this.elements.loginForm.addEventListener('submit', this.handleAuthentication.bind(this));
        }

        /**
         * 身份認證的藝術：安全與優雅的絕妙平衡
         */
        /**
         * Handles the authentication process when a user submits login credentials
         * @param {Event} event - The form submission event
         * @throws {Error} If authentication fails
         * @returns {void}
         */
        handleAuthentication(event) {
            event.preventDefault();

            const username = this.elements.usernameInput.value.trim();
            const password = this.elements.passwordInput.value.trim();

            const authResult = this.authenticateUser(username, password);

            if (authResult.success) {
                this.handleSuccessfulLogin(authResult);
            } else {
                this.handleFailedLogin(authResult.message);
            }
        }

        /**
            const authResult = this.authenticateUser(username, this.hashPassword(password));
         * @param {string} username - 使用者名稱
         * @param {string} password - 使用者密碼 
         * @returns {Object} 驗證結果物件
         * - admin帳號: uno917/1069
         * - staff帳號: himan/himan
         */
        authenticateUser(username, password) {
            // 管理員驗證
            if (username === this.credentials.admin.username && 
                password === this.credentials.admin.password) {
                return {
                    success: true,
                    role: 'admin',
                    privileges: this.credentials.admin.privileges,
                    user: username
                };
            }

            // 員工驗證
            const staffUser = this.credentials.staff.get(username);
            if (staffUser && staffUser.password === password) {
                return {
                    success: true,
                    role: 'staff',
                    shift: staffUser.shift,
                    user: username
                };
            }

            return {
                success: false,
                message: '帳號或密碼不正確'
            };
        }

        /**
         * 成功登入處理：如同開啟系統權限的金鑰
         */
        handleSuccessfulLogin(authResult) {
            try {
                // 隱藏登入表單
                const loginContainer = document.getElementById('loginContainer');
                if (loginContainer) {
                    loginContainer.style.display = 'none';
                }

                // 顯示主系統界面
                const mainSystem = document.getElementById('mainSystem');
                if (mainSystem) {
                    mainSystem.style.display = 'block';
                }

                // 更新使用者界面
                this.updateUserInterface(authResult);

                // 啟動授權模組
                this.activateAuthorizedModules(authResult);

                // 顯示歡迎訊息
                this.showWelcomeMessage(authResult);

                // 儲存登入狀態
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', authResult.role);
                localStorage.setItem('username', authResult.user);

            } catch (error) {
                console.error('登入後處理失敗:', error);
                window.showToast('系統登入異常，請重新整理頁面', 'error');
            }
        }

        /**
         * 更新用戶介面：如同為藝術品添加光澤
         */
        updateUserInterface(authResult) {
            const userBadge = document.createElement('span');
            userBadge.className = authResult.role === 'admin' ? 'admin-badge' : 'staff-badge';
            userBadge.textContent = authResult.role === 'admin' ? '管理員' : '員工';

            const userNameElement = document.getElementById('currentUser');
            if (userNameElement) {
                userNameElement.textContent = authResult.user;
                userNameElement.appendChild(userBadge);
            }
        }

        /**
         * 啟動授權模組：如同點亮創新的聖火
         */
        activateAuthorizedModules(authResult) {
            const adminSections = document.querySelectorAll('.admin-only');
            const staffSections = document.querySelectorAll('.staff-only');

            adminSections.forEach(section => {
                section.style.display = authResult.role === 'admin' ? 'block' : 'none';
            });

            staffSections.forEach(section => {
                section.style.display = 'block';
            });
        }

        /**
         * 客製化歡迎訊息：如同溫暖的數位問候
         */
        showWelcomeMessage(authResult) {
            try {
                const welcomeMessage = `歡迎回來，${authResult.user}！${
                    authResult.role === 'admin' 
                        ? '您擁有系統的最高管理權限' 
                        : `目前處於${authResult.shift === 'morning' ? '早班' : '晚班'}工作模式`
                }`;

                // 使用 Toast 系統顯示訊息
                if (window.HimanSystem?.toast?.show) {
                    window.HimanSystem.toast.show(welcomeMessage, 'success');
                } else if (window.showToast) {
                    window.showToast(welcomeMessage, 'success');
                } else {
                    console.log(welcomeMessage);
                    alert(welcomeMessage);
                }
            } catch (error) {
                console.error('顯示歡迎訊息時發生錯誤:', error);
            }
        }

        /**
         * 登入失敗處理：安全防護的藝術表現
         */
        handleFailedLogin(message) {
            try {
                // 顯示錯誤訊息在錯誤顯示區
                if (this.elements.errorDisplay) {
                    this.elements.errorDisplay.textContent = message || '登入失敗';
                    this.elements.errorDisplay.style.display = 'block';
                }

                // 使用 Toast 系統顯示錯誤
                if (window.showToast) {
                    window.showToast(message || '登入失敗', 'error');
                }

                // 清空密碼輸入欄位
                if (this.elements.passwordInput) {
                    this.elements.passwordInput.value = '';
                }

                // 聚焦在用戶名輸入欄位
                if (this.elements.usernameInput) {
                    this.elements.usernameInput.focus();
                }
            } catch (error) {
                console.error('處理登入失敗時發生錯誤:', error);
                alert('登入失敗：' + (message || '發生未知錯誤'));
            }
        }
    }

    // 等待 DOM 載入完成
    function initAuth() {
        try {
            const auth = new AuthenticationSystem();
            window.HimanSystem.ModuleManager.register('auth', AuthenticationSystem);
        } catch (error) {
            console.error('認證系統初始化失敗:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();