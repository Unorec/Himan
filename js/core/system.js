// 系統配置
const SystemConfig = {
    modules: {
        required: ['core', 'storage', 'auth', 'entry'],
        optional: ['modal', 'stats']
    },
    paths: {
        js: './js',
        css: './css',
        components: './js/components',
        modules: './js/modules'
    }
};

// 建立全域命名空間
window.HimanSystem = window.HimanSystem || {};

// 整合 Module 類別
export class Module {
    constructor() {
        this._initialized = false;
        this.dependencies = [];
    }

    async init() {
        if (this._initialized) return true;
        this._initialized = true;
        return true;
    }

    getModule(name) {
        return window.HimanSystem?.modules?.[name];
    }

    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }
}

// 整合 Core 類別功能
class Core {
    constructor() {
        this.modules = new Map();
        this.events = new Map();
        this._initialized = false;
    }

    registerModule(name, instance) {
        if (this.modules.has(name)) {
            console.warn(`模組 ${name} 已存在`);
            return;
        }
        this.modules.set(name, instance);
    }

    getModule(name) {
        return this.modules.get(name);
    }

    emit(event, data) {
        const handlers = this.events.get(event) || [];
        handlers.forEach(handler => handler(data));
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(handler);
    }

    checkRequiredModules() {
        const required = SystemConfig.modules.required;
        const missing = required.filter(name => !this.modules.has(name));
        
        if (missing.length > 0) {
            throw new Error(`必要模組未載入: ${missing.join(', ')}`);
        }
        return true;
    }

    async initializeModules() {
        this.checkRequiredModules();
        const initPromises = Array.from(this.modules.values())
            .map(module => module.initialize());
        return Promise.all(initPromises);
    }

    async initialize() {
        if (this._initialized) return;
        
        try {
            await this.moduleSetup();
            this._initialized = true;
            return true;
        } catch (error) {
            console.error('核心系統初始化失敗:', error);
            throw error;
        }
    }

    async moduleSetup() {
        // 核心系統的基礎設置
        return true;
    }
}

// 初始化核心系統
const coreSystem = new Core();
// 確保全域命名空間存在
window.HimanSystem = window.HimanSystem || {};
window.HimanSystem.core = coreSystem;

export { coreSystem as system };


