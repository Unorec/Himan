// main.js

// 全局變數
let mockRecords = [];
let systemSettings = {
    systemName: 'HiMAN三溫暖管理系統',
    openTime: '06:00',
    closeTime: '23:00',
    basePrice: 600,
    overtimeRate: 100,
    reminderTime: 30
};

// 本地儲存管理
const Storage = {
    save: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    load: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    clear: function(key) {
        localStorage.removeItem(key);
    }
};

// 頁面載入初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
    loadMockData();
});

// 登入功能
function initializeLogin() {
    document.getElementById('loginForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'himan' && password === 'himan') {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('mainSystem').style.display = 'block';
            showSection('entry');
            showToast('登入成功！', 'success');
        } else {
            showToast('帳號或密碼錯誤！', 'error');
        }
    });
}

// 載入模擬資料
function loadMockData() {
    const savedRecords = Storage.load('records');
    if (savedRecords) {
        mockRecords = savedRecords;
    }
}

// 顯示提示訊息
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// 切換頁面區段
function showSection(sectionId) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = '';
    
    switch(sectionId) {
        case 'entry':
            loadEntryForm();
            break;
        case 'records':
            loadRecordsList();
            break;
        case 'stats':
            loadStatistics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// 入場登記功能
function loadEntryForm() {
    // 載入入場表單模板
    const template = document.getElementById('entryTemplate');
    if (!template) return;

    const content = template.content.cloneNode(true);
    document.getElementById('mainContent').appendChild(content);
    
    // 初始化表單處理
    initializeEntryForm();
}

// 處理入場登記
function initializeEntryForm() {
    document.getElementById('entryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const newEntry = {
            id: Date.now(),
            lockerNumber: formData.get('lockerNumber'),
            paymentType: formData.get('paymentType'),
            amount: formData.get('paymentType') === 'cash' ? 
                parseFloat(formData.get('amount')) : 0,
            entryTime: new Date().toISOString(),
            status: 'active'
        };

        if (validateEntry(newEntry)) {
            mockRecords.unshift(newEntry);
            Storage.save('records', mockRecords);
            showToast('登記成功！', 'success');
            e.target.reset();
        }
    });
}

// 驗證入場資料
function validateEntry(entry) {
  const lockerNum = parseInt(entry.lockerNumber);
    if (isNaN(lockerNum) || lockerNum < 1 || lockerNum > 300) {
        showToast('櫃位號碼必須是1-300之間的數字', 'error');
        return false;
    }

    if (entry.paymentType === 'cash' && 
        (entry.amount <= 0 || entry.amount > 10000)) {
        showToast('金額必須在1-10000之間', 'error');
        return false;
    }

    return true;
}

// 登出功能
function logout() {
    if (confirm('確定要登出系統嗎？')) {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainSystem').style.display = 'none';
        document.getElementById('loginForm').reset();
        showToast('已登出系統', 'info');
    }
}

// 時間格式化
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
const Validator = {
    // 櫃位號碼驗證 (1-300)
    validateLockerNumber: function(number) {
        const num = parseInt(number);
        return !isNaN(num) && num >= 1 && num <= 300;
    },

    // 票券號碼驗證 (允許英數字)
    validateTicketNumber: function(number) {
        return /^[A-Za-z0-9]{4,20}$/.test(number);
        
    },

    // 金額驗證
    validateAmount: function(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num <= 10000;
    }
};

// 入場表單驗證
function validateEntry(entry) {
    // 櫃位號碼驗證
    if (!Validator.validateLockerNumber(entry.lockerNumber)) {
        showToast('櫃位號碼必須是1-300之間的數字', 'error');
        return false;
    }

    // 付款方式驗證
    if (entry.paymentType === 'cash') {
        if (!Validator.validateAmount(entry.amount)) {
            showToast('金額必須在1-10000之間', 'error');
            return false;
        }
    } else if (entry.paymentType === 'ticket') {
        if (!Validator.validateTicketNumber(entry.ticketNumber)) {
            showToast('票券號碼格式不正確(需4-20位英數字)', 'error');
            return false;
        }
    }

    return true;
}
