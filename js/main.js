// 系統靈魂的優雅綻放
class MainSystem {
    constructor() {
        this.state = {
            currentUser: null,
            currentSection: 'entry',
            isLoading: false,
            systemMode: 'production'
        };
        this.moduleStatus = new Map();
    }

    // 系統啟動的優雅序曲
    async initialize() {
        try {
            console.log('開始譜寫系統的靈動樂章...');
            
            // 檢查必要的前奏準備
            await this.verifyEnvironment();
            
            // 初始化核心模組的華麗樂章
            await this.initializeCoreModules();
            
            // 綁定互動的優雅韻律
            this.bindSystemEvents();
            
            // 檢查用戶的靈動印記
            await this.checkLoginStatus();
            
            console.log('系統靈感的優雅綻放已然完成');
        } catch (error) {
            console.error('系統啟動的優雅迷失:', error);
            this.handleSystemError(error);
        }
    }

    // 環境檢查的嚴謹藝術
    async verifyEnvironment() {
        // 確保必要的靈感之源
        const requiredFeatures = ['localStorage', 'sessionStorage'];
        const missingFeatures = requiredFeatures.filter(
            feature => !window[feature]
        );

        if (missingFeatures.length > 0) {
            throw new Error(`系統缺少必要的靈感之源: ${missingFeatures.join(', ')}`);
        }
    }

    // 核心模組初始化的精妙交響
    async initializeCoreModules() {
        const coreModules = {
            storage: window.storageManager?.init(),
            modal: window.modalModule?.init(),
            settings: window.settingsManager?.init()
        };

        // 優雅地等待每個模組的靈感綻放
        for (const [name, initPromise] of Object.entries(coreModules)) {
            try {
                await initPromise;
                this.moduleStatus.set(name, true);
                console.log(`模組 ${name} 的靈感已然綻放`);
            } catch (error) {
                this.moduleStatus.set(name, false);
                console.error(`模組 ${name} 的靈感迷失:`, error);
                throw error;
            }
        }
    }

    // 系統事件的優雅韻律
    bindSystemEvents() {
        // 主選單的靈動切換
        document.querySelectorAll('.main-menu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.dataset.section);
            });
        });

        // 系統狀態的優雅監聽
        window.addEventListener('online', () => this.handleConnectivityChange(true));
        window.addEventListener('offline', () => this.handleConnectivityChange(false));
        
        // 優雅地攔截未處理的異常
        window.addEventListener('unhandledrejection', this.handleUnhandledError.bind(this));
    }

    // 登入狀態的優雅檢查
    async checkLoginStatus() {
        const session = await window.storageManager?.getUserSession();
        if (session) {
            this.state.currentUser = session.username;
            this.updateUserDisplay();
            this.showMainSystem();
        } else {
            this.showLoginForm();
        }
    }

    // 頁面切換的靈動之舞
    async switchSection(sectionId) {
        try {
            this.state.isLoading = true;
            this.showLoading(true);

            // 更新選單的視覺韻律
            this.updateMenuState(sectionId);

            // 載入區段的優雅轉場
            await this.loadSectionContent(sectionId);

            this.state.currentSection = sectionId;
        } catch (error) {
            console.error('頁面切換的優雅迷失:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.state.isLoading = false;
            this.showLoading(false);
        }
    }

    // 選單狀態的優雅更新
    updateMenuState(sectionId) {
        document.querySelectorAll('.main-menu .menu-item').forEach(item => {
            const isActive = item.dataset.section === sectionId;
            item.classList.toggle('active', isActive);
        });
    }

    // 區段內容載入的精妙藝術
    async loadSectionContent(sectionId) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        try {
            // 首先清空現有內容
            mainContent.innerHTML = '';
            
            switch (sectionId) {
                case 'entry':
                    await this.loadEntrySection(mainContent);
                    break;
                case 'records':
                    await this.loadRecordsSection(mainContent);
                    break;
                case 'tickets':
                    await this.loadTicketsSection(mainContent);
                    break;
                case 'expenses':
                    await this.loadExpensesSection(mainContent);
                    break;
                case 'stats':
                    await this.loadStatsSection(mainContent);
                    break;
                case 'settings':
                    await this.loadSettingsSection(mainContent);
                    break;
                default:
                    throw new Error('未知的靈感之途');
            }
        } catch (error) {
            throw new Error(`區段 ${sectionId} 載入失敗: ${error.message}`);
        }
    }

    // 各區段的載入函數
    async loadEntrySection(container) {
        container.innerHTML = `
            <div class="section-container">
                <h2>入場登記</h2>
                <div class="entry-form">
                    <!-- 入場表單內容 -->
                </div>
            </div>
        `;
    }

    async loadRecordsSection(container) {
        container.innerHTML = `
            <div class="section-container">
                <h2>入場記錄</h2>
                <div class="records-controls">
                    <select id="statusFilter">
                        <option value="all">全部狀態</option>
                        <option value="active">使用中</option>
                        <option value="temporary">暫時外出</option>
                        <option value="completed">已完成</option>
                    </select>
                    <input type="text" id="searchInput" placeholder="搜尋...">
                </div>
                <div class="records-table">
                    <table>
                        <thead>
                            <tr>
                                <th>置物櫃號</th>
                                <th>付款資訊</th>
                                <th>時間資訊</th>
                                <th>剩餘時間</th>
                                <th>狀態</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="recordsTableBody"></tbody>
                    </table>
                </div>
            </div>
        `;
        
        // 確保記錄管理器已初始化
        if (window.recordsManager && !window.recordsManager.isInitialized) {
            await window.recordsManager.init();
        }

        // 觸發記錄更新
        await window.recordsManager?.refreshRecords();
    }

    async loadTicketsSection(container) {
        container.innerHTML = `
            <div class="section-container">
                <h2>票券管理</h2>
                <!-- 票券管理內容 -->
            </div>
        `;
    }

    async loadExpensesSection(container) {
        container.innerHTML = `
            <div class="section-container">
                <h2>生活支出</h2>
                <!-- 生活支出內容 -->
            </div>
        `;
    }

    async loadStatsSection(container) {
        container.innerHTML = `
            <div class="section-container">
                <h2>統計報表</h2>
                <!-- 統計報表內容 -->
            </div>
        `;
    }

    async loadSettingsSection(container) {
        container.innerHTML = `
            <div class="section-container">
                <h2>系統設定</h2>
                <!-- 系統設定內容 -->
            </div>
        `;
    }

    // 使用者顯示的優雅更新
    updateUserDisplay() {
        const userElement = document.getElementById('currentUser');
        if (userElement && this.state.currentUser) {
            userElement.textContent = this.state.currentUser;
        }
    }

    // 系統主介面的優雅展現
    showMainSystem() {
        const loginContainer = document.getElementById('loginContainer');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginContainer && mainSystem) {
            loginContainer.style.display = 'none';
            mainSystem.style.display = 'block';
            
            // 預設載入入場頁面的靈感
            this.switchSection('entry');
        }
    }

    // 登入表單的優雅展示
    showLoginForm() {
        const loginContainer = document.getElementById('loginContainer');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginContainer && mainSystem) {
            loginContainer.style.display = 'block';
            mainSystem.style.display = 'none';
        }
    }

    // 載入動畫的靈動展現
    showLoading(show = true) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // 提示訊息的優雅呈現
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 網路狀態變化的優雅處理
    handleConnectivityChange(isOnline) {
        const message = isOnline ? 
            '網路連接已恢復' : 
            '網路連接已中斷，部分功能可能受限';
        
        this.showToast(message, isOnline ? 'success' : 'warning');
    }

    // 未處理異常的優雅攔截
    handleUnhandledError(event) {
        console.error('未預期的靈感迷失:', event.reason);
        this.showToast('系統遇到了一些問題，請稍後再試', 'error');
        event.preventDefault();
    }

    // 系統錯誤的優雅處理
    handleSystemError(error) {
        console.error('系統錯誤的優雅處理:', error);
        
        this.showToast(error.message || '系統遇到了一些問題，請稍後再試', 'error');
        
        // 記錄錯誤的靈感軌跡
        if (window.statsModule?.logError) {
            window.statsModule.logError(error);
        }
    }
}

// 將系統優雅地綻放到全域
window.mainSystem = new MainSystem();
window.systemCore = new SystemCore();  // 加入這行

// 當文檔準備就緒時，啟動系統的靈感
document.addEventListener('DOMContentLoaded', () => {
    window.mainSystem.initialize().catch(console.error);
});

async function initApp() {
    try {
        // 初始化系統
        await window.systemCore.initialize();
        console.log('系統初始化完成');
    } catch (error) {
        console.error('系統初始化失敗:', error);
        window.showToast?.('系統初始化失敗', 'error');
    }
}

// 設為全域函數
window.initApp = initApp;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        // 處理登入邏輯
        handleLogin();
    });
}

function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleNavigation(item.dataset.section);
        });
    });
}

function handleLogin() {
    // 登入驗證邏輯
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
    }
}

function handleNavigation(section) {
    // 導航邏輯
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
}

function initializeSystem() {
    // 系統初始化邏輯
    document.getElementById('logoutButton')?.addEventListener('click', () => {
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('mainSystem').style.display = 'none';
    });
}