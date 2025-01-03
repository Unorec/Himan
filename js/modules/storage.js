window.HimanSystem = window.HimanSystem || {};

class Storage extends window.HimanSystem.Module {
    constructor() {
        super();
        this.prefix = 'himan_';
        this.cache = new Map();
        this.quotaLimit = 5 * 1024 * 1024; // 5MB
    }

    async moduleSetup() {
        await this.checkQuota();
        this.startPeriodicCleanup();
    }

    async setItem(key, value, options = {}) {
        const fullKey = this.prefix + key;
        try {
            const serialized = JSON.stringify(value);
            if (await this.checkQuota(serialized.length)) {
                localStorage.setItem(fullKey, serialized);
                this.cache.set(fullKey, {
                    data: value,
                    expires: Date.now() + (options.ttl || 300000)
                });
                this.emit('storage:set', { key, success: true });
            }
        } catch (error) {
            this.emit('storage:error', { key, error });
            throw error;
        }
    }

    async getItem(key, options = {}) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.cache.has(fullKey)) {
                const cached = this.cache.get(fullKey);
                if (Date.now() < cached.expires) {
                    return cached.data;
                }
                this.cache.delete(fullKey);
            }

            const item = localStorage.getItem(fullKey);
            if (item) {
                const parsed = JSON.parse(item);
                this.cache.set(fullKey, {
                    data: parsed,
                    expires: Date.now() + (options.ttl || 300000)
                });
                return parsed;
            }
        } catch (error) {
            this.emit('storage:error', { key, error });
            throw error;
        }
        return null;
    }

    async batchSet(items) {
        return Promise.all(
            items.map(({key, value, options}) => this.setItem(key, value, options))
        );
    }

    async batchGet(keys) {
        return Promise.all(
            keys.map(key => this.getItem(key))
        );
    }

    removeItem(key) {
        const fullKey = this.prefix + key;
        try {
            localStorage.removeItem(fullKey);
            this.cache.delete(fullKey);
            this.emit('storage:removed', { key });
        } catch (error) {
            this.emit('storage:error', { key, error });
            throw error;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            this.cache.clear();
            this.emit('storage:cleared');
        } catch (error) {
            this.emit('storage:error', { error });
            throw error;
        }
    }

    async checkQuota(newDataSize = 0) {
        try {
            const usage = await this.getStorageUsage();
            return (usage + newDataSize) <= this.quotaLimit;
        } catch (error) {
            this.emit('storage:quota_error', { error });
            return false;
        }
    }

    async getStorageUsage() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        }
        return total;
    }

    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, 60000); // 每分鐘清理
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now > value.expires) {
                this.cache.delete(key);
            }
        }
    }
}

window.HimanSystem.storage = new Storage();
window.HimanSystem.core.registerModule('storage', window.HimanSystem.storage);
