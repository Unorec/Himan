// 時間格式化
function formatTime(date) {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 計算時間差（小時）
function calculateHours(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    return (now - start) / (1000 * 60 * 60);
}

// 計算費用
function calculateFees(hours, baseAmount = 0) {
    const standardHours = 3;
    const overtimeRate = 100;
    const overtimeHours = Math.max(0, hours - standardHours);
    const overtimeFee = Math.ceil(overtimeHours) * overtimeRate;
    
    return {
        baseAmount,
        overtimeHours,
        overtimeFee,
        total: baseAmount + overtimeFee
    };
}

// 格式化使用時間顯示
function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}小時${m}分鐘`;
}

// localStorage 操作封裝
const Storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    }
};

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 表單驗證
function validateForm(data) {
    const errors = [];
    
    if (!data.lockerNumber || data.lockerNumber < 1 || data.lockerNumber > 50) {
        errors.push('請輸入有效的置物櫃號碼 (1-50)');
    }
    
    if (data.paymentType === 'cash' && (!data.cashAmount || data.cashAmount <= 0)) {
        errors.push('請輸入有效的現金金額');
    }
    
    if (data.paymentType !== 'cash' && !data.ticketNumber.trim()) {
        errors.push('請輸入票券號碼');
    }
    
    return errors;
}

// 更新頁面標題顯示在場人數
function updateTitle(count) {
    document.title = `三溫暖管理系統 (${count}人在場)`;
}
