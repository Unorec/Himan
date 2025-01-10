const Storage = {
    // 價格設定
    PRICING: {
        WEEKDAY: 300,
        WEEKEND: 400,
        HOLIDAY: 500
    },

    // 入場記錄的 key 名稱
    KEYS: {
        ENTRY_RECORDS: 'entryRecords'
    },

    // 儲存資料到 localStorage
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('儲存資料失敗:', e);
            return false;
        }
    },

    // 從 localStorage 讀取資料
    load: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('讀取資料失敗:', e);
            return null;
        }
    },

    // 刪除特定資料
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('刪除資料失敗:', e);
            return false;
        }
    },

    // 清除所有資料
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('清除資料失敗:', e);
            return false;
        }
    },

    // 儲存入場記錄
    saveEntryRecord: function(record) {
        const records = this.getEntryRecords() || [];
        records.push(record);
        return this.save(this.KEYS.ENTRY_RECORDS, records);
    },

    // 取得所有入場記錄
    getEntryRecords: function() {
        return this.load(this.KEYS.ENTRY_RECORDS) || [];
    },

    // 更新特定入場記錄
    updateEntryRecord: function(lockerNumber, updatedData) {
        const records = this.getEntryRecords();
        const index = records.findIndex(r => r.lockerNumber === lockerNumber);
        if (index !== -1) {
            records[index] = { ...records[index], ...updatedData };
            return this.save(this.KEYS.ENTRY_RECORDS, records);
        }
        return false;
    }
};
