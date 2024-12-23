// 設定模組
window.settingsModule = {
    initialized: false,

    async init() {
        try {
            // 檢查儲存系統
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Settings initialization error:', error);
            return false;
        }
    },

    getSettings() {
        return window.storageManager?.getSettings() || window.defaultSettings;
    },

    async saveSettings(settings) {
        try {
            return await window.storageManager?.saveSettings(settings);
        } catch (error) {
            console.error('Save settings error:', error);
            return false;
        }
    }
};

// 確保模組載入
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.settings = true;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', async () => {
    await window.settingsModule.init();
});

// 定義入場記錄狀態
const RECORD_STATUS = {
    ACTIVE: {
        code: 'active',
        name: '使用中',
        className: 'status-active',
        color: '#4caf50'
    },
    TEMPORARY_EXIT: {
        code: 'temporary',
        name: '暫時外出',
        className: 'status-temporary',
        color: '#ff9800'
    },
    WARNING: {           // 新增快超時狀態
        code: 'warning',
        name: '即將超時(1小時)',
        className: 'status-warning',
        color: '#ffc107'
    },
    NEAR_EXPIRY: {
        code: 'nearExpiry',
        name: '即將超時(30分)',
        className: 'status-near-expiry',
        color: '#f44336'
    },
    OVERTIME: {
        code: 'overtime',
        name: '已超時',
        className: 'status-overtime',
        color: '#d32f2f'
    },
    UNPAID: {
        code: 'unpaid',
        name: '未結消費',
        className: 'status-unpaid',
        color: '#e91e63'
    },
    COMPLETED: {
        code: 'completed',
        name: '已結束',
        className: 'status-completed',
        color: '#9e9e9e'
    }
};

// 定義付款類型
const PAYMENT_TYPES = {
    CASH: {
        code: 'cash',
        name: '現金'
    },
    TICKET: {
        code: 'ticket',
        name: '票券'
    },
    CARD: {
        code: 'card',
        name: '刷卡'
    }
};

// 定義票券類型
const TICKET_TYPES = {
    REGULAR: {
        code: 'regular',
        name: '平日券',
        hours: 24
    },
    UNLIMITED: {
        code: 'unlimited',
        name: '暢遊券',
        hours: 24
    },
    EVENT: {
        code: 'event',
        name: '優惠券',
        hours: 24
    }
};

// 修改時段設定
const DEFAULT_SETTINGS = {
    basePrice: 500,           // 更改基本收費為500
    overtimeRate: 0,        // 更改超時費率為0
    businessHours: {
        start: '08:00',
        end: '22:00'
    },
    timeSlots: {
        weekdayEvening: {
            name: '平日晚間優惠',
            price: 350,
            startTime: '18:30',
            endTime: '19:30',
            maxStayTime: '06:00', // 隔天早上6點
            days: [1, 2, 3, 4, 5],  // 週一到週五
            description: '平日晚間優惠時段 (限制使用至隔日6點)'
        },
        weekendEvening: {
            name: '假日晚間優惠',
            price: 500,
            startTime: '18:30',
            endTime: '19:30',
            maxStayTime: '06:00', // 隔天早上6點
            days: [0, 6],     // 週六、週日
            description: '假日晚間優惠時段 (限制使用至隔日6點)'
        }
    },
    maxStayHours: 24,        // 最長停留時間
    lockerCount: 300,        // 櫃位總數
    lastBackup: null         // 最後備份時間
};

// 擴展 settingsModule
window.settingsModule = {
    initialized: false,

    async init() {
        try {
            // 檢查儲存系統
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Settings initialization error:', error);
            return false;
        }
    },

    getSettings() {
        return window.storageManager?.getSettings() || window.defaultSettings;
    },

    async saveSettings(settings) {
        try {
            return await window.storageManager?.saveSettings(settings);
        } catch (error) {
            console.error('Save settings error:', error);
            return false;
        }
    },
    RECORD_STATUS,
    PAYMENT_TYPES,
    TICKET_TYPES,
    
    // 檢查記錄狀態的輔助函數
    getRecordStatus(record) {
        if (!record) return RECORD_STATUS.COMPLETED;
        
        // 檢查是否已結束
        if (record.status === 'completed') return RECORD_STATUS.COMPLETED;
        
        // 檢查是否暫時外出
        if (record.status === 'temporary') return RECORD_STATUS.TEMPORARY_EXIT;
        
        // 檢查是否有未結消費
        if (record.unpaidCharges?.length > 0) return RECORD_STATUS.UNPAID;
        
        // 檢查是否超時或即將超時
        const now = new Date();
        const entryTime = new Date(record.entryTime);
        const endTime = new Date(entryTime.getTime() + record.hours * 60 * 60 * 1000);
        const timeDiff = endTime - now;
        
        if (timeDiff < 0) {
            return RECORD_STATUS.OVERTIME;
        }
        
        // 剩餘30分鐘內
        if (timeDiff <= 30 * 60 * 1000) {
            return RECORD_STATUS.NEAR_EXPIRY;
        }
        
        // 剩餘1小時內
        if (timeDiff <= 60 * 60 * 1000) {
            return RECORD_STATUS.WARNING;
        }
        
        return RECORD_STATUS.ACTIVE;
    },

    // 新增取得當前可用優惠時段函數
    getCurrentTimeSlot() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const settings = this.getSettings();
        for (const [key, slot] of Object.entries(settings.timeSlots)) {
            // 檢查是否為該時段的適用日
            if (!slot.days.includes(currentDay)) continue;

            // 解析時間
            const [startHour, startMin] = slot.startTime.split(':').map(Number);
            const [endHour, endMin] = slot.endTime.split(':').map(Number);
            const slotStartTime = startHour * 100 + startMin;
            const slotEndTime = endHour * 100 + endMin;

            // 檢查是否在時間範圍內
            if (currentTime >= slotStartTime && currentTime <= slotEndTime) {
                return {
                    key,
                    ...slot
                };
            }
        }
        return null;
    },

    // 計算優惠時段結束時間
    calculateTimeSlotEndTime(timeSlot) {
        const now = new Date();
        const endTime = new Date(now);
        
        // 解析 maxStayTime
        const [hours, minutes] = timeSlot.maxStayTime.split(':').map(Number);
        
        if (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())) {
            // 如果結束時間在隔天
            endTime.setDate(endTime.getDate() + 1);
        }
        
        endTime.setHours(hours, minutes, 0, 0);
        
        return endTime;
    }
};

// 將狀態常量掛載到全域
window.RECORD_STATUS = RECORD_STATUS;
window.PAYMENT_TYPES = PAYMENT_TYPES;
window.TICKET_TYPES = TICKET_TYPES;
