// 定義存儲鍵名
const STORAGE_KEYS = {
    ENTRIES: 'himan_entries',
    SETTINGS: 'himan_settings',
    USER_SESSION: 'himan_user_session',
    SYSTEM_CONFIG: 'himan_config'
};

// 修改默認設定
const DEFAULT_SETTINGS = {
    basePrice: 500,           // 更改基本收費為500
    overtimeRate: 0,        // 更改超時費率為0
    overtimeMinCharge: 0,   // 新增：最低超時費用為 0
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
        },
        overtime: {
            name: '現金票券',
            price: 0,
            allowZero: true,  // 允許輸入 0 元
            isOvertime: true,
            description: '現金延長'
        }
    },
    maxStayHours: 24,        // 最長停留時間
    lockerCount: 300,        // 櫃位總數
    lastBackup: null         // 最後備份時間
};

// 修改為全域變數，確保其他模組可以存取
window.defaultSettings = DEFAULT_SETTINGS;


// 建立儲存管理類別
class StorageManager {
    constructor() {
        this.isInitialized = false;
        this.STORAGE_KEYS = {
            ENTRIES: 'himan_entries',
            SETTINGS: 'himan_settings',
            USER_SESSION: 'himan_user_session',
            SYSTEM_CONFIG: 'himan_config',
            TICKETS: 'himan_tickets'  // 添加票券存儲鍵
        };
    }

    // 初始化儲存系統
    async init() {
        try {
            // 確保本地儲存可用
            if (typeof localStorage === 'undefined') {
                throw new Error('本地儲存不可用');
            }

            // 初始化必要的儲存空間
            if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
                localStorage.setItem(STORAGE_KEYS.ENTRIES, '[]');
            }

            if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
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
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
            }

            // 初始化票券存儲
            if (!localStorage.getItem(this.STORAGE_KEYS.TICKETS)) {
                localStorage.setItem(this.STORAGE_KEYS.TICKETS, '[]');
            }

            this.isInitialized = true;
            console.log('儲存系統初始化完成');
            return true;

        } catch (error) {
            console.error('儲存系統初始化失敗:', error);
            return false;
        }
    }

    // 取得所有入場記錄
    getEntries() {
        try {
            const entries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
            return entries ? JSON.parse(entries) : [];
        } catch (error) {
            console.error('讀取入場記錄失敗:', error);
            return [];
        }
    }

    // 新增入場記錄
    addEntry(entry) {
        try {
            const entries = this.getEntries();
            entries.push(entry);
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.error('新增入場記錄失敗:', error);
            return false;
        }
    }

    // 更新入場記錄
    updateEntry(entryId, updatedEntry) {
        try {
            const entries = this.getEntries();
            const index = entries.findIndex(entry => entry.id === entryId);
            if (index === -1) {
                throw new Error('找不到指定的入場記錄');
            }
            entries[index] = updatedEntry;
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.error('更新入場記錄失敗:', error);
            return false;
        }
    }

    // 取得系統設定
    getSettings() {
        try {
            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('讀取設定失敗:', error);
            return null;
        }
    }

    // 儲存系統設定
    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('儲存設定失敗:', error);
            return false;
        }
    }

    // 儲存使用者會話
    saveUserSession(session) {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
            return true;
        } catch (error) {
            console.error('儲存使用者會話失敗:', error);
            return false;
        }
    }

    // 取得使用者會話
    getUserSession() {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('讀取使用者會話失敗:', error);
            return null;
        }
    }

    // 清除使用者會話
    clearUserSession() {
        try {
            localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
            return true;
        } catch (error) {
            console.error('清除使用者會話失敗:', error);
            return false;
        }
    }

    // 檢查櫃位是否可用
    checkLockerAvailable(lockerNumber) {
        try {
            const entries = this.getEntries();
            return !entries.some(entry => 
                entry.lockerNumber === lockerNumber && 
                entry.status === 'active'
            );
        } catch (error) {
            console.error('檢查櫃位狀態失敗:', error);
            return false;
        }
    }

    // 修改票券相關方法
    getTickets() {
        try {
            const tickets = localStorage.getItem(this.STORAGE_KEYS.TICKETS);
            return tickets ? JSON.parse(tickets) : [];
        } catch (error) {
            console.error('讀取票券失敗:', error);
            return [];
        }
    }

    addTicket(ticket) {
        try {
            const tickets = this.getTickets();
            if (!ticket || typeof ticket !== 'object') {
                throw new Error('無效的票券資料');
            }
            tickets.push({
                ...ticket,
                id: ticket.id || `ticket_${Date.now()}`,
                createdAt: ticket.createdAt || new Date().toISOString(),
                status: ticket.status || 'active'
            });
            localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
            return true;
        } catch (error) {
            console.error('新增票券失敗:', error);
            return false;
        }
    }

    updateTicket(ticketId, updatedTicket) {
        try {
            const tickets = this.getTickets();
            const index = tickets.findIndex(t => t.id === ticketId);
            if (index === -1) return false;
            
            tickets[index] = { ...tickets[index], ...updatedTicket };
            localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
            return true;
        } catch (error) {
            console.error('更新票券失敗:', error);
            return false;
        }
    }

    findTicketByNumber(number) {
        try {
            const tickets = this.getTickets();
            return tickets.find(t => t.number === number) || null;
        } catch (error) {
            console.error('查找票券失敗:', error);
            return null;
        }
    }

    // 新增支出相關方法
    getExpenses() {
        try {
            const expenses = localStorage.getItem('expenses');
            return expenses ? JSON.parse(expenses) : [];
        } catch (error) {
            console.error('Get expenses error:', error);
            return [];
        }
    }

    addExpense(expense) {
        try {
            const expenses = this.getExpenses();
            expenses.push(expense);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            return true;
        } catch (error) {
            console.error('Add expense error:', error);
            return false;
        }
    }

    deleteExpense(expenseId) {
        try {
            const expenses = this.getExpenses();
            const filteredExpenses = expenses.filter(expense => expense.id !== expenseId);
            localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
            return true;
        } catch (error) {
            console.error('Delete expense error:', error);
            return false;
        }
    }

    // 新增延長時間處理方法
    processOvertimeExtension(dateTimeString) {
        try {
            const extensionDate = new Date(dateTimeString);
            if (isNaN(extensionDate.getTime())) {
                throw new Error('無效的日期時間格式');
            }
            return extensionDate;
        } catch (error) {
            console.error('處理延長時間錯誤:', error);
            return null;
        }
    }
}

// 確保全域變數存在
window.defaultSettings = DEFAULT_SETTINGS;
window.storageManager = new StorageManager();

// 確保在文件加載完成後再初始化
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.storageManager) {
        window.storageManager = new StorageManager();
    }
    
    try {
        await window.storageManager.init();
        window.moduleLoaded = window.moduleLoaded || {};
        window.moduleLoaded.storage = true;
        console.log('Storage system initialized');
    } catch (error) {
        console.error('Storage initialization error:', error);
    }
});

// 修改特殊時段檢查函數
function isSpecialTimeSlot(date, settings) {
    try {
        const currentHour = date.getHours();
        const currentMinute = date.getMinutes();
        const currentDay = date.getDay(); // 0-6, 0 是星期日
        
        // 取得時段設定
        const timeSlots = settings.timeSlots || {};        
        // 如果是補票券類型，直接返回 0 元
        if (timeSlots.overtime && settings.isOvertime) {
            return {
                isSpecial: true,
                price: 0,
                isOvertime: true,
                name: '補票券',
                description: '超時補票'
            };
        }

        // 檢查是否為超時票券
        if (settings.isOvertime || settings.overtimeRate === 0) {
            return {
                isSpecial: true,
                price: 0,
                isOvertime: true,
                allowZero: true,
                name: '超時費用',
                description: '超時費用'
            };
        }

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
            price: settings.basePrice,
            isOvertime: false
        };
    } catch (error) {
        console.error('Error checking special time slot:', error);
        // 發生錯誤時返回預設價格
        return {
            isSpecial: false,
            price: settings.basePrice || 500,
            isOvertime: false,
            allowZero: false
        };
    }
}

// 確保初始化順序
window.defaultSettings = DEFAULT_SETTINGS;
window.storageManager = new StorageManager();
window.storageManager.init().catch(console.error);