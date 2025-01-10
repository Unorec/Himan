document.addEventListener('DOMContentLoaded', function() {
    const saveSettingsBtn = document.getElementById('saveSettings');
    const resetSettingsBtn = document.getElementById('resetSettings');

    // 載入初始設定
    loadSettings();

    // 保存設定
    saveSettingsBtn.addEventListener('click', function() {
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

        // 模擬保存到後端
        saveSettingsToBackend(settings).then(() => {
            showNotification('設定已成功保存');
        }).catch(error => {
            showNotification('保存設定時發生錯誤', 'error');
        });
    });

    // 重置設定
    resetSettingsBtn.addEventListener('click', function() {
        if (confirm('確定要重置所有設定嗎？此操作不可撤銷。')) {
            loadSettings(); // 重新載入預設設定
            showNotification('設定已重置為預設值');
        }
    });

    // 模擬從後端載入設定
    function loadSettings() {
        // 這裡應該是從後端 API 獲取設定，這裡使用模擬數據
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

        // 將設定填充到表單
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

    // 模擬保存設定到後端
    function saveSettingsToBackend(settings) {
        return new Promise((resolve, reject) => {
            // 模擬 API 請求
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% 成功率
                    resolve();
                } else {
                    reject(new Error('模擬的網絡錯誤'));
                }
            }, 1000);
        });
    }

    // 顯示通知
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});