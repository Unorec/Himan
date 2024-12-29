(function() {
    'use strict';

    class SystemCore {
        constructor() {
            if (window.systemCore) {
                return window.systemCore;
            }
            
            this.modules = {};
            this.initialized = false;
            window.systemCore = this;
        }

        async initialize() {
            if (this.initialized) return;
            
            try {
                console.log('初始化系統核心...');
                
                // 初始化基礎模組
                this.modules = {
                    auth: null,
                    modal: null,
                    toast: null
                };

                this.initialized = true;
                console.log('系統核心初始化完成');
                return true;
            } catch (error) {
                console.error('系統核心初始化失敗:', error);
                return false;
            }
        }

        async loadRequiredModules() {
            try {
                await Promise.all([
                    this.loadModule('auth'),
                    this.loadModule('modal'),
                    this.loadModule('toast')
                ]);
                return true;
            } catch (error) {
                console.error('載入必要模組失敗:', error);
                return false;
            }
        }

        async loadModule(moduleName) {
            if (this.modules[moduleName]) {
                return this.modules[moduleName];
            }

            try {
                if (window.HimanSystem?.modules?.[moduleName]) {
                    this.modules[moduleName] = window.HimanSystem.modules[moduleName];
                    return this.modules[moduleName];
                }
                console.log(`載入模組: ${moduleName}`);
                return true;
            } catch (error) {
                console.error(`載入模組 ${moduleName} 失敗:`, error);
                return false;
            }
        }
    }

    // 重構全域命名空間初始化
    const ModuleManager = {
        // 使用 Map 來儲存模組
        _modules: new Map(),
        _cache: new Map(),
        
        register(name, ModuleClass) {
            if (!this._modules.has(name)) {
                this._modules.set(name, ModuleClass);
            }
            return this._modules.get(name);
        },

        clearCache() {
            this._cache.clear();
        },

        getInstance(name) {
            // 先檢查快取
            if (this._cache.has(name)) {
                return this._cache.get(name);
            }

            // 若無快取則建立新實例
            const ModuleClass = this._modules.get(name);
            if (ModuleClass) {
                const instance = new ModuleClass();
                this._cache.set(name, instance);
                return instance;
            }

            return null;
        },

        // 檢查模組是否已載入
        hasModule(name) {
            return this._modules.has(name);
        },

        // 檢查快取狀態
        getCacheStatus() {
            return {
                moduleCount: this._modules.size,
                cacheCount: this._cache.size
            };
        }
    };

    window.HimanSystem = {
        modules: ModuleManager._modules,
        ModuleManager: ModuleManager
    };

    // 導出 SystemCore 類別
    window.SystemCore = SystemCore;
})();