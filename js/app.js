import storageModule from './modules/storage.js';
import settingsModule from './modules/settings.js';
import { Module } from './core/system.js';
import { system } from './core/system.js';

class App {
    constructor() {
        this.modules = new Map();
        this.system = system;
        this.initializeModules();
    }

    initializeModules() {
        // 檢查模組是否已經註冊
        if (!system.getModule('storage')) {
            this.registerModule('storage', storageModule);
        }
        if (!system.getModule('settings')) {
            this.registerModule('settings', settingsModule);
        }
    }

    registerModule(name, instance) {
        if (!(instance instanceof Module)) {
            throw new Error(`${name} 必須是 Module 的實例`);
        }
        // 避免重複註冊
        if (!this.modules.has(name)) {
            this.modules.set(name, instance);
            this.system.registerModule(name, instance);
        }
    }

    async initialize() {
        try {
            // 確保系統核心已初始化
            await this.system.initialize();
            
            // 依序初始化模組，使用正確的方法名稱 initialize()
            for (const [name, module] of this.modules) {
                console.log(`初始化模組: ${name}`);
                await module.initialize();
            }
            
            console.log('應用程式初始化成功');
            this.renderUI();
        } catch (error) {
            console.error('應用程式初始化失敗:', error);
            throw error;
        }
    }

    renderUI() {
        // ...existing code...
    }
}

// 建立應用程式實例
const app = new App();

// 初始化入口
document.addEventListener('DOMContentLoaded', () => {
    app.initialize().catch(error => {
        console.error('系統啟動失敗:', error);
    });
    
    const loadingElement = document.getElementById('loading');
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }

    // 監聽系統初始化完成事件
    system.on('system:initialized', () => {
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    });
});

export default app;
