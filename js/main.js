// 全域狀態管理
const app = {
    currentUser: null,
    currentSection: 'entry',
    isLoading: false
};

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
<<<<<<< Updated upstream
=======
    checkLoginStatus();
>>>>>>> Stashed changes
});

// 初始化所有事件監聽
function initializeEventListeners() {
    // 主選單點擊事件
    document.querySelectorAll('.main-menu .menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            switchSection(section);
            
            // 更新選中狀態
            document.querySelectorAll('.main-menu .menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            e.target.classList.add('active');
        });
    });
}

// 檢查登入狀態
function checkLoginStatus() {
    const session = storageManager.getUserSession();
    if (session) {
        app.currentUser = session.username;
        document.getElementById('currentUser').textContent = session.username;
        showMainSystem();
    } else {
        showLoginForm();
    }
}

// 切換頁面區段
function switchSection(sectionId) {
    console.log('Switching to section:', sectionId); // 調試用
    
    // 更新目前區段
    app.currentSection = sectionId;
    
    // 顯示載入動畫
    showLoading(true);
    
    try {
        // 載入對應的內容
        loadSectionContent(sectionId);
    } catch (error) {
        console.error('Error switching section:', error);
        showToast('切換頁面失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 顯示主系統
function showMainSystem() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // 載入預設區段（入場登記）
    switchSection('entry');
}

// 顯示登入表單
function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('mainSystem').style.display = 'none';
}

// 修改載入區段內容函數
async function loadSectionContent(sectionId) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
<<<<<<< Updated upstream
        throw new Error('找不到主要內容容器');
=======
        throw new Error('主內容區域未找到');
>>>>>>> Stashed changes
    }

    try {
        showLoading(true);
<<<<<<< Updated upstream
        
        switch (sectionId) {
            case 'entry':
                if (typeof loadEntrySection !== 'function') {
                    throw new Error('入場功能模組未載入');
                }
                await loadEntrySection();
                break;
                
            case 'records':
                if (typeof loadRecordsSection !== 'function') {
                    console.error('Records module not found, reloading page...');
                    location.reload();
                    return;
                }
                await loadRecordsSection();
                break;
                
=======

        // 檢查必要函數是否已載入
        if (sectionId === 'records' && typeof window.loadRecordsSection !== 'function') {
            throw new Error('記錄功能尚未載入完成，請稍後再試');
        }

        switch (sectionId) {
            case 'entry':
                await loadEntrySection();
                break;
            case 'records':
                await window.loadRecordsSection();
                break;
>>>>>>> Stashed changes
            case 'stats':
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>統計報表</h2></div><div class="card-body">統計報表功能開發中...</div></div>';
                break;
                
            case 'settings':
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>系統設定</h2></div><div class="card-body">系統設定功能開發中...</div></div>';
                break;
                
            default:
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>功能不存在</h2></div><div class="card-body">請選擇其他功能</div></div>';
        }
    } catch (error) {
        console.error('Error loading section:', error);
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>載入失敗</h2>
                </div>
                <div class="card-body error-message">
<<<<<<< Updated upstream
                    <p>載入內容時發生錯誤：</p>
=======
>>>>>>> Stashed changes
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="primary-button">
                        重新整理頁面
                    </button>
                </div>
            </div>
        `;
<<<<<<< Updated upstream
        showToast(error.message || '載入內容失敗', 'error');
=======
        showToast(error.message, 'error');
>>>>>>> Stashed changes
    } finally {
        showLoading(false);
    }
}

// 將需要的函數和物件掛載到 window 上
window.app = app;
window.showToast = showToast;
window.showLoading = showLoading;
window.showMainSystem = showMainSystem;
window.showLoginForm = showLoginForm;
window.switchSection = switchSection;
<<<<<<< Updated upstream

// 輔助函數
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

function showLoading(show = true) {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// 修改錯誤處理
function handleError(error) {
    if (error.testResult) {
        // 如果是測試結果錯誤，使用測試結果處理器
        TestResultHandler.handleTestResult(error.testResult);
    } else {
        // 一般錯誤處理
        console.error('系統錯誤:', error);
        showToast(error.message || '操作失敗，請重試', 'error');
    }
}

// 修改主系統初始化流程
window.addEventListener('load', async () => {
    try {
        const systemInitialized = await initializeSystem();
        if (systemInitialized) {
            checkLoginStatus();
        }
    } catch (error) {
        handleError(error);
    }
});

// 修改初始化系統函數
async function initializeSystem() {
    try {
        // 基本檢查
        if (!window.storageManager || !window.TestResultHandler) {
            throw new Error('核心模組未載入');
        }

        // 確保所有必要模組都已載入
        const requiredModules = ['loadEntrySection', 'loadRecordsSection'];
        for (const module of requiredModules) {
            if (typeof window[module] !== 'function') {
                throw new Error(`${module} 模組未載入`);
            }
        }

        return true;
    } catch (error) {
        handleError(error);
        return false;
=======

// 輔助函數
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

function showLoading(show = true) {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
>>>>>>> Stashed changes
    }
}