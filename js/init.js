import { system } from './core/system.js';

// 註冊核心模組
system.registerModule('core', system);

// 依序載入所有必要模組
import './modules/settings.js'; // 依賴 storage
import './modules/entry.js';    // 依賴 auth 和 settings

async function initializeSystem() {
    try {
        // 先初始化核心系統
        await system.initialize();

        // 按照依賴順序初始化
        const initOrder = ['storage', 'auth', 'settings', 'entry'];
        for (const moduleName of initOrder) {
            const module = system.getModule(moduleName);
            if (module) {
                try {
                    await module.initialize();
                    console.log(`模組 ${moduleName} 初始化完成`);
                } catch (error) {
                    console.error(`模組 ${moduleName} 初始化失敗:`, error);
                    throw error;
                }
            }
        }

        // 觸發系統初始化完成事件
        system.emit('system:initialized');
        console.log('系統初始化完成');
    } catch (error) {
        console.error('系統初始化失敗:', error);
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = `系統載入失敗: ${error.message}`;
            errorMessage.classList.remove('hidden');
        }
    }
}

// 確保 DOM 完全載入後再初始化
document.addEventListener('DOMContentLoaded', initializeSystem);
