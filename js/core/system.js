// 先定義系統配置
const SystemConfig = {
    modules: {
        required: ['core', 'toast'],
        optional: ['modal', 'stats']
    },
    paths: {
        js: './js',
        css: './css',
        components: './js/components',
        modules: './js/modules'
    }
};

// 確保全局命名空間
window.HimanSystem = window.HimanSystem || {};
window.HimanSystem.config = SystemConfig;
window.HimanSystem.isReady = false;

class SystemCore {
    constructor() {
        this.modules = new Map();
        this.modulePromises = new Map();
        this._initialized = false;
        this._initPromise = null;
        this.config = window.HimanSystem?.config || {
            modules: {
                required: ['core', 'toast', 'storage'],
                optional: ['modal']
            }
        };
    }

    static getInstance() {
        if (!window.HimanSystem?.core) {
            window.HimanSystem = window.HimanSystem || {};
            window.HimanSystem.core = new SystemCore();
        }
        return window.HimanSystem.core;
    }

    async initialize() {
        if (this._initialized) return this;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            try {
                console.debug('開始系統初始化...');
                
                // 註冊核心
                this.modules.set('core', this);
                
                // 載入必要模組
                const requiredModules = this.config.modules.required.filter(name => name !== 'core');
                for (const name of requiredModules) {
                    if (!this.modules.has(name)) {
                        console.debug(`等待模組 ${name} 註冊...`);
                        await this.waitForModule(name);
                    }
                }
                
                // 初始化已載入的模組
                for (const [name, module] of this.modules.entries()) {
                    if (typeof module.initialize === 'function') {
                        await module.initialize();
                        console.debug(`模組 ${name} 初始化完成`);
                    }
                }
                
                this._initialized = true;
                window.HimanSystem.isReady = true;
                console.debug('系統初始化完成');
                
                // 觸發就緒事件
                window.dispatchEvent(new CustomEvent('systemReady'));
                return this;
            } catch (error) {
                console.error('系統初始化失敗:', error);
                throw error;
            }
        })();

        return this._initPromise;
    }

    async waitForModule(name, timeout = 5000) {
        const start = Date.now();
        
        while (Date.now() - start < timeout) {
            if (this.modules.has(name)) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error(`模組 ${name} 註冊超時`);
    }

    registerModule(name, instance) {
        if (this.modules.has(name)) {
            console.warn(`模組 ${name} 已註冊`);
            return;
        }
        console.debug(`註冊模組: ${name}`);
        this.modules.set(name, instance);
        window.dispatchEvent(new CustomEvent('moduleRegistered', { detail: { name } }));
    }

    getModule(name) {
        return this.modules.get(name);
    }
}

// 新增基礎 Module 類別
class Module {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }

    getModule(name) {
        return window.HimanSystem.core.getModule(name);
    }
}

// 設置核心類別
window.HimanSystem.Module = Module;
window.HimanSystem.core = SystemCore.getInstance();

// 移除多餘的 window.HimanSystem 初始化代碼
const core = SystemCore.getInstance();
core.initialize().catch(error => {
    console.error('系統初始化失敗:', error);
});
