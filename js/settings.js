// 設定管理的藝術殿堂
class SettingsManager {
    constructor() {
        this.initialized = false;
        this.version = '1.0.0';
        this.defaultSettings = {
            pricing: {
                regular: {
                    weekday: 500,    // 平日時光的價值
                    weekend: 700     // 週末時光的價值
                },
                special: {
                    weekdayEvening: {
                        price: 350,
                        startTime: '18:30',
                        endTime: '19:30',
                        description: '平日晚間優惠（使用至隔日06:00）'
                    },
                    weekendEvening: {
                        price: 500,
                        startTime: '18:30',
                        endTime: '19:30',
                        description: '假日晚間優惠（使用至隔日06:00）'
                    }
                }
            },
            system: {
                lockerCount: 300,           // 櫃位的優雅容量
                backupInterval: 86400000,   // 備份的靈動週期
                sessionTimeout: 3600000     // 會話的優雅期限
            },
            ui: {
                theme: 'light',             // 介面的視覺詩意
                language: 'zh-TW',          // 語言的文化靈魂
                animation: true             // 動效的靈動之美
            }
        };
    }

    // 系統啟動的優雅序曲
    async init() {
        try {
            // 確保存儲系統的靈感綻放
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }

            await this.migrateSettings();  // 優雅地遷移設定
            this.bindEvents();             // 綁定互動的靈動韻律
            this.initialized = true;        // 標記靈感的綻放
            
            console.log('設定系統的靈感已然綻放');
            return true;
        } catch (error) {
            console.error('設定靈感的迷失:', error);
            return false;
        }
    }

    // 設定遷移的優雅藝術
    async migrateSettings() {
        const currentSettings = await this.getSettings();
        
        if (!currentSettings.version || currentSettings.version !== this.version) {
            const updatedSettings = {
                ...this.defaultSettings,
                ...currentSettings,
                version: this.version
            };
            await this.saveSettings(updatedSettings);
        }
    }

    // 事件綁定的靈動之舞
    bindEvents() {
        // 優雅地處理設定表單
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSettingsSubmit(e);
            });
        }

        // 主題切換的優雅轉場
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                this.toggleTheme();
            });
        }
    }

    // 獲取設定的優雅旋律
    async getSettings() {
        try {
            const settings = await window.storageManager?.getSettings();
            return settings || this.defaultSettings;
        } catch (error) {
            console.error('設定讀取的迷失:', error);
            return this.defaultSettings;
        }
    }

    // 保存設定的精妙藝術
    async saveSettings(settings) {
        try {
            // 優雅地驗證設定
            if (!this.validateSettings(settings)) {
                throw new Error('設定的靈感未能呼應真實');
            }

            // 注入時間的印記
            const timestamp = new Date().toISOString();
            const settingsWithMeta = {
                ...settings,
                lastModified: timestamp,
                version: this.version
            };

            // 優雅地儲存設定
            await window.storageManager?.saveSettings(settingsWithMeta);
            
            // 展現成功的靈動提示
            window.showToast?.('設定已優雅保存');
            
            return true;
        } catch (error) {
            console.error('設定保存的迷失:', error);
            window.showToast?.('設定保存失敗', 'error');
            return false;
        }
    }

    // 驗證設定的嚴謹之美
    validateSettings(settings) {
        // 價格的合理性檢查
        if (settings.pricing?.regular?.weekday < 0 || 
            settings.pricing?.regular?.weekend < 0) {
            return false;
        }

        // 時間設定的優雅驗證
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(settings.pricing?.special?.weekdayEvening?.startTime) ||
            !timeRegex.test(settings.pricing?.special?.weekdayEvening?.endTime)) {
            return false;
        }

        return true;
    }

    // 重置設定的優雅回歸
    async resetToDefault() {
        try {
            const confirmed = await window.modalModule?.confirm({
                title: '重置設定',
                message: '確定要將所有設定重置為預設值嗎？',
                confirmText: '確定重置',
                cancelText: '保持現狀'
            });

            if (confirmed) {
                await this.saveSettings(this.defaultSettings);
                window.showToast?.('設定已優雅重置');
                return true;
            }
            return false;
        } catch (error) {
            console.error('設定重置的迷失:', error);
            return false;
        }
    }

    // 主題切換的視覺詩篇
    toggleTheme() {
        const currentSettings = this.getSettings();
        const newTheme = currentSettings.ui.theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        currentSettings.ui.theme = newTheme;
        
        this.saveSettings(currentSettings);
    }

    // 設定表單處理的優雅韻律
    async handleSettingsSubmit(event) {
        try {
            const formData = new FormData(event.target);
            const newSettings = {};

            // 優雅地轉換表單數據
            for (let [key, value] of formData.entries()) {
                this.setNestedValue(newSettings, key, value);
            }

            // 保存設定的靈動綻放
            await this.saveSettings({
                ...await this.getSettings(),
                ...newSettings
            });

            return true;
        } catch (error) {
            console.error('設定提交的迷失:', error);
            return false;
        }
    }

    // 設定嵌套值的精妙藝術
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    // 導出設定的優雅藝術
    async exportSettings() {
        try {
            const settings = await this.getSettings();
            const blob = new Blob(
                [JSON.stringify(settings, null, 2)],
                { type: 'application/json' }
            );
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `settings_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            
            window.showToast?.('設定已優雅導出');
        } catch (error) {
            console.error('設定導出的迷失:', error);
            window.showToast?.('設定導出失敗', 'error');
        }
    }
}

// 將設定系統優雅地綻放到全域
window.settingsManager = new SettingsManager();

// 當系統甦醒時，啟動設定的靈感
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager.init().catch(console.error);
});