// 入場管理系統的靈動交互邏輯
class EntrySystem {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeTimeDisplay();
        this.initializeNavigation();
    }

    // 優雅地初始化頁面元素
    initializeElements() {
        this.elements = {
            form: document.getElementById('registrationForm'),
            locker: document.getElementById('lockerNumber'),
            paymentTypes: document.querySelectorAll('input[name="paymentType"]'),
            amount: document.getElementById('amount'),
            ticketNumber: document.getElementById('ticketNumber'),
            remarks: document.getElementById('remarks'),
            cashArea: document.getElementById('cashArea'),
            ticketArea: document.getElementById('ticketArea'),
            notification: document.getElementById('notification'),
            currentTime: document.getElementById('currentTime'),
            navItems: document.querySelectorAll('.nav-item')
        };
    }

    // 綁定交互事件的藝術
    bindEvents() {
        // 表單提交的優雅處理
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // 付款方式切換的靈動效果
        this.elements.paymentTypes.forEach(radio => {
            radio.addEventListener('change', () => this.handlePaymentTypeChange(radio.value));
        });

        // 導航項目的優雅切換
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => this.handleNavigation(item));
        });
    }

    // 時間顯示的優雅更新
    initializeTimeDisplay() {
        const updateTime = () => {
            const now = new Date();
            this.elements.currentTime.textContent = now.toLocaleTimeString();
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    // 處理付款方式切換的視覺詩篇
    handlePaymentTypeChange(type) {
        if (type === 'cash') {
            this.elements.cashArea.classList.add('active');
            this.elements.ticketArea.classList.remove('active');
            this.elements.amount.required = true;
            this.elements.ticketNumber.required = false;
        } else {
            this.elements.cashArea.classList.remove('active');
            this.elements.ticketArea.classList.add('active');
            this.elements.amount.required = false;
            this.elements.ticketNumber.required = true;
        }
    }

    // 表單提交的優雅處理
    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = {
                lockerNumber: this.elements.locker.value,
                paymentType: document.querySelector('input[name="paymentType"]:checked').value,
                amount: this.elements.amount.value,
                ticketNumber: this.elements.ticketNumber.value,
                remarks: this.elements.remarks.value
            };

            // 模擬提交到伺服器
            await this.submitEntry(formData);
            
            this.showNotification('入場登記成功！', 'success');
            this.resetForm();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // 提交數據的藝術
    async submitEntry(data) {
        // TODO: 實作與後端的優雅對接
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), 1000);
        });
    }

    // 提示訊息的視覺詩篇
    showNotification(message, type = 'info') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification ${type}`;
        
        setTimeout(() => {
            this.elements.notification.classList.add('hidden');
        }, 3000);
    }

    // 重置表單的優雅方式
    resetForm() {
        this.elements.form.reset();
        this.handlePaymentTypeChange('cash');
    }

    // 處理導航切換的靈動效果
    handleNavigation(item) {
        this.elements.navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // TODO: 實作頁面切換邏輯
    }

    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = item.dataset.page;
                this.switchPage(targetPage);
                
                // 更新導航項目狀態
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // 特別處理記錄查詢按鈕
        const recordsButton = document.querySelector('[data-page="recordsSection"]');
        if (recordsButton) {
            recordsButton.addEventListener('click', () => {
                this.showRecordsSection();
            });
        }
    }

    showRecordsSection() {
        const pages = document.querySelectorAll('.page-section');
        pages.forEach(page => page.classList.add('hidden'));
        
        const recordsSection = document.getElementById('recordsSection');
        recordsSection.classList.remove('hidden');
        
        // 初始化並更新記錄列表
        this.updateRecordsList();
    }

    updateRecordsList() {
        // 這裡添加獲取和顯示記錄的邏輯
        this.fetchRecords().then(records => {
            this.renderRecords(records);
        });
    }

    renderRecords(records) {
        const tbody = document.getElementById('recordsTableBody');
        if (!tbody) return;

        tbody.innerHTML = records.map(record => {
            const status = this.getRecordStatus(record);
            return `
                <tr class="${status.class}">
                    <td>
                        <span class="status-dot ${status.class}"></span>
                        ${status.text}
                    </td>
                    <td>
                        ${record.lockerNumber}
                        ${record.lockerChanges ? 
                            `<span class="locker-change-icon" onclick="showLockerHistory(${record.id})">🔄</span>` 
                            : ''}
                    </td>
                    <td>${record.entryTime}</td>
                    <td>${this.calculateTimeLeft(record)}</td>
                    <td>${record.paymentType}</td>
                    <td>
                        <button class="fee-details-btn" onclick="showFeeDetails(${record.id})">
                            查看明細
                        </button>
                    </td>
                    <td class="action-buttons">
                        <button class="change-locker-btn" onclick="showLockerChangeModal(${record.id})">
                            更換櫃位
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getRecordStatus(record) {
        const timeLeft = this.calculateTimeLeftMinutes(record);
        if (timeLeft <= 5) {
            return { class: 'warning-5', text: '即將超時' };
        } else if (timeLeft <= 15) {
            return { class: 'warning-15', text: '注意時間' };
        } else if (timeLeft <= 30) {
            return { class: 'warning-30', text: '時間提醒' };
        }
        return { class: '', text: '使用中' };
    }

    calculateTimeLeftMinutes(record) {
        const now = new Date();
        const entry = new Date(record.entryTime);
        return Math.floor((now - entry) / 1000 / 60);
    }
}

// 當文檔準備就緒時，優雅地初始化系統
document.addEventListener('DOMContentLoaded', () => {
    window.entrySystem = new EntrySystem();
    
    // 綁定導航事件
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有導航項目的 active 類別
            navItems.forEach(nav => nav.classList.remove('active'));
            // 為當前點擊項目添加 active 類別
            item.classList.add('active');

            // 獲取目標頁面
            const targetPage = item.dataset.page;
            if (targetPage) {
                // 隱藏所有頁面
                document.querySelectorAll('.page-section').forEach(page => {
                    page.classList.add('hidden');
                });
                // 顯示目標頁面
                const targetElement = document.getElementById(targetPage);
                if (targetElement) {
                    targetElement.classList.remove('hidden');
                }
            }
        });
    });
});