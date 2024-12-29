(function() {
    'use strict';

    class EntrySystem {
        constructor() {
            this.initialize();
        }

        initialize() {
            if (!this.bindElements()) {
                console.error('無法綁定必要元素');
                return;
            }
            this.attachEventListeners();
            this.updatePriceDisplay();
            this.initializePaymentAreas();
            // 增加更頻繁的檢查以便及時提醒
            setInterval(() => {
                this.checkDiscountTime();
                this.updatePriceDisplay();
            }, 30000); // 每30秒檢查一次
        }

        bindElements() {
            try {
                this.elements = {
                    entryForm: document.getElementById('entryForm'),
                    priceDisplay: document.getElementById('currentPrice'),
                    amountInput: document.getElementById('amount'),
                    lockerInput: document.getElementById('lockerNumber'),
                    ticketInput: document.getElementById('ticketNumber'),
                    remarksInput: document.getElementById('remarks'),
                    paymentTypes: document.querySelectorAll('input[name="paymentType"]'),
                    cashArea: document.querySelector('.cash-payment-area'),
                    ticketArea: document.querySelector('.ticket-payment-area'),
                    discountAlert: document.getElementById('discountAlert'),
                    timeDisplay: document.querySelector('.current-time'),
                    priceAmount: document.querySelector('.amount')
                };

                // 驗證必要元素
                const requiredElements = ['entryForm', 'priceDisplay', 'amountInput', 'cashArea', 'ticketArea'];
                const missingElements = requiredElements.filter(key => !this.elements[key]);
                
                if (missingElements.length > 0) {
                    console.error('缺少必要元素:', missingElements);
                    return false;
                }
                return true;
            } catch (error) {
                console.error('元素綁定失敗:', error);
                return false;
            }
        }

        attachEventListeners() {
            if (this.elements.entryForm) {
                this.elements.entryForm.addEventListener('submit', this.handleSubmit.bind(this));
            }

            this.elements.paymentTypes?.forEach(radio => {
                radio.addEventListener('change', this.handlePaymentTypeChange.bind(this));
            });

            // 自動更新價格
            setInterval(() => {
                this.updatePriceDisplay();
                this.checkDiscountTime();
            }, 60000); // 每分鐘更新

            // 立即更新一次價格
            this.updatePriceDisplay();
        }

        initializePaymentAreas() {
            const initialPaymentType = document.querySelector('input[name="paymentType"]:checked');
            if (initialPaymentType) {
                this.handlePaymentTypeChange({ target: initialPaymentType });
            }
        }

        updatePaymentAreas(isCash) {
            if (!this.elements.cashArea || !this.elements.ticketArea) {
                console.error('付款區域元素未找到');
                return;
            }

            this.elements.cashArea.style.display = isCash ? 'block' : 'none';
            this.elements.ticketArea.style.display = isCash ? 'none' : 'block';

            if (isCash) {
                this.elements.ticketInput.value = '';
                const timeInfo = this.getTimeInfo();
                this.elements.amountInput.value = timeInfo.currentPrice;
            } else {
                this.elements.amountInput.value = '';
                this.elements.ticketInput.focus();
            }
        }

        handlePaymentTypeChange(event) {
            const isCash = event.target.value === 'cash';
            
            // 使用 display 直接控制顯示狀態
            if (this.elements.cashArea) {
                this.elements.cashArea.style.display = isCash ? 'block' : 'none';
            }
            if (this.elements.ticketArea) {
                this.elements.ticketArea.style.display = isCash ? 'none' : 'block';
                // 如果是票券模式，確保聚焦到票券輸入框
                if (!isCash && this.elements.ticketInput) {
                    setTimeout(() => this.elements.ticketInput.focus(), 100);
                }
            }

            // 重設輸入值
            if (isCash) {
                if (this.elements.ticketInput) {
                    this.elements.ticketInput.value = '';
                }
                if (this.elements.amountInput) {
                    this.elements.amountInput.value = this.getTimeInfo().currentPrice;
                }
            } else {
                if (this.elements.amountInput) {
                    this.elements.amountInput.value = '';
                }
            }

            // 更新必填狀態
            if (this.elements.ticketInput) {
                this.elements.ticketInput.required = !isCash;
            }
            if (this.elements.amountInput) {
                this.elements.amountInput.required = isCash;
            }
        }

        async handleSubmit(event) {
            event.preventDefault();
            
            try {
                const formData = this.getFormData();
                if (!this.validateFormData(formData)) return;

                const duplicateCheck = await this.checkLockerDuplicate(formData.lockerNumber);
                if (duplicateCheck.isDuplicate) {
                    this.showDuplicateInfo(duplicateCheck.record);
                    return;
                }

                const record = await this.createRecord(formData);
                if (record) {
                    window.showToast('入場登記成功', 'success');
                    this.resetForm();
                    window.HimanSystem.ModuleManager.get('records')?.renderRecords();
                }
            } catch (error) {
                console.error('入場登記失敗:', error);
                window.showToast('入場登記失敗', 'error');
            }
        }

        async checkLockerDuplicate(lockerNumber) {
            try {
                const records = window.HimanSystem.ModuleManager.get('records');
                const activeRecords = await records.getActiveRecords();
                
                const duplicate = activeRecords.find(record => 
                    record.lockerNumber === lockerNumber && 
                    record.status === 'active'
                );

                return {
                    isDuplicate: !!duplicate,
                    record: duplicate
                };
            } catch (error) {
                console.error('檢查重複櫃位時發生錯誤:', error);
                throw error;
            }
        }

        getTimeInfo() {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const day = now.getDay();
            
            // 檢查是否為週末 (0是週日)
            const isWeekend = day === 0 || day === 5 || day === 6;
            
            // 檢查是否為優惠時段 (18:30-19:30)
            const isDiscountTime = (hour === 18 && minute >= 30) || 
                                 (hour === 19 && minute <= 30);

            // 根據時間和星期計算價格
            let currentPrice;
            if (isDiscountTime) {
                currentPrice = isWeekend ? 500 : 350; // 優惠時段價格
            } else {
                currentPrice = isWeekend ? 700 : 500; // 一般價格
            }

            return {
                isWeekend,
                isDiscountTime,
                currentPrice
            };
        }

        getFormData() {
            const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
            const { currentPrice, isDiscountTime, isWeekend } = this.getTimeInfo();
            
            return {
                lockerNumber: this.elements.lockerInput.value,
                paymentType: paymentType,
                amount: paymentType === 'cash' ? currentPrice : null,
                ticketNumber: paymentType === 'ticket' ? this.elements.ticketInput.value : null,
                remarks: this.elements.remarksInput.value,
                status: 'active',
                timestamp: new Date().toISOString(),
                isDiscountTime: isDiscountTime,
                isWeekend: isWeekend
            };
        }

        validateFormData(data) {
            if (!data.lockerNumber) {
                window.showToast('請輸入櫃位號碼', 'error');
                return false;
            }

            if (data.paymentType === 'ticket' && !data.ticketNumber) {
                window.showToast('請輸入票券號碼', 'error');
                return false;
            }

            return true;
        }

        async createRecord(data) {
            try {
                return window.HimanSystem.ModuleManager.get('records')?.addRecord(data);
            } catch (error) {
                throw new Error('建立入場記錄失敗');
            }
        }

        resetForm() {
            this.elements.entryForm.reset();
            this.updatePriceDisplay();
        }

        checkDiscountTime() {
            if (this.elements.discountAlert) {
                const { isDiscountTime, currentPrice } = this.getTimeInfo();
                
                this.elements.discountAlert.classList.toggle('hidden', !isDiscountTime);
                
                if (isDiscountTime) {
                    const priceSpan = this.elements.discountAlert.querySelector('.price');
                    if (priceSpan) {
                        const now = new Date();
                        const startTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
                        const message = `${currentPrice} (開始時間：${startTime})`;
                        priceSpan.textContent = message;
                        
                        if (this.elements.remarksInput) {
                            const currentRemarks = this.elements.remarksInput.value;
                            const timeNote = `優惠時段開始：${startTime}`;
                            this.elements.remarksInput.value = currentRemarks 
                                ? `${currentRemarks}\n${timeNote}`
                                : timeNote;
                        }
                    }
                }
            }
        }

        updatePriceDisplay() {
            const { currentPrice, isDiscountTime, isWeekend } = this.getTimeInfo();
            
            if (this.elements.priceDisplay) {
                let priceText = `目前票價: <span class="amount">${currentPrice}</span>元`;
                if (isDiscountTime) {
                    priceText += ' <span class="discount-note">(優惠時段)</span>';
                }
                if (isWeekend) {
                    priceText += ' <span class="weekend-note">(假日票價)</span>';
                }
                
                this.elements.priceDisplay.innerHTML = priceText;
                this.elements.priceDisplay.classList.toggle('discount', isDiscountTime);
            }
            
            if (this.elements.amountInput) {
                this.elements.amountInput.value = currentPrice;
            }

            const now = new Date();
            const upcomingDiscount = checkForUpcomingDiscount(now);
            
            // 顯示即將到來的優惠提醒
            if (upcomingDiscount) {
                const alertEl = document.getElementById('discountAlert');
                if (alertEl) {
                    alertEl.classList.remove('hidden');
                    alertEl.classList.add('upcoming');
                    alertEl.querySelector('.price').textContent = 
                        `${upcomingDiscount.message} (${upcomingDiscount.startTime} 開始)`;
                }
            }
        }
    }

    // 檢查並註冊模組
    if (window.HimanSystem && window.HimanSystem.ModuleManager) {
        window.HimanSystem.ModuleManager.register('entry', EntrySystem);
    } else {
        console.error('系統核心未完全載入，無法註冊入場模組');
    }

    function checkForDiscount(now) {
        const day = now.getDay();
        const time = now.toLocaleTimeString('zh-TW', { hour12: false });
        
        // 檢查星期天小毛巾之夜優惠
        if (day === 0) { // 星期天
            const sundayDiscount = Config.pricing.discounts.sundayTowel;
            if (isTimeBetween(time, sundayDiscount.hours.start, sundayDiscount.hours.end)) {
                return {
                    type: 'sundayTowel',
                    name: sundayDiscount.name,
                    price: sundayDiscount.price,
                    maxStay: sundayDiscount.hours.maxStay,
                    overtime: sundayDiscount.overtime
                };
            }
        }

        // ...existing code...
    }

    function checkForUpcomingDiscount(now) {
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // 檢查常規優惠時段
        const isApproachingRegularDiscount = 
            (hour === 18 && minute >= 0 && minute < 30) || // 18:00-18:30
            (hour === 13 && minute >= 0 && minute < 30 && day === 0); // 星期日13:00-13:30
        
        if (isApproachingRegularDiscount) {
            return {
                type: 'upcoming',
                startTime: day === 0 ? '13:30' : '18:30',
                message: SYSTEM_CONFIG.pricing.notifications.discountAlertMessage
            };
        }
        
        return null;
    }

    function updatePriceDisplay() {
        const now = new Date();
        const discount = checkForDiscount(now);
        const upcomingDiscount = checkForUpcomingDiscount(now);
        
        const priceDisplay = document.getElementById('currentPrice');
        const discountAlert = document.getElementById('discountAlert');
        
        if (discount) {
            priceDisplay.querySelector('.amount').textContent = discount.price;
            priceDisplay.querySelector('.price-type').textContent = `(${discount.name})`;
            
            discountAlert.querySelector('.price').textContent = `${discount.price}元`;
            discountAlert.classList.remove('hidden');
            
            // 添加時間限制提醒
            const alertText = `優惠價格：${discount.price}元 (限制使用至晚上11:00，超時費用${discount.overtime.price}元)`;
            discountAlert.querySelector('.price').textContent = alertText;
        }
        
        // 顯示即將到來的優惠提醒
        if (upcomingDiscount) {
            const alertEl = document.getElementById('discountAlert');
            if (alertEl) {
                alertEl.classList.remove('hidden');
                alertEl.classList.add('upcoming');
                alertEl.querySelector('.price').textContent = 
                    `${upcomingDiscount.message} (${upcomingDiscount.startTime} 開始)`;
            }
        }
        
        // ...existing code...
    }

    async function handleSubmit(event) {
        // ...existing code...
        
        const formData = this.getFormData();
        
        // 檢查是否為小毛巾之夜優惠
        const discount = checkForDiscount(new Date());
        if (discount?.type === 'sundayTowel') {
            formData.maxStayTime = discount.maxStay;
            formData.overtimePrice = discount.overtime.price;
            formData.remarks += `\n限制使用至晚上11:00，超時費用${discount.overtime.price}元`;
        }
        
        // ...existing code...
    }

})();

function getTimeInfo() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay(); // 0是週日，1-6是週一到週六
    
    // 檢查是否為週末 (週五、六、日)
    const isWeekend = day === 0 || day === 5 || day === 6;
    
    // 檢查是否為優惠時段 (18:30-19:30)
    const isDiscountTime = (hour === 18 && minute >= 30) || 
                          (hour === 19 && minute <= 30);

    // 根據時間和星期計算價格
    let currentPrice;
    if (isDiscountTime) {
        currentPrice = isWeekend ? 500 : 350; // 優惠時段價格
    } else {
        currentPrice = isWeekend ? 700 : 500; // 一般價格
    }

    return {
        isWeekend,
        isDiscountTime,
        currentPrice,
        timeDisplay: now.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    };
}

function updatePriceByTime() {
    const timeInfo = getTimeInfo();
    const timeDisplay = document.querySelector('.current-time');
    const priceDisplay = document.querySelector('.amount');
    const entryContainer = document.querySelector('.entry-container');
    const discountAlert = document.getElementById('discountAlert');
    
    // 更新時間顯示
    if (timeDisplay) {
        timeDisplay.textContent = timeInfo.timeDisplay;
    }

    // 更新價格顯示
    if (priceDisplay) {
        priceDisplay.textContent = timeInfo.currentPrice;
    }
    
    // 更新優惠提示和背景
    if (discountAlert) {
        if (timeInfo.isDiscountTime) {
            entryContainer.classList.add('discount-time');
            discountAlert.classList.remove('hidden');
            const priceMessage = `${timeInfo.currentPrice}元 (${timeInfo.isWeekend ? '假日' : '平日'}優惠價)`;
            discountAlert.querySelector('.price').textContent = priceMessage;
        } else {
            entryContainer.classList.remove('discount-time');
            discountAlert.classList.add('hidden');
        }
    }

    // 更新表單中的金額輸入框
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.value = timeInfo.currentPrice;
    }
}

// 在文檔載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    updatePriceByTime();
    // 每分鐘更新一次
    setInterval(updatePriceByTime, 60000);
});