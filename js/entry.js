import { RecordsManager } from './modules/records.js';

// 入場登記的靈動交互
class EntryRegistration {
    constructor() {
        this.initializePricingRules(); // 移到最前面
        this.initializeElements();
        this.bindEvents();
        this.initializeTimeDisplay();
        this.cleanup = () => {
            if (this.timeInterval) {
                clearInterval(this.timeInterval);
            }
        };
        // 在頁面卸載時清理
        window.addEventListener('unload', this.cleanup);
    }

    // 元素初始化的優雅序章
    initializeElements() {
        this.form = document.getElementById('registrationForm');
        this.lockerInput = document.getElementById('lockerNumber');
        this.timeDisplay = document.getElementById('entryTime');
        this.amountInput = document.getElementById('amount');
        this.ticketInput = document.getElementById('ticketNumber');
        this.customAmountCheckbox = document.getElementById('customAmount');
        this.remarksArea = document.getElementById('remarks');
        
        // 付款相關區域
        this.cashArea = document.getElementById('cashArea');
        this.ticketArea = document.getElementById('ticketArea');
        
        // 初始化預設金額
        this.standardFee = {
            regular: 500,
            evening: 350
        };
    }

    // 事件綁定的精妙藝術
    bindEvents() {
        // 表單提交的優雅處理
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // 付款方式切換的靈動轉換
        document.querySelectorAll('input[name="paymentType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handlePaymentTypeChange(e));
        });
        
        // 自訂金額的動態響應
        this.customAmountCheckbox.addEventListener('change', (e) => {
            this.handleCustomAmountToggle(e);
        });
        
        // 櫃位號碼的即時驗證
        this.lockerInput.addEventListener('input', (e) => this.validateLockerNumber(e));
    }

    // 時間顯示的靈動更新
    initializeTimeDisplay() {
        const updateDateTime = () => {
            const now = new Date();
            
            // 更新日期顯示
            const dateString = now.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'long'
            });
            
            // 更新時間顯示
            const timeString = now.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            // 更新顯示元素
            const currentDateDisplay = document.getElementById('currentDate');
            const currentTimeDisplay = document.getElementById('currentTime');
            
            if (currentDateDisplay) {
                currentDateDisplay.textContent = dateString;
            }
            
            if (currentTimeDisplay) {
                currentTimeDisplay.textContent = timeString;
            }
            
            // 更新隱藏的入場時間輸入框
            if (this.timeDisplay) {
                this.timeDisplay.value = `${dateString} ${timeString}`;
            }
            
            // 更新預設金額並檢查優惠時段
            this.updateFeeByTime(now);
        };
        
        // 立即執行一次
        updateDateTime();
        
        // 設定每秒更新
        this.timeInterval = setInterval(updateDateTime, 1000);
    }

    // 預設金額的智慧計算
    updateFeeByTime(now) {
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        let fee = this.calculateFee(day, currentTime);
        
        // 更新金額顯示
        if (!this.customAmountCheckbox?.checked && this.amountInput) {
            this.amountInput.value = fee;
        }

        // 更新提示訊息
        this.updatePricingInfo(day, currentTime);
    }

    calculateFee(day, currentTime) {
        if (!this.timeRules || !this.pricing) {
            console.error('Pricing rules not initialized');
            return 500; // 預設金額
        }

        const isWeekend = [5, 6, 0].includes(day);
        
        if (day === 0 && this.isWithinTimeRange(currentTime, 
            this.timeRules.towelNight.start, 
            this.timeRules.towelNight.end)) {
            return this.pricing.weekday.towelNight;
        }
        
        if (this.isWithinTimeRange(currentTime, 
            this.timeRules.discountPeriod.start, 
            this.timeRules.discountPeriod.end)) {
            return isWeekend ? this.pricing.weekend.discount : this.pricing.weekday.discount;
        }
        
        return isWeekend ? this.pricing.weekend.regular : this.pricing.weekday.regular;
    }

    isWithinTimeRange(current, start, end) {
        const currentMinutes = this.timeToMinutes(current);
        const startMinutes = this.timeToMinutes(start);
        const endMinutes = this.timeToMinutes(end);
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    updatePricingInfo(day, currentTime) {
        const discountPeriod = document.getElementById('discountPeriod');
        
        if (!discountPeriod) {
            console.error('Cannot find discountPeriod element');
            return;
        }

        const amount = this.calculateFee(day, currentTime);
        let timeStatus = '';
        let priceMessage = '';
        
        // 判斷時段和價格
        const priceInfo = this.getPriceInfo(day, currentTime, amount);
        
        // 更新 UI 元素
        const timeBadge = discountPeriod.querySelector('.time-badge');
        const discountBadge = discountPeriod.querySelector('.discount-badge');
        const currentPrice = discountPeriod.querySelector('#currentPrice');
        
        if (timeBadge) timeBadge.textContent = priceInfo.timeStatus;
        if (discountBadge) discountBadge.textContent = priceInfo.priceMessage;
        if (currentPrice) currentPrice.textContent = `目前票價：${amount}元`;
        
        // 更新視覺樣式
        this.updateDiscountPeriodStyle(discountPeriod, priceInfo.type);
        
        // 同步更新金額
        this.syncAmountInput(amount);
        
        // 移除隱藏狀態
        discountPeriod.classList.remove('hidden');
        discountPeriod.style.display = 'block';
    }

    getPriceInfo(day, currentTime, amount) {
        if (day === 0 && this.isWithinTimeRange(currentTime, 
            this.timeRules.towelNight.start, 
            this.timeRules.towelNight.end)) {
            return {
                timeStatus: '小毛巾之夜特惠時段',
                priceMessage: `🌙 特惠價 ${amount}元`,
                type: 'towel-night'
            };
        }
        
        if (this.isWithinTimeRange(currentTime, 
            this.timeRules.discountPeriod.start, 
            this.timeRules.discountPeriod.end)) {
            return {
                timeStatus: '優惠時段',
                priceMessage: `⏰ 優惠價 ${amount}元`,
                type: 'discount-period'
            };
        }
        
        const isWeekend = [5, 6, 0].includes(day);
        return {
            timeStatus: isWeekend ? '週末時段' : '一般時段',
            priceMessage: `💰 ${isWeekend ? '週末' : '平日'}價 ${amount}元`,
            type: 'regular'
        };
    }

    updateDiscountPeriodStyle(element, type) {
        element.classList.remove('towel-night', 'discount-period', 'regular');
        element.classList.add(type);
    }

    syncAmountInput(amount) {
        if (!this.customAmountCheckbox?.checked && 
            document.querySelector('input[name="paymentType"]:checked')?.value === 'cash') {
            this.amountInput.value = amount;
        }
    }

    // 付款方式切換的優雅過渡
    handlePaymentTypeChange(event) {
        const isCash = event.target.value === 'cash';
        
        // 確保元素存在
        if (!this.cashArea || !this.ticketArea || !this.amountInput || !this.ticketInput) {
            console.error('Required elements not found');
            return;
        }

        // 顯示/隱藏相應的付款區域
        this.cashArea.style.display = isCash ? 'block' : 'none';
        this.ticketArea.style.display = isCash ? 'none' : 'block';
        
        // 重設表單欄位
        if (isCash) {
            // 現金付款模式
            this.ticketInput.value = '';
            this.ticketInput.required = false;
            this.amountInput.required = true;
            
            // 設定當前時段的預設金額
            const now = new Date();
            const day = now.getDay();
            const currentTime = now.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const fee = this.calculateFee(day, currentTime);
            this.amountInput.value = fee;
            this.amountInput.disabled = !this.customAmountCheckbox.checked;
        } else {
            // 票券付款模式
            this.amountInput.value = '';
            this.amountInput.required = false;
            this.ticketInput.required = true;
            this.ticketInput.focus(); // 自動聚焦到票券輸入框
        }
        
        // 更新 UI 狀態
        this.updatePricingInfo(new Date().getDay(), 
            new Date().toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        );
    }

    // 自訂金額的靈活控制
    handleCustomAmountToggle(event) {
        const checked = event.target.checked;
        this.amountInput.disabled = !checked;
        
        if (checked) {
            this.amountInput.value = '';
            this.amountInput.focus();
        } else {
            this.updateDefaultAmount(new Date());
        }
    }

    // 櫃位號碼的即時驗證
    validateLockerNumber(event) {
        const value = event.target.value;
        if (value < 1 || value > 500) {
            event.target.classList.add('error');
            this.showNotification('櫃位號碼必須在1-500之間', 'error');
        } else {
            event.target.classList.remove('error');
        }
    }

    // 表單提交的優雅處理
    async handleSubmit(event) {
        event.preventDefault();
        
        try {
            // 基礎驗證
            if (!this.validateForm()) {
                return;
            }
            
            // 取得目前時間和價格
            const now = new Date();
            const currentTime = now.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const expectedAmount = this.calculateFee(now.getDay(), currentTime);
            
            // 檢查輸入金額是否符合時段價格
            const inputAmount = parseInt(this.amountInput.value);
            const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
            
            if (paymentType === 'cash' && !this.customAmountCheckbox?.checked) {
                if (inputAmount !== expectedAmount) {
                    this.showNotification(`金額不符合目前時段價格 ${expectedAmount} 元`, 'error');
                    return;
                }
            }
            
            // 構建入場記錄
            const entryData = {
                lockerNumber: parseInt(this.lockerInput.value),
                entryTime: now.toISOString(),
                paymentType: paymentType,
                amount: paymentType === 'cash' ? inputAmount : null,
                ticketNumber: this.ticketInput.value || null,
                remarks: this.remarksArea.value,
                priceType: this.getCurrentPriceType(now.getDay(), currentTime)
            };
            
            // 儲存記錄
            await this.saveEntry(entryData);
            
            // 顯示成功通知並更新 UI
            this.showSuccessNotification(entryData);
            
            // 重置表單
            this.resetForm();
            
        } catch (error) {
            console.error('入場登記失敗:', error);
            this.showNotification('入場登記失敗，請稍後再試', 'error');
        }
    }

    getCurrentPriceType(day, currentTime) {
        if (day === 0 && this.isWithinTimeRange(currentTime, 
            this.timeRules.towelNight.start, 
            this.timeRules.towelNight.end)) {
            return 'towel-night';
        }
        
        if (this.isWithinTimeRange(currentTime, 
            this.timeRules.discountPeriod.start, 
            this.timeRules.discountPeriod.end)) {
            return 'discount';
        }
        
        return [5, 6, 0].includes(day) ? 'weekend' : 'weekday';
    }

    showSuccessNotification(entryData) {
        const message = `
            入場登記成功！
            櫃位號碼: ${entryData.lockerNumber}
            ${entryData.paymentType === 'cash' ? 
                `金額: ${entryData.amount} 元` : 
                `票券編號: ${entryData.ticketNumber}`}
        `;
        
        this.showNotification(message, 'success');
        
        // 顯示詳細資訊於通知區域
        const notificationArea = document.getElementById('notification');
        if (notificationArea) {
            notificationArea.innerHTML = `
                <div class="notification-content">
                    <h4>入場登記成功！</h4>
                    <p>櫃位號碼: ${entryData.lockerNumber}</p>
                    ${entryData.paymentType === 'cash' ? 
                        `<p>付款金額: ${entryData.amount} 元</p>` : 
                        `<p>票券編號: ${entryData.ticketNumber}</p>`}
                    <p class="notification-time">${new Date().toLocaleTimeString('zh-TW')}</p>
                </div>
            `;
        }
    }

    // 表單驗證的嚴謹藝術
    validateForm() {
        // 櫃位號碼驗證
        if (this.lockerInput.value < 1 || this.lockerInput.value > 500) {
            this.showNotification('請輸入有效的櫃位號碼（1-500）', 'error');
            return false;
        }
        
        // 付款資訊驗證
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        if (paymentType === 'cash' && !this.amountInput.value) {
            this.showNotification('請輸入付款金額', 'error');
            return false;
        }
        
        if (paymentType === 'ticket' && !this.ticketInput.value) {
            this.showNotification('請輸入票券號碼', 'error');
            return false;
        }
        
                return true;
    }

        initializePricingRules() {
            this.pricing = {
                weekday: {
                    regular: 500,
                    discount: 350,
                    towelNight: 350
                },
                weekend: {
                    regular: 700,
                    discount: 500
                }
            };
            
            this.timeRules = {
                discountPeriod: {
                    start: '18:30',
                    end: '19:30',
                    nextDayEnd: '06:00'
                },
                towelNight: {
                    day: 0, // 週日
                    start: '13:30',
                    end: '15:30',
                    limitTime: '23:00'
                }
            };
        }

    // 更新預設金額
    updateDefaultAmount(date) {
        const day = date.getDay();
        const currentTime = date.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const fee = this.calculateFee(day, currentTime);
        this.amountInput.value = fee;
    }

    // 儲存入場記錄
    async saveEntry(entryData) {
        try {
            // 這裡應該是你的儲存邏輯
            console.log('儲存入場記錄:', entryData);
            // 之後可以改為實際的 API 呼叫
            return Promise.resolve();
        } catch (error) {
            console.error('儲存失敗:', error);
            throw error;
        }
    }

    // 顯示通知訊息
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        // 3秒後自動隱藏
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // 重置表單
    resetForm() {
        this.form.reset();
        this.updateDefaultAmount(new Date());
        this.lockerInput.focus();
    }

    updateDateTime() {
        const now = new Date();
        const timeDisplayContainer = document.querySelector('.time-display-container');
        
        // Create the container if it doesn't exist
        if (!timeDisplayContainer) {
            const entryForm = document.querySelector('.entry-form');
            const newContainer = document.createElement('div');
            newContainer.className = 'time-display-container';
            entryForm.insertBefore(newContainer, entryForm.firstChild);
            return this.updateDateTime(); // Retry after creating container
        }

        const dateStr = now.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });
        
        const timeStr = now.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        timeDisplayContainer.innerHTML = `
            <div class="time-display-row">
                <span class="time-display-label">
                    <i class="fas fa-calendar time-icon"></i>日期
                </span>
                <span class="time-display-value" id="currentDate">${dateStr}</span>
            </div>
            <div class="time-display-row">
                <span class="time-display-label">
                    <i class="fas fa-clock time-icon"></i>時間
                </span>
                <span class="time-display-value" id="currentTime">${timeStr}</span>
            </div>
            <input type="hidden" id="entryTime" name="entryTime" value="${dateStr} ${timeStr}">
        `;
    }

    // 在類的析構函數或清理方法中添加
    cleanup() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    const app = new EntryRegistration();
    
    // 頁面切換功能
    const pageSections = document.querySelectorAll('.page-section');
    const navItems = document.querySelectorAll('.nav-item');  // 添加這行
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;
            
            // 更新導航項目狀態
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 切換頁面顯示
            pageSections.forEach(section => {
                if (section.id === targetPage) {
                    section.classList.remove('hidden');
                    section.classList.add('active');
                } else {
                    section.classList.add('hidden');
                    section.classList.remove('active');
                }
            });
            
            // 如果切換到紀錄查詢頁面，初始化 RecordsManager
            if (targetPage === 'recordsSection' && !window.recordsManager) {
                window.recordsManager = new RecordsManager();
            }
        });
    });

    // 綁定登出按鈕事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // 清除所有本地存儲的資料
            localStorage.clear();
            sessionStorage.clear();
            
            // 顯示登出提示
            const notification = document.getElementById('notification');
            if (notification) {
                notification.textContent = '成功登出系統';
                notification.className = 'notification success';
                notification.classList.remove('hidden');
            }
            
            // 短暫延遲後重導向到登入頁面
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        });
    }
});

// 初始化記錄管理器
const recordsManager = new RecordsManager();

// 搜尋按鈕點擊處理
document.getElementById('searchRecordsBtn').addEventListener('click', async () => {
    try {
        const filters = {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            lockerNumber: document.getElementById('searchLockerNumber').value,
            paymentType: document.getElementById('searchPaymentType').value,
            priceType: document.getElementById('searchPriceType').value,
            status: document.getElementById('searchStatus').value
        };

        const result = await recordsManager.searchRecords(filters);
        updateRecordsTable(result.records);
        updatePagination(result.total, result.totalPages);
    } catch (error) {
        console.error('搜尋失敗:', error);
        // TODO: 顯示錯誤訊息給使用者
    }
});

// 更新記錄表格
function updateRecordsTable(records) {
    const tbody = document.getElementById('recordsTableBody');
    tbody.innerHTML = '';

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.date} ${record.time}</td>
            <td>${record.lockerNumber}</td>
            <td>${record.paymentType === 'cash' ? '現金' : '票券'}</td>
            <td>${record.amount || record.ticketNumber}</td>
            <td>${getPeriodTypeText(record.periodType)}</td>
            <td><span class="status-badge status-${record.status}">${getStatusText(record.status)}</span></td>
            <td>${record.remarks}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${record.id}">編輯</button>
                    ${record.status === 'active' ? 
                        `<button class="action-btn extend-btn" data-id="${record.id}">延長</button>` : 
                        ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 更新分頁資訊
function updatePagination(total, totalPages) {
    document.getElementById('totalRecords').textContent = total;
    document.getElementById('totalPages').textContent = totalPages;
    // TODO: 更新分頁按鈕狀態
}

// 輔助函數
function getPeriodTypeText(type) {
    const types = {
        'regular': '一般時段',
        'discount': '優惠時段',
        'towel-night': '小毛巾之夜'
    };
    return types[type] || type;
}

function getStatusText(status) {
    const statuses = {
        'active': '使用中',
        'completed': '已結束'
    };
    return statuses[status] || status;
}