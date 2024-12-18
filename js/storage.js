// 定義存儲鍵名
const STORAGE_KEYS = {
    ENTRIES: 'himan_entries',
    SETTINGS: 'himan_settings',
    USER_SESSION: 'himan_session',
    SYSTEM_CONFIG: 'himan_config'
};

// 修改默認設定
const DEFAULT_SETTINGS = {
<<<<<<< Updated upstream
    basePrice: 0,           // 更改基本收費為0
    overtimeRate: 0,        // 更改超時費率為0
=======
    basePrice: 500,           // 基本收費（3小時）
    overtimeRate: 100,        // 超時費率（每小時）
>>>>>>> Stashed changes
    businessHours: {
        start: '08:00',
        end: '22:00'
    },
    maxStayHours: 24,        // 最長停留時間
    lockerCount: 300,        // 櫃位總數
    lastBackup: null         // 最後備份時間
};

// 資料管理類
class StorageManager {
    constructor() {
<<<<<<< Updated upstream
        this.isInitialized = false;
        this.defaultSettings = {
            basePrice: 0,       // 更改基本收費為0
            lockerCount: 300,   // 固定櫃位數量
            maxHours: 24
        };
        this.initialize();
    }

    initialize() {
        try {
            this.initializeStorage();
            this.isInitialized = true;
            console.log('StorageManager initialized successfully');
        } catch (error) {
            console.error('StorageManager initialization failed:', error);
            throw error;
        }
=======
        this.defaultSettings = {
            basePrice: 500,      
            lockerCount: 300,    // 固定櫃位數量
            maxHours: 24
        };
        this.initializeStorage();
>>>>>>> Stashed changes
    }

    // 初始化存儲空間
    initializeStorage() {
        try {
            // 檢查並初始化設定
            if (!this.getSettings()) {
                this.saveSettings(DEFAULT_SETTINGS);
            }

            // 檢查並初始化入場記錄
            if (!this.getEntries()) {
                this.saveEntries([]);
            }

        } catch (error) {
            console.error('Storage initialization error:', error);
            showToast('初始化存儲空間失敗', 'error');
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
            if (!this.validateEntry(entry)) {
                console.error('Invalid entry data:', entry);
                return false;
            }

            const entries = this.getEntries() || [];
            
            // 確保不重複的 ID
            while (entries.some(e => e.id === entry.id)) {
                entry.id = 'E' + Date.now();
            }

            entries.push(entry);
            const result = this.saveEntries(entries);
            
            if (!result) {
                throw new Error('儲存失敗');
            }

            console.log('Entry added successfully:', entry);
            return true;

        } catch (error) {
            console.error('Add entry error:', error);
            return false;
        }
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
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Get settings error:', error);
            return null;
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
<<<<<<< Updated upstream
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
=======
            entry.lockerNumber >= 1 &&
            entry.lockerNumber <= 300 &&  // 修改櫃位範圍檢查
            entry.hours >= 1 &&
            entry.hours <= 24 &&          // 新增時數範圍檢查
            ['active', 'temporary', 'completed'].includes(entry.status)
>>>>>>> Stashed changes
        );
    }
}

<<<<<<< Updated upstream
// 創建並初始化全域實例
window.storageManager = new StorageManager();

// 確保初始化完成
if (!window.storageManager.isInitialized) {
    throw new Error('StorageManager failed to initialize');
}
=======
// 創建全域實例
const storageManager = new StorageManager();

// 導出全域實例
window.storageManager = storageManager;
>>>>>>> Stashed changes
