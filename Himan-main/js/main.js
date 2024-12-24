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

            case 'tickets':
                // 檢查票卷模組是否已載入
                if (!window.ticketsModule?.initialized) {
                    await window.ticketsModule?.init();
                }
                // 直接渲染票卷管理內容
                mainContent.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h2>票卷管理</h2>
                            <button class="primary-button" id="addTicketBtn">新增票卷</button>
                        </div>
                        <div class="card-body">
                            <div class="tickets-list"></div>
                        </div>
                    </div>
                `;
                // 初始化票卷列表
                window.ticketsModule.renderTickets();
                // 重新綁定事件
                const addTicketBtn = document.getElementById('addTicketBtn');
                if (addTicketBtn) {
                    addTicketBtn.addEventListener('click', () => window.ticketsModule.showAddTicketModal());
                }
                break;

            case 'expenses':
                // 檢查支出模組是否已載入
                if (!window.expensesModule?.initialized) {
                    await window.expensesModule?.init();
                }
                // 直接渲染生活支出內容
                mainContent.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h2>生活支出記錄</h2>
                            <div class="header-actions">
                                <button class="primary-button" id="addExpenseBtn">新增支出</button>
                                <select id="expenseFilterMonth" class="form-control">
                                    <option value="">選擇月份</option>
                                </select>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="expenses-summary"></div>
                            <div class="expenses-list"></div>
                        </div>
                    </div>
                `;
                // 初始化月份篩選器和支出列表
                window.expensesModule.initMonthFilter();
                window.expensesModule.renderExpenses();
                // 重新綁定事件
                const addExpenseBtn = document.getElementById('addExpenseBtn');
                if (addExpenseBtn) {
                    addExpenseBtn.addEventListener('click', () => window.expensesModule.showAddExpenseModal());
                }
                const monthFilter = document.getElementById('expenseFilterMonth');
                if (monthFilter) {
                    monthFilter.addEventListener('change', () => window.expensesModule.renderExpenses());
                }
                break;
                
            case 'stats':
                mainContent.innerHTML = '<div class="card"><div class="card-header"><h2>統計報表</h2></div><div class="card-body">統計報表功能開發中...</div></div>';
                document.dispatchEvent(new Event('statsModuleReady'));
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
        // 如果是測試結果錯誤，使用測試結果處可以
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
        // 等待系統初始化完成
        const systemInitialized = await initializeSystem();
        if (systemInitialized) {
            // 執行登入檢查
            await checkLoginStatus();
        }
    } catch (error) {
        handleError(error);
    }
});

// 檢查必要檔案是否載入
async function checkRequiredFiles() {
    const requiredFiles = [
        'utils.js',
        'storage.js',
        'auth.js',
        'modal.js'
    ];
    
    for (const file of requiredFiles) {
        try {
            const response = await fetch(`js/${file}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${file}`);
            }
        } catch (error) {
            console.error(`File loading error: ${error.message}`);
            window.showToast?.(`無法載入必要檔案: ${file}`, 'error');
            return false;
        }
    }
    return true;
}

// 修改初始化系統函數
async function initializeSystem() {
    try {
        // 檢查必要檔案
        const filesLoaded = await checkRequiredFiles();
        if (!filesLoaded) {
            throw new Error('必要檔案載入失敗');
        }
        
        console.log('開始系統初始化...');
        
        // 等待 DOM 載入完成
        if (document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve));
        }
        
        // 1. 優先初始化儲存管理器
        if (!window.storageManager) {
            window.storageManager = new StorageManager();
        }

        // 2. 確保儲存系統初始化完成
        if (!window.storageManager.isInitialized) {
            await window.storageManager.init();
        }

        if (!window.storageManager.isInitialized) {
            throw new Error('儲存系統初始化失敗');
        }

        console.log('儲存系統初始化成功');
        
        // 繼續其他初始化...
        // 1. 確保 storageManager 存在並初始化
        if (!window.storageManager) {
            throw new Error('儲存管理器未載入');
        }
        await window.storageManager.init();

        // 2. 等待 wsManager 初始化
        let wsInitAttempts = 0;
        while (!window.wsManager && wsInitAttempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            wsInitAttempts++;
        }

        if (!window.wsManager) {
            console.warn('WebSocket 管理器未載入，系統將以離線模式運行');
            return true;
        }

        // 3. 初始化並連接 WebSocket
        try {
            const wsConnected = window.wsManager.connect();
            if (!wsConnected) {
                console.warn('WebSocket 連線失敗，系統將以離線模式運行');
            }
        } catch (wsError) {
            console.warn('WebSocket 連線發生錯誤:', wsError);
        }

        // 4. 設置 WebSocket 狀態監聽
        if (window.wsManager) {
            window.wsManager.on('connectionStateChange', ({ state }) => {
                const statusElement = document.getElementById('connectionStatus');
                if (statusElement) {
                    statusElement.textContent = state === 'connected' ? '已連線' : '未連線';
                    statusElement.className = `connection-status ${state}`;
                }
            });
        }

        console.log('系統初始化完成');
        return true;

    } catch (error) {
        console.error('系統初始化失敗:', error);
        showToast('系統初始化失敗: ' + error.message, 'error');
        return false;
    }
}

// 改進模組載入檢查
async function checkModulesLoaded() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.loadEntrySection && 
            window.loadRecordsSection && 
            window.storageManager?.isInitialized) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    throw new Error('Module loading timeout');
}

// 修改模組初始化檢查
async function initializeModules() {
    try {
        // 等待儲存系統初始化
        if (!window.storageManager?.isInitialized) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;
                const interval = setInterval(() => {
                    if (window.storageManager?.isInitialized) {
                        clearInterval(interval);
                        resolve();
                    }
                    attempts++;
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('儲存系統初始化超時'));
                    }
                }, 100);
            });
        }

        // 檢查並等待必要模組載入
        const requiredModules = ['storage', 'auth'];
        await Promise.all(requiredModules.map(async (module) => {
            if (!window.moduleLoaded?.[module]) {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 50;
                    const interval = setInterval(() => {
                        if (window.moduleLoaded?.[module]) {
                            clearInterval(interval);
                            resolve();
                        }
                        attempts++;
                        if (attempts >= maxAttempts) {
                            clearInterval(interval);
                            reject(new Error(`模組 ${module} 載入超時`));
                        }
                    }, 100);
                });
            }
        }));

        return true;
    } catch (error) {
        console.error('模組初始化失敗:', error);
        window.showToast?.('模組初始化失敗: ' + error.message, 'error');
        return false;
    }
}

// 修改載入事件監聽器，確保按正確順序執行
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('開始初始化系統...');
        // 初始化順序：storage -> auth -> 其他模組
        await initializeSystem();
        await initializeModules();
        checkLoginStatus();
    } catch (error) {
        console.error('初始化失敗:', error);
        handleError(error);
    }
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.showToast) {
        window.showToast('系統發生錯誤，請重新整理頁面', 'error');
    }
});

// 修改資源載入錯誤處理
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.showToast) {
        window.showToast('資源載入失敗，請重新整理頁面', 'error');
    }
});