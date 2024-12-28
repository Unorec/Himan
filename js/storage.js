// 儲存管理器 - 優雅的數據詩篇
window.storageManager = {
    isInitialized: false,

    // 初始化儲存系統
    async init() {
        try {
            // 確保本地儲存可用
            if (!this.isStorageAvailable('localStorage')) {
                throw new Error('本地儲存不可用');
            }

            // 初始化資料結構
            this.initializeDataStructure();
            
            this.isInitialized = true;
            console.log('儲存管理器初始化完成');
            return true;
        } catch (error) {
            console.error('儲存管理器初始化失敗:', error);
            return false;
        }
    },

    // 檢查儲存可用性
    isStorageAvailable(type) {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    },

    // 初始化資料結構
    initializeDataStructure() {
        const initialData = {
            entries: [],
            tickets: [],
            expenses: [],
            settings: {}
        };

        // 初始化每個資料結構
        for (const [key, value] of Object.entries(initialData)) {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
    },

    // 入場記錄相關方法
    async getEntries() {
        try {
            return JSON.parse(localStorage.getItem('entries') || '[]');
        } catch (error) {
            console.error('讀取入場記錄失敗:', error);
            throw error;
        }
    },

    async addEntry(entry) {
        try {
            const entries = await this.getEntries();
            entries.push(entry);
            localStorage.setItem('entries', JSON.stringify(entries));
            this.notifyDataChange('entries');
            return true;
        } catch (error) {
            console.error('新增入場記錄失敗:', error);
            throw error;
        }
    },

    async updateEntry(id, updatedEntry) {
        try {
            const entries = await this.getEntries();
            const index = entries.findIndex(e => e.id === id);
            if (index === -1) throw new Error('找不到指定記錄');
            
            entries[index] = { ...entries[index], ...updatedEntry };
            localStorage.setItem('entries', JSON.stringify(entries));
            this.notifyDataChange('entries');
            return true;
        } catch (error) {
            console.error('更新入場記錄失敗:', error);
            throw error;
        }
    },

    // 票券相關方法
    async getTickets() {
        try {
            return JSON.parse(localStorage.getItem('tickets') || '[]');
        } catch (error) {
            console.error('讀取票券資料失敗:', error);
            throw error;
        }
    },

    async addTicket(ticket) {
        try {
            const tickets = await this.getTickets();
            tickets.push(ticket);
            localStorage.setItem('tickets', JSON.stringify(tickets));
            this.notifyDataChange('tickets');
            return true;
        } catch (error) {
            console.error('新增票券失敗:', error);
            throw error;
        }
    },

    // 支出記錄相關方法
    async getExpenses() {
        try {
            return JSON.parse(localStorage.getItem('expenses') || '[]');
        } catch (error) {
            console.error('讀取支出記錄失敗:', error);
            throw error;
        }
    },

    async addExpense(expense) {
        try {
            const expenses = await this.getExpenses();
            expenses.push(expense);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            this.notifyDataChange('expenses');
            return true;
        } catch (error) {
            console.error('新增支出記錄失敗:', error);
            throw error;
        }
    },

    // 使用者資料相關方法
    async getUserSession() {
        try {
            return JSON.parse(localStorage.getItem('userSession') || 'null');
        } catch (error) {
            console.error('讀取使用者資料失敗:', error);
            throw error;
        }
    },

    async setUserSession(session) {
        try {
            localStorage.setItem('userSession', JSON.stringify(session));
            this.notifyDataChange('userSession');
            return true;
        } catch (error) {
            console.error('設定使用者資料失敗:', error);
            throw error;
        }
    },

    // 設定相關方法
    async getSettings() {
        try {
            return JSON.parse(localStorage.getItem('settings') || '{}');
        } catch (error) {
            console.error('讀取設定失敗:', error);
            throw error;
        }
    },

    async saveSettings(settings) {
        try {
            localStorage.setItem('settings', JSON.stringify(settings));
            this.notifyDataChange('settings');
            return true;
        } catch (error) {
            console.error('儲存設定失敗:', error);
            throw error;
        }
    },

    // 資料變更通知
    notifyDataChange(dataType) {
        window.dispatchEvent(new CustomEvent('dataChanged', {
            detail: { type: dataType }
        }));
    }
};

// 標記模組載入完成
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.storage = true;