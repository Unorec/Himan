
class StorageModule extends window.HimanSystem.Module {
    constructor() {
        super();
        this.prefix = 'himan_';
        this._initialized = false;
    }

    async moduleSetup() {
        try {
            // 檢查 localStorage 是否可用
            this._testStorage();
            this._initialized = true;
            console.debug('儲存模組初始化完成');
        } catch (error) {
            console.error('儲存模組初始化失敗:', error);
            throw error;
        }
    }

    _testStorage() {
        const testKey = `${this.prefix}test`;
        try {
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            throw new Error('localStorage 不可用');
        }
    }

    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('儲存資料失敗:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const serializedValue = localStorage.getItem(this.prefix + key);
            return serializedValue ? JSON.parse(serializedValue) : null;
        } catch (error) {
            console.error('讀取資料失敗:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('刪除資料失敗:', error);
            return false;
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
            return true;
        } catch (error) {
            console.error('清除資料失敗:', error);
            return false;
        }
    }
}

// 註冊儲存模組
window.HimanSystem.core.registerModule('storage', new StorageModule());