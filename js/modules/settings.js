// 設定管理的藝術殿堂
class SettingsManager extends window.HimanSystem.Module {
    constructor() {
        super();
        this.settings = null;
        this.version = '1.0.0';
    }

    async moduleSetup() {
        try {
            this.storage = window.HimanSystem.core.getModule('storage');
            await this.migrateSettings();
            this.bindEvents();
            return true;
        } catch (error) {
            console.error('設定初始化失敗:', error);
            throw error;
        }
    }

    async migrateSettings() {
        const currentSettings = await this.storage.getItem('settings');
        
        if (!currentSettings?.version || currentSettings.version !== this.version) {
            const updatedSettings = {
                ...this.getDefaultSettings(),
                ...currentSettings,
                version: this.version
            };
            await this.saveSettings(updatedSettings);
        }
    }

    getDefaultSettings() {
        return {
            pricing: {
                regular: {
                    weekday: 500,
                    weekend: 700
                }
            },
            system: {
                lockerCount: 300,
                backupInterval: 86400000,
                sessionTimeout: 3600000
            },
            ui: {
                theme: 'light',
                language: 'zh-TW',
                animation: true
            }
        };
    }

    async saveSettings(settings) {
        if (!this.validateSettings(settings)) {
            throw new Error('設定驗證失敗');
        }
        await this.storage.setItem('settings', {
            ...settings,
            lastModified: new Date().toISOString()
        });
        this.emit('settings:updated', settings);
    }

    validateSettings(settings) {
        // 驗證邏輯
        return true;
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

// 註冊模組
window.HimanSystem.core.registerModule('settings', new SettingsManager());

// 當系統甦醒時，啟動設定的靈感
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager.init().catch(console.error);
});