// 初始化全域系統對象
(function() {
    // 確保全域對象存在
    window.HimanSystem = window.HimanSystem || {
        modules: new Map(),
        instances: new Map(),
        ModuleManager: {
            _modules: new Map(),
            _instances: new Map(),
            register(name, ModuleClass) {
                if (!this._modules.has(name)) {
                    this._modules.set(name, ModuleClass);
                    console.log(`模組 ${name} 註冊成功`);
                }
                return this._modules.get(name);
            },
            getInstance(name) {
                if (!this._instances.has(name)) {
                    const ModuleClass = this._modules.get(name);
                    if (ModuleClass) {
                        this._instances.set(name, new ModuleClass());
                    }
                }
                return this._instances.get(name);
            }
        }
    };

    class SystemCore {
        constructor() {
            this.moduleStatus = new Map();
            this.config = this.getDefaultConfig();
            this.initializeState();
            this.bindCoreEvents();
        }

        getDefaultConfig() {
            return {
                debug: false,
                apiUrl: window.location.origin,
                timeout: 30000,
                retryAttempts: 3,
                sessionTimeout: 3600000,
                heartbeatInterval: 30000
            };
        }

        setSystemConfig() {
            try {
                const savedConfig = localStorage.getItem('system_config');
                this.config = savedConfig ? 
                    { ...this.getDefaultConfig(), ...JSON.parse(savedConfig) } : 
                    this.getDefaultConfig();

                window.SystemConfig = this.config;
                return true;
            } catch (error) {
                this.handleSystemError(error);
                return false;
            }
        }

        updateSystemConfig(newConfig) {
            try {
                this.config = { ...this.config, ...newConfig };
                localStorage.setItem('system_config', JSON.stringify(this.config));
                window.SystemConfig = this.config;
                return true;
            } catch (error) {
                this.handleSystemError(error);
                return false;
            }
        }

        // 添加 initialize 方法
        async loadEntryModule() {
            try {
                await this.loadModule('entry');
                if (typeof EntrySystem === 'undefined') {
                    throw new Error('入場系統模組載入失敗');
                }
                return true;
            } catch (error) {
                console.error('入場系統模組載入錯誤:', error);
                return false;
            }
        }
    async loadEntryModule() {
        try {
            await this.loadModule('entry');
            if (typeof EntrySystem === 'undefined') {
                throw new Error('入場系統模組載入失敗');
            }
            return true;
        } catch (error) {
            console.error('入場系統模組載入錯誤:', error);
            return false;
        }
    }

    async initialize() {
        try {
            console.log('初始化系統核心...');
            
            // 檢查環境
            await this.verifyEnvironment();
                
                // 載入必要模組
                await this.loadRequiredModules();
                
                // 初始化事件監聽
                this.initializeEventListeners();
                
                console.log('系統核心初始化完成');
                return true;
            } catch (error) {
                console.error('系統核心初始化失敗:', error);
                throw error;
            }
        }

        // 檢查環境
        async verifyEnvironment() {
            // 檢查必要的瀏覽器功能
            const requiredFeatures = [
                'localStorage',
                'sessionStorage',
                'Promise',
                'fetch'
            ];

            const missingFeatures = requiredFeatures.filter(
                feature => !(feature in window)
            );

            if (missingFeatures.length > 0) {
                throw new Error(`缺少必要的功能: ${missingFeatures.join(', ')}`);
            }
        }

        // 修改載入必要模組的方法
        async loadRequiredModules() {
            const requiredModules = [
                'storage',
                'auth',
                'modal'
            ];

            for (const module of requiredModules) {
                try {
                    this.moduleStatus.set(module, 'loading');
                    await this.loadModule(module);
                    this.moduleStatus.set(module, 'loaded');
                    console.log(`模組 ${module} 載入成功`);
                } catch (error) {
                    this.moduleStatus.set(module, 'error');
                    console.error(`模組 ${module} 載入失敗:`, error);
                    throw new Error(`模組 ${module} 載入失敗: ${error.message}`);
                }
            }
        }

        // 初始化事件監聽
        initializeEventListeners() {
            // 系統級別的事件監聽
            window.addEventListener('error', this.handleSystemError.bind(this));
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        }

        // 新增：處理未捕獲的 Promise 異常
        handleUnhandledRejection(event) {
            event.preventDefault();
            const error = event.reason;
            console.error('未處理的 Promise 異常:', error);
            
            this.handleSystemError(error instanceof Error ? error : new Error(String(error)));
        }

        // 新增：處理一般未捕獲的異常
        handleUnhandledError(error) {
            console.error('未處理的一般異常:', error);
            this.handleSystemError(error);
        }

        // 系統狀態的靈動初始化
        initializeState() {
            this.state = {
                isAuthenticated: false,
                currentUser: null,
                systemMode: 'production',
                lastActivity: Date.now()
            };
            
            // 初始化核心模組狀態
            const coreModules = ['storage', 'auth', 'modal', 'config'];
            coreModules.forEach(module => {
                this.moduleStatus.set(module, 'pending');
            });
        }

        // 核心事件的優雅綁定
        bindCoreEvents() {
            // 監聽系統活動的靈動脈動
            document.addEventListener('click', () => this.updateLastActivity());
            document.addEventListener('keydown', () => this.updateLastActivity());
            
            // 優雅地處理頁面生命週期
            window.addEventListener('load', () => this.onSystemReady());
            window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        }

        // 當系統準備就緒時的優雅啟動
        async onSystemReady() {
            try {
                // 初始化核心模組
                await this.initializeCore();
                
                // 檢查用戶登入狀態
                await this.checkAuthStatus();
                
                // 設置系統心跳
                this.startHeartbeat();
                
                // 通知系統已準備就緒
                this.emit('systemReady', { timestamp: Date.now() });
                
                console.log('系統核心已優雅綻放');
            } catch (error) {
                console.error('系統初始化時遇到優雅的迷失:', error);
                this.handleSystemError(error);
            }
        }

        // 初始化系統核心的優雅過程
        async initializeCore() {
            // 加載必要的模組配置
            await this.loadCoreModules();
            
            // 初始化存儲系統
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }

            // 設置系統配置
            this.setSystemConfig();

            // 新增：初始化模組載入狀態追蹤
            this.moduleLoadPromises = new Map();
        }

        // 加載核心模組的靈動過程
        async loadCoreModules() {
            const requiredModules = ['storage', 'auth', 'modal'];
            
            for (const module of requiredModules) {
                try {
                    await this.loadModule(module);
                    this.moduleStatus.set(module, true);
                } catch (error) {
                    console.error(`模組 ${module} 的優雅載入失敗:`, error);
                    this.moduleStatus.set(module, false);
                }
            }
        }

        // 檢查登入狀態的優雅詩篇
        async checkAuthStatus() {
            const session = window.storageManager?.getUserSession();
            
            if (session) {
                this.state.isAuthenticated = true;
                this.state.currentUser = session.username;
                this.emit('authStateChanged', { isAuthenticated: true });
            } else {
                this.showLoginForm();
            }
        }

        // 優雅的心跳機制
        startHeartbeat() {
            setInterval(() => {
                this.checkSystemHealth();
            }, 30000); // 每30秒的優雅脈動
        }

        // 系統健康檢查的靈動韻律
        checkSystemHealth() {
            const now = Date.now();
            const inactiveTime = now - this.state.lastActivity;
            
            // 檢查系統活躍狀態
            if (inactiveTime > 3600000) { // 1小時的優雅靜默
                this.handleInactivity();
            }
            
            // 檢查模組健康狀態
            this.moduleStatus.forEach((status, module) => {
                if (!status) {
                    this.handleModuleFailure(module);
                }
            });
        }

        // 處理系統閒置的優雅方式
        handleInactivity() {
            this.emit('systemInactive', {
                lastActivity: this.state.lastActivity,
                currentTime: Date.now()
            });

            // 顯示優雅的提示
            window.modalModule?.alert({
                title: '系統提示',
                message: '因長時間未操作，系統將在1分鐘後自動登出',
                buttonText: '繼續使用'
            }).then(() => {
                this.updateLastActivity();
            });
        }

        // 處理模組故障的優雅方案
        handleModuleFailure(module) {
            console.error(`模組 ${module} 的優雅運行受阻`);
            
            // 嘗試優雅地重新加載模組
            this.loadModule(module).catch(error => {
                this.emit('moduleFailure', { module, error });
            });
        }

        // 更新最後活動時間的靈動記錄
        updateLastActivity() {
            this.state.lastActivity = Date.now();
        }

        // 展示登入表單的優雅畫面
        showLoginForm() {
            const loginContainer = document.getElementById('loginContainer');
            const mainSystem = document.getElementById('mainSystem');
            
            if (loginContainer && mainSystem) {
                loginContainer.style.display = 'block';
                mainSystem.style.display = 'none';
            }
        }

        // 展示主系統的優雅畫面
        showMainSystem() {
            const loginContainer = document.getElementById('loginContainer');
            const mainSystem = document.getElementById('mainSystem');
            
            if (loginContainer && mainSystem) {
                loginContainer.style.display = 'none';
                mainSystem.style.display = 'block';
            }
        }

        // 事件發送的優雅機制
        emit(eventName, data) {
            const event = new CustomEvent(eventName, { detail: data });
            document.dispatchEvent(event);
        }

        // 系統錯誤映射的優雅詩篇
        errorMap = {
            'MODULE_NOT_FOUND': '系統模組載入失敗，請檢查網絡連接',
            'STORAGE_ERROR': '資料存取發生錯誤，請重新整理頁面',
            'AUTH_ERROR': '認證狀態異常，請重新登入',
            'NETWORK_ERROR': '網絡連接不穩定，請檢查網絡狀態',
            'PERMISSION_DENIED': '您沒有權限執行此操作',
            'VALIDATION_ERROR': '輸入資料格式不正確，請檢查後重試',
            'SESSION_EXPIRED': '登入已過期，請重新登入',
            'SERVER_ERROR': '伺服器暫時無法回應，請稍後再試',
            'UNKNOWN_ERROR': '系統遇到了未知問題，請稍後再試'
        };

        // 錯誤訊息轉換的優雅方法
        getErrorMessage(error) {
            // 處理標準錯誤物件
            if (error instanceof Error) {
                return this.errorMap[error.code] || error.message;
            }

            // 處理自定義錯誤代碼
            if (typeof error === 'string') {
                return this.errorMap[error] || error;
            }

            // 處理錯誤物件
            if (error.code) {
                return this.errorMap[error.code] || error.message;
            }

            return this.errorMap['UNKNOWN_ERROR'];
        }

        // 改進的錯誤處理機制
        handleSystemError(error) {
            console.error('系統錯誤:', {
                message: error.message || String(error),
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // 獲取友善的錯誤提示
            const errorMessage = this.getErrorMessage(error);
            
            // 顯示優雅的錯誤提示
            window.modalModule?.alert({
                title: '系統提示',
                message: errorMessage,
                buttonText: '確定',
                type: this.getErrorType(error)
            });
            
            // 記錄錯誤供後續分析
            this.logError(error);
            
            // 發送錯誤事件
            this.emit('systemError', { 
                error,
                message: errorMessage,
                timestamp: Date.now() 
            });
        }

        // 判斷錯誤類型的優雅方法
        getErrorType(error) {
            if (error.code?.includes('AUTH_')) return 'auth';
            if (error.code?.includes('NETWORK_')) return 'network';
            if (error.code?.includes('STORAGE_')) return 'storage';
            return 'general';
        }

        // 錯誤記錄的優雅實現
        logError(error) {
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: error.message || error,
                code: error.code,
                stack: error.stack,
                userAgent: navigator.userAgent,
                currentUser: this.state.currentUser
            };

            // 儲存錯誤記錄
            try {
                const logs = JSON.parse(localStorage.getItem('system_error_logs') || '[]');
                logs.push(errorLog);
                localStorage.setItem('system_error_logs', JSON.stringify(logs.slice(-50)));
            } catch (e) {
                console.error('錯誤記錄儲存失敗:', e);
            }
        }

        // 處理頁面關閉的優雅方式
        handleBeforeUnload(event) {
            // 檢查是否需要保存未完成的操作
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = '';
            }
        }

        // 檢查未保存更改的優雅方法
        hasUnsavedChanges() {
            // 實現檢查邏輯
            return false;
        }

        // 改進模組加載邏輯
        loadModule(moduleName) {
            return new Promise((resolve, reject) => {
                if (this.moduleStatus.get(moduleName) === 'loaded') {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = `./js/${moduleName}.js`;
                script.type = 'text/javascript';
                
                script.onload = () => {
                    this.moduleStatus.set(moduleName, 'loaded');
                    console.log(`模組 ${moduleName} 載入完成`);
                    resolve();
                };
                
                script.onerror = (error) => {
                    this.moduleStatus.set(moduleName, 'error');
                    console.error(`模組 ${moduleName} 載入失敗:`, error);
                    reject(new Error(`無法載入模組 ${moduleName}`));
                };

                document.head.appendChild(script);
            });
        }

        // 檢查模組載入狀態的優雅方法
        isModuleLoaded(moduleName) {
            return this.moduleStatus.get(moduleName) || false;
        }

        // 改進模組加載機制
        async loadModules() {
            const moduleLoadOrder = [
                'utils',
                'storage',
                'modal',
                'entry',
                'records',
                'tickets',
                'expenses',
                'stats',
                'settings'
            ];

            for (const moduleName of moduleLoadOrder) {
                try {
                    await this.loadModule(moduleName);
                    console.log(`模組 ${moduleName} 載入成功`);
                } catch (error) {
                    this.handleModuleError(moduleName, error);
                }
            }
        }

        // 新增：處理模組載入錯誤
        handleModuleError(moduleName, error) {
            const errorInfo = {
                module: moduleName,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            console.error(`模組 ${moduleName} 載入失敗:`, errorInfo);
            this.emit('moduleLoadError', errorInfo);
        }
    }

    // 確保系統核心類別全域可用
    window.SystemCore = SystemCore;
    
    // 初始化系統核心實例
    if (!window.systemCore) {
        window.systemCore = new SystemCore();
        console.log('系統核心已初始化');
    }
})();