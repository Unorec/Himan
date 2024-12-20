// 定義存儲鍵名
const STORAGE_KEYS = {
    ENTRIES: 'himan_entries',
    SETTINGS: 'himan_settings',
    USER_SESSION: 'himan_session',
    SYSTEM_CONFIG: 'himan_config'
};

// 修改默認設定
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
            days: [1, 2, 3, 4],  // 週一到週四
            description: '平日晚間優惠時段 (限制使用至隔日6點)'
        },
        weekendEvening: {
            name: '假日晚間優惠',
            price: 500,
            startTime: '18:30',
            endTime: '19:30',
            maxStayTime: '06:00', // 隔天早上6點
            days: [5, 6, 0],     // 週五、六、日
            description: '假日晚間優惠時段 (限制使用至隔日6點)'
        }
    },
    maxStayHours: 24,        // 最長停留時間
    lockerCount: 300,        // 櫃位總數
    lastBackup: null         // 最後備份時間
};

// 修改為全域變數，確保其他模組可以存取
window.defaultSettings = DEFAULT_SETTINGS;

// 資料管理類
class StorageManager {
    constructor() {
        this.isInitialized = false;
        this.initPromise = null;
    }

    // 初始化本地存儲
    async initLocalStorage() {
        try {
            // 檢查 localStorage 是否可用
            if (!window.localStorage) {
                throw new Error('LocalStorage 不可用');
            }

            // 初始化必要的存儲項目
            if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
            }

            if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
                localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
            }

            return true;
        } catch (error) {
            console.error('LocalStorage initialization error:', error);
            throw error;
        }
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve) => {
            try {
                await this.initLocalStorage();
                this.isInitialized = true;
                console.log('Storage system initialized');
                resolve(true);
            } catch (error) {
                console.error('Storage initialization error:', error);
                this.isInitialized = false;
                resolve(false);
            }
        });

        return this.initPromise;
    }

    async initialize() {
        try {
            // 檢查必要依賴
            if (!window.defaultSettings) {
                throw new Error('系統設定未載入');
            }

            await this.initializeStorage();
            this.isInitialized = true;
            console.log('Storage manager initialized');
        } catch (error) {
            console.error('StorageManager initialization failed:', error);
            // 使用 window.showToast 而不是直接使用 showToast
            if (window.showToast) {
                window.showToast('儲存系統初始化失敗', 'error');
            }
            throw error;
        }
    }

    async initializeStorage() {
        try {
            // 確保存在預設設定
            const settings = this.getSettings();
            if (!settings) {
                localStorage.setItem('settings', JSON.stringify(window.defaultSettings));
            }
        } catch (error) {
            console.error('Storage initialization error:', error);
            throw error;
        }
    }

    // 儲存入場記錄
    saveEntries(entries) {
        try {
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.error('Save entries error:', error);
            showToast('儲存記錄失敗', 'error');
            return false;
        }
    }

    // 取得入場記錄
    getEntries() {
        try {
            const entries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
            return entries ? JSON.parse(entries) : null;
        } catch (error) {
            console.error('Get entries error:', error);
            return null;
        }
    }

    // 新增單筆入場記錄
    addEntry(entry) {
        try {
            if (!entry || !entry.lockerNumber) {
                console.error('Invalid entry data:', entry);
                return false;
            }

            const entries = this.getEntries() || [];
            
            // 檢查櫃位是否已被使用
            if (entries.some(e => 
                e.lockerNumber === entry.lockerNumber && 
                ['active', 'temporary'].includes(e.status)
            )) {
                showToast('此櫃位已被使用中', 'error');
                return false;
            }

            // 檢查特殊時段
            const settings = this.getSettings();
            const timeSlotCheck = isSpecialTimeSlot(new Date(entry.entryTime), settings);
            
            // 更新入場記錄資料
            entry.isSpecialTime = timeSlotCheck.isSpecial;
            entry.amount = timeSlotCheck.price;
            
            if (timeSlotCheck.isSpecial) {
                entry.specialTimeInfo = {
                    name: timeSlotCheck.name,
                    maxStayTime: timeSlotCheck.maxStayTime,
                    description: timeSlotCheck.description
                };
            }

            // 如果是票券，設定24小時
            if (entry.paymentType === 'ticket') {
                entry.hours = 24;
                const endTime = new Date(entry.entryTime);
                endTime.setHours(endTime.getHours() + 24);
                entry.expectedEndTime = endTime.toISOString();
            }

            entries.push(entry);
            return this.saveEntries(entries);
        } catch (error) {
            console.error('Add entry error:', error);
            return false;
        }
    }

    isSpecialTimeSlot(date) {
        try {
            const settings = this.getSettings() || DEFAULT_SETTINGS;
            if (!settings.specialTimeSlot) {
                settings.specialTimeSlot = DEFAULT_SETTINGS.specialTimeSlot;
                this.saveSettings(settings);
            }

            const hour = date.getHours();
            const minute = date.getMinutes();
            const time = hour * 100 + minute;
            
            const startTime = this.parseTimeString(settings.specialTimeSlot.start);
            const endTime = this.parseTimeString(settings.specialTimeSlot.end);
            
            return time >= startTime && time <= endTime;
        } catch (error) {
            console.error('Error checking special time slot:', error);
            return false;
        }
    }

    // 添加時間字串解析輔助函數
    parseTimeString(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
    }

    // 更新單筆入場記錄
    updateEntry(entryId, updatedData) {
        try {
            const entries = this.getEntries() || [];
            const index = entries.findIndex(entry => entry.id === entryId);
            
            if (index !== -1) {
                entries[index] = { ...entries[index], ...updatedData };
                return this.saveEntries(entries);
            }
            return false;
        } catch (error) {
            console.error('Update entry error:', error);
            return false;
        }
    }

    // 儲存設定
    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Save settings error:', error);
            return false;
        }
    }

    // 取得設定
    getSettings() {
        try {
            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            // 使用 window.defaultSettings 替代 defaultSettings
            return settings ? JSON.parse(settings) : window.defaultSettings;
        } catch (error) {
            console.error('Get settings error:', error);
            return window.defaultSettings;
        }
    }

    // 儲存使用者session
    saveUserSession(userData) {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify({
                ...userData,
                timestamp: new Date().getTime()
            }));
            return true;
        } catch (error) {
            console.error('Save user session error:', error);
            return false;
        }
    }

    // 取得使用者session
    getUserSession() {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
            if (!session) return null;

            const sessionData = JSON.parse(session);
            // 檢查 session 是否過期（預設24小時）
            if (new Date().getTime() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
                this.clearUserSession();
                return null;
            }

            return sessionData;
        } catch (error) {
            console.error('Get user session error:', error);
            return null;
        }
    }

    // 清除使用者session
    clearUserSession() {
        try {
            localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
            return true;
        } catch (error) {
            console.error('Clear user session error:', error);
            return false;
        }
    }

    // 資料備份功能
    createBackup() {
        try {
            const backupData = {
                entries: this.getEntries(),
                settings: this.getSettings(),
                timestamp: new Date().toISOString()
            };

            // 創建備份檔案
            const blob = new Blob([JSON.stringify(backupData, null, 2)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // 下載備份檔案
            const a = document.createElement('a');
            a.href = url;
            a.download = `himan_backup_${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // 更新最後備份時間
            const settings = this.getSettings();
            settings.lastBackup = new Date().toISOString();
            this.saveSettings(settings);

            return true;
        } catch (error) {
            console.error('Create backup error:', error);
            return false;
        }
    }

    // 還原備份
    async restoreFromBackup(file) {
        try {
            const fileContent = await this.readBackupFile(file);
            const backupData = JSON.parse(fileContent);

            // 驗證備份資料格式
            if (!this.validateBackupData(backupData)) {
                throw new Error('無效的備份檔案格式');
            }

            // 還原資料
            this.saveEntries(backupData.entries);
            this.saveSettings(backupData.settings);

            return true;
        } catch (error) {
            console.error('Restore backup error:', error);
            throw error;
        }
    }

    // 讀取備份檔案
    readBackupFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // 驗證備份資料格式
    validateBackupData(data) {
        return data 
            && Array.isArray(data.entries)
            && typeof data.settings === 'object'
            && data.timestamp;
    }

    // 清除所有資料（用於測試）
    clearAllData() {
        if (confirm('確定要清除所有資料嗎？此操作無法復原！')) {
            try {
                Object.values(STORAGE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
                this.initializeStorage();
                return true;
            } catch (error) {
                console.error('Clear all data error:', error);
                return false;
            }
        }
        return false;
    }

    validateEntry(entry) {
        return (
            entry &&
            typeof entry === 'object' &&
            entry.lockerNumber >= 1 &&
            entry.lockerNumber <= 300 &&
            entry.id &&
            entry.entryTime &&
            ['active', 'temporary', 'completed'].includes(entry.status) &&
            (
                (entry.paymentType === 'cash' && typeof entry.amount === 'number') ||
                (entry.paymentType === 'ticket' && entry.ticketNumber)
            )
        );
    }
}

// 修改特殊時段檢查函數
function isSpecialTimeSlot(date, settings) {
    try {
        const currentHour = date.getHours();
        const currentMinute = date.getMinutes();
        const currentDay = date.getDay(); // 0-6, 0 是星期日
        
        // 取得時段設定
        const timeSlots = settings.timeSlots || {};
        
        // 檢查每個優惠時段
        for (const [key, slot] of Object.entries(timeSlots)) {
            // 檢查是否為該時段的適用日
            if (!slot.days.includes(currentDay)) {
                continue;
            }
            
            // 解析時間
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            // 將當前時間轉換為分鐘以便比較
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;
            
            // 檢查是否在時間範圍內
            if (currentTimeInMinutes >= startTimeInMinutes && 
                currentTimeInMinutes <= endTimeInMinutes) {
                return {
                    isSpecial: true,
                    price: slot.price,
                    maxStayTime: slot.maxStayTime,
                    name: slot.name,
                    description: slot.description
                };
            }
        }
        
        return {
            isSpecial: false,
            price: settings.basePrice
        };
    } catch (error) {
        console.error('Error checking special time slot:', error);
        // 發生錯誤時返回預設價格
        return {
            isSpecial: false,
            price: settings.basePrice || 500
        };
    }
}

// 確保初始化順序
window.defaultSettings = DEFAULT_SETTINGS;
window.storageManager = new StorageManager();
window.storageManager.init().catch(console.error);