(function() {
    // 檢查系統核心依賴
    if (typeof SystemCore === 'undefined') {
        console.error('SystemCore 未載入，請確認 base.js 是否正確載入');
        return;
    }

    // 確保系統核心實例存在
    if (!window.systemCore) {
        console.log('重新初始化系統核心');
        window.systemCore = new SystemCore();
    }

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
                <div class="entry-container">
                    <h2 class="system-title">入場登記</h2>
                    
                    <!-- 優惠時段提示 -->
                    <div id="discountAlert" class="time-notice">
                        <div class="discount-info">
                            目前為優惠時段：<span class="price">350</span>元（使用至隔日06:00）
                        </div>
                    </div>
                    
                    <!-- 入場表單 -->
                    <form id="entryForm">
                        <!-- 價格顯示區 -->
                        <div class="price-display">
                            <span id="currentPrice">目前票價：500元</span>
                            <span class="price-info">（24小時制）</span>
                        </div>
        
                        <!-- 櫃位號碼 -->
                        <div class="form-group">
                            <label for="lockerNumber">櫃位號碼</label>
                            <input type="number" id="lockerNumber" class="form-control" required>
                        </div>
        
                        <!-- 付款方式 -->
                        <div class="form-group">
                            <label>付款方式</label>
                            <div class="payment-type">
                                <label>
                                    <input type="radio" name="paymentType" value="cash" checked> 現金
                                </label>
                                <label>
                                    <input type="radio" name="paymentType" value="ticket"> 票券
                                </label>
                            </div>
                        </div>
        
                        <!-- 現金付款區域 -->
                        <div class="cash-payment-area">
                            <div class="form-group">
                                <label for="amount">金額</label>
                                <input type="number" id="amount" class="form-control" readonly>
                            </div>
                        </div>
        
                        <!-- 票券付款區域 -->
                        <div class="ticket-payment-area hidden">
                            <div class="form-group">
                                <label for="ticketNumber">票券號碼</label>
                                <input type="text" id="ticketNumber" class="form-control" placeholder="請輸入票券號碼">
                            </div>
                        </div>
        
                        <!-- 備註 -->
                        <div class="form-group">
                            <label for="remarks">備註說明</label>
                            <textarea id="remarks" class="form-control" rows="3"></textarea>
                        </div>
        
                        <!-- 提交按鈕 -->
                        <button type="submit" class="submit-btn">確認登記</button>
                    </form>
                </div>
            `;
            
            // 初始化入場系統
            if (!window.entrySystem) {
                window.entrySystem = new EntrySystem();
            } else {
                window.entrySystem.initializeSystem();
            }
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

        // 頁面切換的靈動之舞
        switchSection(section) {
            // 隱藏所有區段
            document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
            
            // 顯示選中的區段
            const targetSection = document.getElementById(`${section}Section`);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // 如果是入場登記頁面，初始化 EntrySystem
                if (section === 'entry') {
                    const entrySystem = new EntrySystem();
                }
            }

            // 更新選單狀態
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.toggle('active', item.dataset.section === section);
            });

            this.state.currentSection = section;
        }
    }

    // 將系統優雅地綻放到全域
    window.mainSystem = new MainSystem();
    window.systemCore = new SystemCore();  // 加入這行

    // 當文檔準備就緒時，啟動系統的靈感
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // 初始化系統核心
            const systemCore = new SystemCore();
            await systemCore.initialize();
            
            // 載入必要模組
            await systemCore.loadRequiredModules();
            
            console.log('系統初始化完成');
            
            // ...其他初始化代碼...
            
        } catch (error) {
            console.error('系統初始化失敗:', error);
            if (window.showToast) {
                window.showToast('系統載入失敗，請重新整理頁面', 'error');
            }
        }
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
    async function initializeModules() {
        if (!window.EntrySystem) {
            throw new Error('入場系統模組未正確載入');
        }
        
        try {
            await window.entrySystem?.init();
            console.log('入場系統優雅綻放');
        } catch (error) {
            console.error('入場系統初始化失敗:', error);
            throw error;
        }
    }
})();

(function() {
    'use strict';

    function showSection(sectionId) {
        // 隱藏所有區段
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // 顯示選定的區段
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // 更新選單項目的狀態
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
    }

    // 初始化頁面時顯示入場登記
    document.addEventListener('DOMContentLoaded', () => {
        showSection('entry');

        // 綁定選單點擊事件
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                showSection(section);
            });
        });
    });
})();