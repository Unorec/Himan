// 系統預設設定
const defaultSettings = {
    basePrice: 500,
    maxHours: 24,
    timeSlots: {
        weekdayEvening: {
            name: '平日晚間優惠',
            price: 350,
            startTime: '18:30',
            endTime: '19:30',
            days: [1, 2, 3, 4],
            description: '平日晚間優惠時段'
        },
        weekendEvening: {
            name: '假日晚間優惠',
            price: 500,
            startTime: '18:30',
            endTime: '19:30',
            days: [5, 6, 0],
            description: '假日晚間優惠時段'
        }
    }
};

// 新增優惠時段價格設定
const timeSlotPrices = {
    weekday: {
        regular: 500,    // 平日一般價格
        special: 350     // 平日優惠價格
    },
    weekend: {
        regular: 500,    // 假日一般價格
        special: 500     // 假日優惠價格
    }
};

// 掛載到全域
window.defaultSettings = defaultSettings;

// 修改 settingsModule
window.settingsModule = {
    initialized: false,

    async init() {
        try {
            // 檢查必要的依賴項
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Settings initialization error:', error);
            window.showToast?.('設定初始化失敗', 'error');
            return false;
        }
    },

    async loadSettings() {
        try {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) {
                throw new Error('找不到主要內容區塊');
            }

            const settings = window.storageManager.getSettings();
            
            // 設定頁面的 HTML 內容
            mainContent.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h2>系統設定</h2>
                    </div>
                    <div class="card-body">
                        <form id="settingsForm" onsubmit="window.settingsModule.handleSaveSettings(event)">
                            <div class="settings-group">
                                <h3>基本費率設定</h3>
                                <div class="form-group">
                                    <label for="basePrice">一般入場收費</label>
                                    <div class="input-group">
                                        <input type="number" id="basePrice" name="basePrice" 
                                               value="${settings.basePrice}" min="0" step="50" required>
                                        <span class="unit">元</span>
                                    </div>
                                </div>
                            </div>

                            <div class="settings-group">
                                <h3>系統設定</h3>
                                <div class="form-group">
                                    <label for="maxLockers">櫃位總數</label>
                                    <input type="number" id="maxLockers" name="maxLockers" 
                                           value="${settings.lockerCount}" min="1" max="500">
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="primary-button">儲存設定</button>
                                <button type="button" onclick="settingsModule.resetSettings()" 
                                        class="secondary-button">重設預設值</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            return true;
        } catch (error) {
            console.error('Load settings error:', error);
            window.showToast?.('載入設定失敗', 'error');
            return false;
        }
    },

    async handleSaveSettings(e) {
        e.preventDefault();
        try {
            const form = e.target;
            const settings = window.storageManager.getSettings();

            // 更新基本設定
            settings.basePrice = parseInt(form.basePrice.value);
            settings.lockerCount = parseInt(form.maxLockers.value);

            if (this.validateSettings(settings)) {
                await window.storageManager.saveSettings(settings);
                window.showToast('設定已儲存');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            window.showToast('儲存設定失敗', 'error');
        }
    },

    validateSettings(settings) {
        // 基本驗證
        if (settings.basePrice < 0) {
            window.showToast('基本收費不能小於0', 'error');
            return false;
        }

        if (settings.lockerCount < 1 || settings.lockerCount > 500) {
            window.showToast('櫃位數量必須在 1-500 之間', 'error');
            return false;
        }

        // 優惠時段驗證
        const validateTimeSlot = (slot) => {
            if (slot.price < 0) {
                window.showToast('優惠價格不能小於0', 'error');
                return false;
            }
            return true;
        };

        if (!validateTimeSlot(settings.timeSlots.weekdayEvening) || 
            !validateTimeSlot(settings.timeSlots.weekendEvening)) {
            return false;
        }

        return true;
    },

    async resetSettings() {
        if (confirm('確定要重設為預設值嗎？此操作無法復原。')) {
            try {
                await window.storageManager.saveSettings(window.defaultSettings);
                await this.loadSettings();
                window.showToast('已重設為預設值');
            } catch (error) {
                console.error('Reset settings error:', error);
                window.showToast('重設失敗', 'error');
            }
        }
    }
};

// 修改初始化時機
window.addEventListener('load', async () => {
    try {
        if (!window.settingsModule.initialized) {
            await window.settingsModule.init();
            console.log('Settings module initialized');
        }
    } catch (error) {
        console.error('Settings module initialization error:', error);
    }
});

// 確保模組被正確載入
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.settings = true;
