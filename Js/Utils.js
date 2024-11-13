// 時間格式化工具
const TimeUtils = {
    // 格式化時間顯示
    formatTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    // 格式化使用時間
    formatDuration(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}小時${m}分鐘`;
    },

    // 檢查是否超時
    isOvertime(startTime, standardHours = 3) {
        const hours = this.calculateHours(startTime);
        return hours > standardHours;
    },

    // 計算已使用時間（小時）
    calculateHours(startTime, endTime = new Date()) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return (end - start) / (1000 * 60 * 60);
    },

    // 格式化日期
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// 金額相關工具
const MoneyUtils = {
    // 格式化金額顯示
    formatAmount(amount) {
        return Number(amount).toLocaleString('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0
        });
    },

    // 計算超時費用
    calculateOvertimeFee(hours, standardHours = 3, ratePerHour = 100) {
        const overtimeHours = Math.max(0, hours - standardHours);
        return Math.ceil(overtimeHours) * ratePerHour;
    },

    // 計算總金額
    calculateTotal(baseAmount, overtimeFee) {
        return Number(baseAmount) + Number(overtimeFee);
    }
};

// 驗證工具
const ValidationUtils = {
    // 驗證置物櫃號碼
    isValidLockerNumber(number) {
        return !isNaN(number) && number >= 1 && number <= 50;
    },

    // 驗證現金金額
    isValidCashAmount(amount) {
        return !isNaN(amount) && amount > 0;
    },

    // 驗證票券號碼
    isValidTicketNumber(number) {
        return typeof number === 'string' && number.trim().length > 0;
    }
};

// 儲存工具
const StorageUtils = {
    // 儲存資料
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    // 讀取資料
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    },

    // 清除資料
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    // 清除所有資料
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

// DOM 工具
const DOMUtils = {
    // 創建元素
    createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    },

    // 清空元素內容
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    // 顯示/隱藏元素
    toggleElement(element, show) {
        element.style.display = show ? '' : 'none';
    },

    // 添加事件監聽
    addEventListeners(element, events) {
        for (const [event, handler] of Object.entries(events)) {
            element.addEventListener(event, handler);
        }
    }
};

// 導出所有工具
const Utils = {
    Time: TimeUtils,
    Money: MoneyUtils,
    Validation: ValidationUtils,
    Storage: StorageUtils,
    DOM: DOMUtils
};
