// 初始化登入相關功能
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 檢查並等待儲存系統初始化
        if (!window.storageManager) {
            throw new Error('儲存系統未載入');
        }

        await window.storageManager.init();
        await initializeAuthEvents();

        // 標記 auth 模組已載入
        window.moduleLoaded = window.moduleLoaded || {};
        window.moduleLoaded.auth = true;

        console.log('Auth module initialized');
    } catch (error) {
        console.error('Auth initialization error:', error);
        window.showToast?.('認證系統初始化失敗', 'error');
    }
});

// 修改初始化事件監聽時機
async function initializeAuthEvents() {
    try {
        // 確保 storageManager 已初始化
        if (!window.storageManager) {
            throw new Error('儲存系統未載入');
        }

        // 等待儲存系統初始化
        if (!window.storageManager.isInitialized) {
            await window.storageManager.init();
        }

        // 綁定按鈕事件
        const loginForm = document.getElementById('loginForm');
        const logoutButton = document.getElementById('logoutButton');

        if (!loginForm || !logoutButton) {
            throw new Error('找不到必要的登入/登出元素');
        }

        // 使用表單提交事件而不是按鈕點擊
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });

        logoutButton.addEventListener('click', async () => {
            await handleLogout();
        });

    } catch (error) {
        console.error('Auth initialization error:', error);
        showToast?.('認證系統初始化失敗', 'error');
    }
}

// 修改登入處理函數
async function handleLogin() {
    try {
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value?.trim();

        if (!username || !password) {
            throw new Error('請輸入帳號和密碼');
        }

        showLoading?.(true);

        // 重新檢查儲存系統狀態
        if (!window.storageManager?.isInitialized) {
            await window.storageManager?.init();
        }

        if (!window.storageManager?.isInitialized) {
            throw new Error('儲存系統未就緒');
        }

        // 驗證帳密
        if ((username === 'uno917' && password === 'uno1069') || (username === 'himan' && password === 'himan')) {
            await loginSuccess(username);
        } else {
            throw new Error('帳號或密碼錯誤');
        }

    } catch (error) {
        console.error('Login error:', error);
        showToast?.(error.message, 'error');
    } finally {
        showLoading?.(false);
    }
}

// 修改登入成功處理函數
async function loginSuccess(username) {
    try {
        console.log('處理登入成功');

        // 儲存登入狀態
        await window.storageManager.saveUserSession({
            username: username,
            loginTime: new Date().toISOString()
        });

        // 更新使用者顯示
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement) {
            currentUserElement.textContent = username;
        }

        // 更新全域狀態
        if (window.app) {
            window.app.currentUser = username;
        }

        console.log('準備顯示主系統');
        // 使用 Promise 確保主系統顯示完成
        await new Promise((resolve) => {
            window.showMainSystem();
            // 給予 DOM 更新的時間
            setTimeout(resolve, 100);
        });

        console.log('主系統顯示完成');
        // 確保顯示成功訊息
        if (window.showToast) {
            window.showToast('登入成功');
        }

        // 顯示或隱藏設定介面
        const settingsSection = document.getElementById('settingsSection');
        if (settingsSection) {
            settingsSection.style.display = 'block';
        }

        // 控制編輯權限
        const inputs = settingsSection.querySelectorAll('input, select, button');
        inputs.forEach(input => {
            input.disabled = username !== 'uno917';
        });

    } catch (error) {
        console.error('登入成功處理錯誤:', error);
        throw new Error('登入處理發生錯誤: ' + error.message);
    }
}

// 處理登出
async function handleLogout() {
    try {
        showLoading(true);

        // 清除登入狀態
        window.storageManager.clearUserSession();

        // 清除全域狀態
        window.app.currentUser = null;

        // 清除表單
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';

        // 顯示登入表單
        showLoginForm();

        // 顯示登出訊息
        showToast('已成功登出');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('登出發生錯誤', 'error');
    } finally {
        showLoading(false);
    }
}

// 確保全域函數可用
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;

// 顯示登入表單
function showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('settingsSection').style.display = 'none';
}

// 顯示主系統
function showMainSystem() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'block';
}
