// 初始化登入相關功能
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthEvents();
});

// 初始化登入相關事件
function initializeAuthEvents() {
    // 登入按鈕事件
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    // 登出按鈕事件
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // 監聽輸入框的 Enter 鍵
    const loginInputs = document.querySelectorAll('#loginContainer input');
    loginInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    });
}

// 處理登入
async function handleLogin() {
    try {
        // 取得輸入值
        const username = document.getElementById('username')?.value?.trim() || '';
        const password = document.getElementById('password')?.value?.trim() || '';

        // 基本驗證
        if (!username || !password) {
            showToast('請輸入帳號和密碼', 'error');
            return;
        }

        // 顯示載入動畫
        showLoading(true);

        // 模擬 API 請求延遲
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 簡單的帳號密碼驗證
        if (username === 'himan' && password === 'himan') {
            // 登入成功
            loginSuccess(username);
        } else {
            // 登入失敗
            showToast('帳號或密碼錯誤', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('登入發生錯誤', 'error');
    } finally {
        showLoading(false);
    }
}

// 登入成功處理
function loginSuccess(username) {
    try {
        // 儲存登入狀態
        storageManager.saveUserSession({
            username: username,
            loginTime: new Date().toISOString()
        });

        // 更新使用者顯示
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement) {
            currentUserElement.textContent = username;
        }

        // 更新全域狀態
        window.app.currentUser = username;

        // 顯示主系統
        showMainSystem();

        // 顯示成功訊息
        showToast('登入成功');
    } catch (error) {
        console.error('Login success handling error:', error);
        showToast('登入處理發生錯誤', 'error');
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