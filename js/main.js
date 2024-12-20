// 全域狀態管理
const app = {
    currentUser: null,
    currentSection: 'entry',
    isLoading: false
};

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
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
async function switchSection(sectionId) {
    console.log('Switching to section:', sectionId);
    
    app.currentSection = sectionId;
    
    try {
        // 等待區段載入完成
        await loadSectionContent(sectionId);
    } catch (error) {
        console.error('Error switching section:', error);
        showToast('切換頁面失敗', 'error');
    }
}

// 修改顯示主系統函數
function showMainSystem() {
    try {
        console.log('Entering showMainSystem');
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        
        console.log('Scheduling loadEntrySection');
        // 確保 DOM 更新完成後再載入入場登記
        requestAnimationFrame(() => {
            console.log('Loading entry section');
            switchSection('entry');
        });
    } catch (error) {
        console.error('顯示主系統錯誤:', error);
        showToast('系統載入失敗', 'error');
    }
}

// 顯示登入表單
function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('mainSystem').style.display = 'none';
}

// 修改載入區段內容函數
async function loadSectionContent(sectionId) {
    console.log('Loading section:', sectionId);
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        throw new Error('找不到主要內容容器');
    }

    try {
        showLoading(true);
        
        // 確認核心功能已載入
        if (!window.storageManager?.isInitialized) {
            console.log('等待 storageManager 初始化...');
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!window.storageManager?.isInitialized) {
                throw new Error('儲存系統未初始化');
            }
        }

        switch (sectionId) {
            case 'entry':
                console.log('準備載入入場登記');
                if (typeof window.loadEntrySection !== 'function') {
                    throw new Error('入場功能模組未載入，請重新整理頁面');
                }
                await window.loadEntrySection();
                console.log('入場登記載入完成');
                break;
                
            case 'records':
                if (typeof loadRecordsSection !== 'function') {
                    console.error('Records module not found, reloading page...');
                    location.reload();
                    return;
                }
                await loadRecordsSection();
                break;
                
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
        console.error('載入區段錯誤:', error);
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>載入失敗</h2>
                </div>
                <div class="card-body error-message">
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="primary-button mt-3">
                        重新載入頁面
                    </button>
                </div>
            </div>
        `;
        showToast(error.message, 'error');
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
        // 系統初始化時清除緩存
        await clearAllCache();
        
        // 檢查核心依賴
        const requiredModules = [
            'storageManager',
            'loadEntrySection',
            'handlePaymentTypeChange',
            'adjustAmount'
        ];

        // 等待所有模組載入
        await new Promise(resolve => setTimeout(resolve, 300));

        // 檢查所有必要模組
        const missingModules = requiredModules.filter(
            module => !window[module]
        );

        if (missingModules.length > 0) {
            throw new Error(`未載入的模組: ${missingModules.join(', ')}`);
        }

        console.log('系統初始化成功');
        return true;
    } catch (error) {
        console.error('系統初始化失敗:', error);
        handleError(error);
        return false;
    }
}