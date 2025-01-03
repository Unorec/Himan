class Core {
    constructor() {
        this.modules = new Map();
        this.cache = new Map(); // 改用 Map 以支援快取清理
        this.events = new Map();
        this.initialized = false;
        this._initPromise = null;
    }

    async initialize() {
        if (this._initPromise) return this._initPromise;
        
        this._initPromise = (async () => {
            if (this.initialized) return true;

            try {
                await this.initializeModules();
                await Promise.all([
                    this.initStorage(),
                    this.initAuth(),
                    this.initUI()
                ]);
                this.initialized = true;
                this.emit('core:initialized');
                return true;
            } catch (error) {
                this.emit('core:error', error);
                throw error;
            }
        })();

        return this._initPromise;
    }

    async initializeModules() {
        const config = window.HimanSystem.config;
        if (!config) {
            throw new Error('系統配置未載入');
        }

        const requiredModules = config.modules.required;
        for (const moduleName of requiredModules) {
            if (!this.modules.has(moduleName)) {
                try {
                    await this.loadModule(moduleName);
                } catch (error) {
                    throw new Error(`載入模組 ${moduleName} 失敗: ${error.message}`);
                }
            }
        }

        for (const [name, module] of this.modules) {
            if (typeof module.initialize === 'function') {
                await module.initialize();
            }
        }
    }

    async loadModule(name) {
        const config = window.HimanSystem.config;
        const path = `${config.paths.components}/${name}.js`;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`無法載入模組: ${path}`));
            document.head.appendChild(script);
        });
    }

    registerModule(name, moduleInstance) {
        if (this.modules.has(name)) {
            console.warn(`模組 ${name} 已存在，返回現有實例`);
            return this.modules.get(name);
        }

        this.modules.set(name, moduleInstance);
        this.emit('module:registered', { name, module: moduleInstance });
        return moduleInstance;
    }

    getModule(name) {
        if (!this.modules.has(name)) {
            throw new Error(`模組 ${name} 不存在`);
        }
        return this.modules.get(name);
    }

    cache(key, data, ttl = 300000) {
        const expires = Date.now() + ttl;
        this.cache.set(key, { data, expires });
        
        // 設定自動清理
        setTimeout(() => {
            this.cache.delete(key);
        }, ttl);
    }

    getCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    emit(event, data) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件處理器錯誤 ${event}:`, error);
                }
            });
        }
    }

    async destroy() {
        for (const [name, module] of this.modules) {
            if (typeof module.destroy === 'function') {
                await module.destroy();
            }
        }
        this.modules.clear();
        this.cache.clear();
        this.events.clear();
        this.initialized = false;
        this._initPromise = null;
    }
}

window.HimanSystem.core = new Core();
