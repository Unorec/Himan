import { Module } from '../core/system.js';

class SettingsModule extends Module {
    constructor() {
        super();
        this.settings = new Map();
    }

    async moduleSetup() {
        // 載入設定
        await this.loadSettings();
    }

    async loadSettings() {
        const storage = this.getModule('storage');
        const savedSettings = await storage.getItem('settings');
        if (savedSettings) {
            Object.entries(savedSettings).forEach(([key, value]) => {
                this.settings.set(key, value);
            });
        }
    }
}

const settingsModule = new SettingsModule();
window.HimanSystem.core.registerModule('settings', settingsModule);
export default settingsModule;