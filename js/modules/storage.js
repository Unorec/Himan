import { Module } from '../core/module.js';

class StorageModule extends Module {
    constructor() {
        super();
    }

    async moduleSetup() {
        try {
            this._testStorage();
            return true;
        } catch (error) {
            console.error('儲存模組初始化失敗:', error);
            return false;
        }
    }

    _testStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (error) {
            throw new Error('localStorage 不可用');
        }
    }

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('儲存失敗:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('讀取失敗:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('刪除失敗:', error);
            return false;
        }
    }
}

export const storageModule = new StorageModule();
export default storageModule;