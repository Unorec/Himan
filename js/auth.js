// 登入系統的優雅實現
class LoginSystem {
    constructor() {
        this.credentials = {
            username: 'himan',
            password: 'himan'
        };
        this.maxAttempts = 5;
        this.attemptCount = 0;
        this.cooldownTime = 300000; // 5分鐘冷卻時間
        this.initializeSystem();
    }

    initializeSystem() {
        this.loginForm = document.getElementById('loginForm');
        this.loginContainer = document.getElementById('loginContainer');
        this.mainSystem = document.getElementById('mainSystem');
        
        this.bindEvents();
        this.checkExistingSession();
    }

    bindEvents() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // 優雅的輸入動畫
        const inputs = document.querySelectorAll('.login-input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });

        // 添加登出功能
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('確定要登出系統嗎？')) {
                localStorage.removeItem('authToken');
                window.location.reload();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isLocked()) {
            this.showNotification('系統已暫時鎖定，請稍後再試', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            if (await this.validateCredentials(username, password)) {
                this.attemptCount = 0;
                this.loginSuccess();
            } else {
                this.attemptCount++;
                this.handleFailedAttempt();
            }
        } catch (error) {
            this.showNotification('登入過程發生錯誤', 'error');
            console.error('登入錯誤:', error);
        }
    }

    async validateCredentials(username, password) {
        // 模擬非同步驗證
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return username === this.credentials.username && 
               password === this.credentials.password;
    }

    loginSuccess() {
        this.setSession();
        this.showNotification('登入成功', 'success');
        
        // 優雅的轉場動畫
        this.loginContainer.classList.add('fade-out');
        setTimeout(() => {
            this.loginContainer.style.display = 'none';
            this.mainSystem.style.display = 'block';
            requestAnimationFrame(() => {
                this.mainSystem.classList.add('fade-in');
            });
        }, 500);
    }

    handleFailedAttempt() {
        const remainingAttempts = this.maxAttempts - this.attemptCount;
        
        if (remainingAttempts <= 0) {
            this.lockSystem();
            this.showNotification('登入嘗試次數過多，系統已暫時鎖定', 'error');
        } else {
            this.showNotification(
                `登入失敗，剩餘 ${remainingAttempts} 次嘗試機會`, 
                'warning'
            );
        }
    }

    isLocked() {
        const lockTime = localStorage.getItem('loginLockTime');
        if (!lockTime) return false;
        
        const timeLeft = parseInt(lockTime) - Date.now();
        return timeLeft > 0;
    }

    lockSystem() {
        const lockTime = Date.now() + this.cooldownTime;
        localStorage.setItem('loginLockTime', lockTime.toString());
        
        this.startLockdownTimer();
    }

    startLockdownTimer() {
        const timerDisplay = document.getElementById('lockdownTimer');
        const updateTimer = () => {
            const lockTime = localStorage.getItem('loginLockTime');
            if (!lockTime) return;
            
            const timeLeft = parseInt(lockTime) - Date.now();
            if (timeLeft <= 0) {
                timerDisplay.textContent = '';
                localStorage.removeItem('loginLockTime');
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            timerDisplay.textContent = 
                `系統鎖定中 ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            requestAnimationFrame(updateTimer);
        };
        
        updateTimer();
    }

    setSession() {
        localStorage.setItem('sessionToken', Date.now().toString());
        localStorage.setItem('username', this.credentials.username);
    }

    checkExistingSession() {
        const token = localStorage.getItem('sessionToken');
        if (token) {
            this.mainSystem.style.display = 'block';
            this.loginContainer.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 系統初始化
document.addEventListener('DOMContentLoaded', () => {
    window.loginSystem = new LoginSystem();
});
