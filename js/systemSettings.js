window.HimanSettings = {
    elements: null,
    isInitialized: false,

    init: function() {
        // 如果已經初始化過，直接返回
        if (this.isInitialized) return true;

        // 確保 DOM 已完全載入
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => this.init());
            return false;
        }

        try {
            setTimeout(() => {
                this.initializeElements();
                if (this.validateElements()) {
                    this.bindEvents();
                    this.loadSettings();
                    this.isInitialized = true;
                } else {
                    console.warn('系統設定元素未完全載入，將在 500ms 後重試...');
                    setTimeout(() => this.init(), 500);
                }
            }, 100);

            return true;
        } catch (error) {
            console.error('初始化系統設定時發生錯誤:', error);
            return false;
        }
    },

    initializeElements: function() {
        // 使用較寬鬆的選擇器
        this.elements = {
            saveBtn: document.querySelector('[id^="saveSettings"]'),
            resetBtn: document.querySelector('[id^="resetSettings"]'),
            form: document.querySelector('.settings-container, #systemSettings')
        };

        if (!this.elements.form) {
            console.warn('找不到設定表單容器，嘗試等待DOM完全載入...');
            return false;
        }

        return true;
    },

    validateElements: function() {
        return this.elements && this.elements.form && 
               (this.elements.saveBtn || this.elements.resetBtn);
    },

    bindEvents: function() {
        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', this.saveSettings.bind(this));
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', this.resetSettings.bind(this));
        }
    },

    saveSettings: function() {
        const settings = {
            regularTicketPrice: document.getElementById('regularTicketPrice').value,
            weekendTicketPrice: document.getElementById('weekendTicketPrice').value,
            discountStartTime: document.getElementById('discountStartTime').value,
            discountEndTime: document.getElementById('discountEndTime').value,
            discountPrice: document.getElementById('discountPrice').value,
            event: {
                name: document.getElementById('eventName').value,
                startDate: document.getElementById('eventStartDate').value,
                endDate: document.getElementById('eventEndDate').value,
                recurrence: document.getElementById('eventRecurrence').value,
                time: document.getElementById('eventTime').value,
                description: document.getElementById('eventDescription').value
            }
        };

        saveSettingsToBackend(settings).then(() => {
            showNotification('設定已成功保存');
        }).catch(error => {
            showNotification('保存設定時發生錯誤', 'error');
        });
    },

    resetSettings: function() {
        if (confirm('確定要重置所有設定嗎？此操作不可撤銷。')) {
            this.loadSettings();
            showNotification('設定已重置為預設值');
        }
    },

    loadSettings: function() {
        const settings = {
            regularTicketPrice: 500,
            weekendTicketPrice: 700,
            discountStartTime: '18:30',
            discountEndTime: '19:30',
            discountPrice: 350,
            event: {
                name: '夏日特別活動',
                startDate: '2024-07-01',
                endDate: '2024-08-31',
                recurrence: 'daily',
                time: '14:00',
                description: '夏日清涼優惠，入場即送冰飲一杯！'
            }
        };

        document.getElementById('regularTicketPrice').value = settings.regularTicketPrice;
        document.getElementById('weekendTicketPrice').value = settings.weekendTicketPrice;
        document.getElementById('discountStartTime').value = settings.discountStartTime;
        document.getElementById('discountEndTime').value = settings.discountEndTime;
        document.getElementById('discountPrice').value = settings.discountPrice;
        document.getElementById('eventName').value = settings.event.name;
        document.getElementById('eventStartDate').value = settings.event.startDate;
        document.getElementById('eventEndDate').value = settings.event.endDate;
        document.getElementById('eventRecurrence').value = settings.event.recurrence;
        document.getElementById('eventTime').value = settings.event.time;
        document.getElementById('eventDescription').value = settings.event.description;
    }
};

function saveSettingsToBackend(settings) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('模擬的網絡錯誤'));
            }
        }, 1000);
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function tryInitSettings(attempts = 0) {
    if (attempts > 10) {
        console.error('無法初始化系統設定');
        return;
    }

    if (!window.HimanSettings.init()) {
        setTimeout(() => tryInitSettings(attempts + 1), 200);
    }
}

// 修改初始化方式
window.addEventListener('load', () => {
    if (window.HimanSettings && !window.HimanSettings.isInitialized) {
        window.HimanSettings.init();
    }
});