// 初始化登入相關功能
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthEvents();
});

// 修改初始化事件監聽時機
function initializeAuthEvents() {
    // 確保 DOM 元素存在
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const loginInputs = document.querySelectorAll('#loginContainer input');

    if (!loginButton || !logoutButton) {
        console.error('找不到必要的登入/登出按鈕');
        return;
    }

    // 登入按鈕事件
    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    // 登出按鈕事件
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
    });

    // 監聽輸入框的 Enter 鍵
    loginInputs.forEach(input => {
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await handleLogin();
            }
        });
    });
}

// 修改登入處理函數
async function handleLogin() {
    try {
        // 取得輸入值
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value?.trim();

        // 基本驗證
        if (!username || !password) {
            window.showToast ? window.showToast('請輸入帳號和密碼', 'error') 
                           : alert('請輸入帳號和密碼');
            return;
        }

        // 顯示載入動畫
        if (window.showLoading) {
            window.showLoading(true);
        }

        // 確保儲存系統已初始化
        if (!window.storageManager) {
            throw new Error('儲存系統未載入');
        }

        // 等待儲存系統初始化
        if (!window.storageManager.isInitialized) {
            await window.storageManager.init();
        }

        // 簡單的帳號密碼驗證
        if (username === 'himan' && password === 'himan') {
            await loginSuccess(username);
        } else {
            throw new Error('帳號或密碼錯誤');
        }
    } catch (error) {
        console.error('Login error:', error);
        window.showToast ? window.showToast(error.message, 'error') 
                       : alert(error.message);
    } finally {
        if (window.showLoading) {
            window.showLoading(false);
        }
    }
}

// 修改登入成功處理函數
async function loginSuccess(username) {
    try {
        console.log('處理登入成功');
        
        // 確保儲存管理器已初始化
        if (!window.storageManager?.isInitialized) {
            throw new Error('儲存系統未初始化');
        }

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

    } catch (error) {
        console.error('登入成功處理錯誤:', error);
        throw new Error('登入處理發生錯誤: ' + error.message);
    }
}

// 處理登出
async function handleLogout() {
    try {
        showLoading(true);

        // 模擬 API 請求延遲
        await new Promise(resolve => setTimeout(resolve, 500));

        // 清除登入狀態
        storageManager.clearUserSession();
        
        // 清除全域狀態
        window.app.currentUser = null;
        
        // 清除表單
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) usernameInput.value = '';
        
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

// 確保初始化順序
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 等待儲存系統初始化
        if (window.storageManager && !window.storageManager.isInitialized) {
            await window.storageManager.init();
        }
        initializeAuthEvents();
        console.log('Auth module initialized');
    } catch (error) {
        console.error('Auth initialization error:', error);
    }
});