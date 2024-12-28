// entry.js - 入場系統完整實現
class EntrySystem {
    constructor() {
        // 延遲初始化直到 DOM 完全載入
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        try {
            this.initializeSystem();
            this.attachEventListeners();
        } catch (error) {
            console.error('入場系統初始化失敗:', error);
        }
    }

    // 系統初始化
    initializeSystem() {
        this.state = {
            lockerNumber: '',
            paymentType: 'cash',
            amount: this.calculateDefaultAmount(),
            ticketNumber: '',
            remarks: '',
            isEveningDiscount: this.checkEveningDiscountTime()
        };

        // 初始化DOM元素
        this.elements = {
            form: document.querySelector('#entryForm'),
            lockerInput: document.querySelector('#lockerNumber'),
            paymentRadios: document.querySelectorAll('input[name="paymentType"]'),
            amountInput: document.querySelector('#amount'),
            ticketInput: document.querySelector('#ticketNumber'),
            remarksInput: document.querySelector('#remarks'),
            priceDisplay: document.querySelector('#currentPrice'),
            discountAlert: document.querySelector('#discountAlert')
        };
    }

    // 事件監聽器綁定
    attachEventListeners() {
        // 確保元素存在後再綁定事件
        this.elements = {
            form: document.querySelector('#entryForm'),
            lockerInput: document.querySelector('#lockerNumber'),
            paymentRadios: document.querySelectorAll('input[name="paymentType"]'),
            amountInput: document.querySelector('#amount'),
            ticketInput: document.querySelector('#ticketNumber'),
            remarksInput: document.querySelector('#remarks'),
            priceDisplay: document.querySelector('#currentPrice'),
            discountAlert: document.querySelector('#discountAlert')
        };

        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        if (this.elements.paymentRadios.length) {
            this.elements.paymentRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    this.handlePaymentTypeChange(radio.value);
                });
            });
        }

        // 自動更新價格
        setInterval(() => {
            this.updatePrice();
        }, 60000);
    }

    // 檢查是否為晚間優惠時段 (18:30-19:30)
    checkEveningDiscountTime() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        return (hour === 18 && minute >= 30) || (hour === 19 && minute <= 30);
    }

    // 檢查是否為週末（週五、六、日）
    checkWeekend() {
        const now = new Date();
        const day = now.getDay();
        return day === 0 || day === 5 || day === 6;
    }

    // 計算預設金額
    calculateDefaultAmount() {
        const isWeekend = this.checkWeekend();
        const isEveningDiscount = this.checkEveningDiscountTime();

        if (isEveningDiscount) {
            return isWeekend ? 500 : 350;  // 晚間優惠價
        }
        return isWeekend ? 700 : 500;      // 一般價格
    }

    // 更新價格顯示
    updatePrice() {
        const newAmount = this.calculateDefaultAmount();
        const isEveningDiscount = this.checkEveningDiscountTime();
        
        // 更新狀態
        this.state.amount = newAmount;
        this.state.isEveningDiscount = isEveningDiscount;

        // 更新UI
        this.elements.amountInput.value = newAmount;
        this.updatePriceDisplay();
        this.updateDiscountAlert();
    }

    // 更新價格顯示區域
    updatePriceDisplay() {
        const isWeekend = this.checkWeekend();
        const timeRange = this.state.isEveningDiscount ? "（使用至隔日06:00）" : "（24小時制）";
        
        let priceText = `${isWeekend ? '週五、六、日' : '平日'} ${this.state.amount}元 ${timeRange}`;
        this.elements.priceDisplay.textContent = priceText;
    }

    // 更新優惠提示
    updateDiscountAlert() {
        if (this.state.isEveningDiscount) {
            this.elements.discountAlert.classList.remove('hidden');
            this.elements.discountAlert.querySelector('.price').textContent = this.state.amount;
        } else {
            this.elements.discountAlert.classList.add('hidden');
        }
    }

    // 處理付款方式變更
    handlePaymentTypeChange(paymentType) {
        this.state.paymentType = paymentType;
        
        // 切換顯示區域
        const cashArea = document.querySelector('.cash-payment-area');
        const ticketArea = document.querySelector('.ticket-payment-area');
        
        if (paymentType === 'cash') {
            cashArea.classList.remove('hidden');
            ticketArea.classList.add('hidden');
        } else {
            cashArea.classList.add('hidden');
            ticketArea.classList.remove('hidden');
        }
    }

    // 處理表單提交
    async handleSubmit() {
        try {
            // 表單驗證
            if (!this.validateForm()) {
                throw new Error('請填寫所有必要欄位');
            }

            // 顯示載入狀態
            this.showLoading(true);

            // 構建提交資料
            const submitData = {
                lockerNumber: this.elements.lockerInput.value,
                paymentType: this.state.paymentType,
                amount: this.state.amount,
                ticketNumber: this.elements.ticketInput.value,
                remarks: this.elements.remarksInput.value,
                isEveningDiscount: this.state.isEveningDiscount,
                entryTime: new Date().toISOString()
            };

            // 呼叫API（示例）
            const response = await this.submitEntry(submitData);
            
            if (response.success) {
                this.showToast('登記成功', 'success');
                this.resetForm();
            } else {
                throw new Error(response.message || '登記失敗');
            }

        } catch (error) {
            this.showToast(error.message, 'error');
            console.error('提交失敗:', error);
        } finally {
            this.showLoading(false);
        }
    }

    // 表單驗證
    validateForm() {
        if (!this.elements.lockerInput.value) return false;
        
        if (this.state.paymentType === 'cash' && !this.state.amount) return false;
        if (this.state.paymentType === 'ticket' && !this.elements.ticketInput.value) return false;
        
        return true;
    }

    // API呼叫示例
    async submitEntry(data) {
        // 這裡替換為實際的API呼叫
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, message: '登記成功' });
            }, 1000);
        });
    }

    // 工具方法：顯示提示訊息
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 工具方法：顯示/隱藏載入狀態
    showLoading(show) {
        const loader = document.querySelector('#loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // 重置表單
    resetForm() {
        this.elements.form.reset();
        this.state = {
            ...this.state,
            lockerNumber: '',
            ticketNumber: '',
            remarks: ''
        };
    }
}

// 系統初始化
document.addEventListener('DOMContentLoaded', () => {
    window.entrySystem = new EntrySystem();
});