import { Module } from '../core/system.js';

class CheckinModule extends Module {
    constructor() {
        super();
        this.storage = null;
        this.toast = null;
        this._initialized = false;
        this.chartInstance = null;
        this._eventsBound = false;
        
        // 定義價格規則
        this.priceRules = {
            weekday: {
                normal: 500,    // 平日正常價格
                discount: 350   // 平日優惠價格
            },
            weekend: {
                normal: 700,    // 假日正常價格
                discount: 500   // 假日優惠價格
            },
            sundaySpecial: 350  // 週日特別優惠
        };

        this._uiState = {
            isVisible: false,
            currentView: null
        };

        this._formState = {
            eventHandlers: new Map(),
            isFormBound: false
        };

        this.initializeWarningSystem();
    }

    initializeWarningSystem() {
        // 添加預警圖例
        const warningLegend = `
            <div class="warning-legend">
                <div class="warning-item warning-30">
                    <span class="warning-dot"></span>
                    <span>30分鐘預警</span>
                </div>
                <div class="warning-item warning-15">
                    <span class="warning-dot"></span>
                    <span>15分鐘預警</span>
                </div>
                <div class="warning-item warning-5">
                    <span class="warning-dot"></span>
                    <span>5分鐘預警</span>
                </div>
            </div>
        `;
        document.querySelector('.table-container').insertAdjacentHTML('beforebegin', warningLegend);
    }

    updateRecordStatus(record) {
        const timeLeft = this.calculateTimeLeft(record.entryTime);
        if (timeLeft <= 5) {
            return { class: 'warning-5', text: '即將超時' };
        } else if (timeLeft <= 15) {
            return { class: 'warning-15', text: '注意時間' };
        } else if (timeLeft <= 30) {
            return { class: 'warning-30', text: '時間提醒' };
        }
        return { class: '', text: '使用中' };
    }

    renderLockerHistory(histories) {
        return `
            <div class="locker-history">
                ${histories.map(h => `
                    <div class="history-item">
                        <span>${h.time}</span>
                        <span>${h.oldLocker} → ${h.newLocker}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderFeeDetails(fees) {
        return `
            <div class="fee-panel">
                <div class="fee-header">
                    費用明細
                </div>
                <div class="fee-content">
                    <div class="fee-item">
                        <span>基本費用</span>
                        <span>$${fees.base}</span>
                    </div>
                    ${fees.additional.map(fee => `
                        <div class="fee-item">
                            <span>${fee.type}</span>
                            <span>$${fee.amount}</span>
                        </div>
                    `).join('')}
                    <div class="fee-total">
                        <span>總計</span>
                        <span>$${this.calculateTotal(fees)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    calculateTotal(fees) {
        return fees.base + fees.additional.reduce((sum, fee) => sum + fee.amount, 0);
    }

    // 更新表格渲染邏輯
    updateTableRow(record) {
        const status = this.updateRecordStatus(record);
        return `
            <tr class="${status.class}">
                <td>
                    <span class="status-text">${status.text}</span>
                </td>
                <td>${record.lockerNumber}
                    ${record.lockerChanges ? `
                        <span class="locker-change" onclick="showLockerHistory(${record.id})">
                            🔄
                        </span>
                    ` : ''}
                </td>
                <!-- ...其他欄位... -->
                <td>
                    <button onclick="showFeeDetails(${record.id})">
                        查看明細
                    </button>
                </td>
            </tr>
        `;
    }

    async moduleSetup() {
        try {
            if (this._initialized) {
                return true;
            }

            this.storage = this.getModule('storage');
            this.toast = this.getModule('toast');
            
            if (!this.storage || !this.toast) {
                throw new Error('必要模組未載入');
            }

            // 重設並初始化模組
            await this._initializeModule();
            
            console.debug('入場登記模組初始化完成');
            this._initialized = true;
            return true;
        } catch (error) {
            console.error('入場登記模組初始化失敗:', error);
            throw error;
        }
    }

    async _initializeModule() {
        // 清理舊的狀態
        this.reset();
        
        // 綁定核心事件
        this._bindCoreEvents();
        
        // 初始化時間顯示
        this._initTimeDisplay();
        
        // 設置表單驗證器
        this._setupFormValidation();

        // 初始化基本資訊區塊
        const basicInfoSection = document.querySelector('#entryForm .form-section:first-child');
        if (basicInfoSection) {
            basicInfoSection.innerHTML = `
                <h3 class="section-title">基本資訊</h3>
                <div class="form-group">
                    <label class="form-label" for="lockerNumber">置物櫃號碼</label>
                    <input type="number" 
                           id="lockerNumber" 
                           class="form-input"
                           min="1" 
                           max="500" 
                           required>
                </div>
            `;
        }

        // 初始化付款選項
        const paymentOptions = document.querySelector('.payment-options');
        if (paymentOptions) {
            paymentOptions.innerHTML = `
                <div class="payment-type">
                    <label class="radio-label">
                        <input type="radio" 
                               name="paymentType" 
                               value="cash" 
                               checked>
                        <span>現金付款</span>
                    </label>
                </div>
                <div class="payment-type">
                    <label class="radio-label">
                        <input type="radio" 
                               name="paymentType" 
                               value="ticket">
                        <span>票券使用</span>
                    </label>
                </div>
            `;
        }
    }

    _setupFormValidation() {
        const form = document.getElementById('entryForm');
        if (!form) return;

        const validateForm = (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            
            if (this._validateFormData(formData)) {
                this._processCheckin(formData);
            }
        };

        // 清理舊的事件監聽器
        if (this._formState.eventHandlers.has('submit')) {
            form.removeEventListener('submit', this._formState.eventHandlers.get('submit'));
        }

        // 設置新的事件監聽器
        this._formState.eventHandlers.set('submit', validateForm);
        form.addEventListener('submit', validateForm);
    }

    _processCheckin(formData) {
        const checkinData = {
            ticketNumber: formData.get('ticketNumber'),
            lockerNumber: formData.get('lockerNumber'),
            paymentType: formData.get('paymentType'),
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        // 儲存資料
        this.storage.setItem(`checkin_${Date.now()}`, checkinData)
            .then(() => {
                this.toast.success('入場登記成功！');
                this.emit('checkin:success', checkinData);
                this._resetForm();
            })
            .catch(error => {
                this.toast.error('入場登記失敗，請重試');
                this.emit('checkin:error', error);
            });
    }

    _resetForm() {
        const form = document.getElementById('entryForm');
        if (form) {
            form.reset();
            this.updateAmount();
        }
    }

    reset() {
        // 清理所有狀態
        this._uiState.isVisible = false;
        this._uiState.currentView = null;
        this.cleanupEventListeners();
        this.cleanupFormHandlers();
    }

    bindModuleEvents() {
        if (this._eventsBound) {
            return;
        }

        // 監聽登入事件
        this.on('auth:login', () => {
            this.updateUIState(true);
            this.initializeFormHandlers();
        });

        // 監聽登出事件
        this.on('auth:logout', () => {
            this.updateUIState(false);
            this.reset();
        });

        this._eventsBound = true;
    }

    updateUIState(isVisible) {
        this._uiState.isVisible = isVisible;
        const mainSystem = document.getElementById('mainSystem');
        if (mainSystem) {
            if (isVisible) {
                mainSystem.classList.remove('hidden-system');
            } else {
                mainSystem.classList.add('hidden-system');
            }
        }
    }

    cleanupEventListeners() {
        // 清理定時器
        if (this._timeUpdateInterval) {
            clearInterval(this._timeUpdateInterval);
            this._timeUpdateInterval = null;
        }

        // 清理表單事件
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            const newForm = entryForm.cloneNode(true);
            entryForm.parentNode.replaceChild(newForm, entryForm);
        }
    }

    initializeFormHandlers() {
        if (!this._initialized) {
            console.warn('模組未初始化，無法設置表單處理器');
            return;
        }

        const entryForm = document.getElementById('entryForm');
        if (!entryForm) {
            console.error('找不到入場表單元素');
            return;
        }

        // 綁定提交事件，使用箭頭函數確保 this 指向正確
        entryForm.addEventListener('submit', (e) => this.handleCheckin(e));
        
        // 綁定付款方式切換
        const paymentTypeInputs = entryForm.querySelectorAll('input[name="paymentType"]');
        paymentTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handlePaymentTypeChange(e));
        });

        // 初始化當前付款方式顯示
        const selectedPayment = entryForm.querySelector('input[name="paymentType"]:checked');
        if (selectedPayment) {
            this.handlePaymentTypeChange({ target: selectedPayment });
        }

        // 初始化金額顯示
        this.updateAmount();
    }

    cleanupFormHandlers() {
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.reset();
        }
    }

    async loadChartJS() {
        // 由於已經在 HTML 中引入，直接檢查 Chart 是否存在
        if (window.Chart) {
            return Promise.resolve();
        }
        
        // 如果 Chart 不存在，拋出錯誤
        return Promise.reject(new Error('Chart.js 未正確載入'));
    }

    async handleCheckin(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const checkinData = {
                ticketNumber: formData.get('ticketNumber'),
                lockerNumber: formData.get('lockerNumber'),
                paymentType: formData.get('paymentType'),
                timestamp: new Date().toISOString(),
                status: 'active'
            };

            // 驗證表單資料
            if (!this.validateCheckinData(checkinData)) {
                return;
            }

            // 儲存入場記錄
            await this.storage.setItem(`checkin_${Date.now()}`, checkinData);
            
            // 顯示成功訊息
            this.toast.success('入場登記成功！');
            
            // 重置表單
            event.target.reset();
            
            // 觸發入場成功事件
            this.emit('checkin:success', checkinData);

        } catch (error) {
            console.error('入場登記失敗:', error);
            this.toast.error('入場登記失敗，請重試');
            this.emit('checkin:error', error);
        }
    }

    validateCheckinData(data) {
        if (!data.lockerNumber) {
            this.toast.error('請輸入置物櫃編號');
            return false;
        }

        if (data.paymentType === 'ticket' && !data.ticketNumber) {
            this.toast.error('使用票券時必須輸入票券號碼');
            return false;
        }

        return true;
    }

    handlePaymentTypeChange(event) {
        const type = event.target.value;
        const ticketArea = document.querySelector('.ticket-payment-area');
        const cashArea = document.querySelector('.cash-payment-area');

        if (!ticketArea || !cashArea) {
            console.error('找不到付款區域元素');
            return;
        }

        if (type === 'ticket') {
            ticketArea.classList.remove('hidden');
            cashArea.classList.add('hidden');
            document.getElementById('amount').value = '';
        } else {
            ticketArea.classList.add('hidden');
            cashArea.classList.remove('hidden');
            this.updateAmount();
        }
    }

    updateAmount() {
        const amountInput = document.getElementById('amount');
        if (!amountInput) return;

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const day = now.getDay();

        let amount = this.calculatePrice(day, hour, minute);
        
        // 更新金額顯示
        if (amountInput) {
            amountInput.value = amount;
        }

        // 更新優惠提示
        this.updateDiscountAlert(day, hour, minute, amount);
    }

    calculatePrice(day, hour, minute) {
        const isWeekend = day === 0 || day === 6;
        const timeValue = hour + minute / 60;

        // 判斷是否在優惠時段 (18:30-19:30)
        const isDiscountTime = timeValue >= 18.5 && timeValue < 19.5;
        
        // 週日特別優惠時段 (13:30-15:30)
        const isSundaySpecial = day === 0 && timeValue >= 13.5 && timeValue < 15.5;

        if (isSundaySpecial) {
            return this.priceRules.sundaySpecial;
        }

        if (isWeekend) {
            return isDiscountTime ? this.priceRules.weekend.discount : this.priceRules.weekend.normal;
        }

        return isDiscountTime ? this.priceRules.weekday.discount : this.priceRules.weekday.normal;
    }

    updateDiscountAlert(day, hour, minute, amount) {
        const discountAlert = document.getElementById('discountAlert');
        const timeValue = hour + minute / 60;
        const isDiscountTime = timeValue >= 18.5 && timeValue < 19.5 || 
                              (day === 0 && timeValue >= 13.5 && timeValue < 15.5);

        if (discountAlert) {
            if (isDiscountTime) {
                discountAlert.style.display = 'flex';
                discountAlert.classList.remove('hidden');
                const priceElement = discountAlert.querySelector('.price');
                if (priceElement) {
                    priceElement.textContent = `${amount}元`;
                }
            } else {
                discountAlert.style.display = 'none';
                discountAlert.classList.add('hidden');
            }
        }
    }

    updateTimeDisplay() {
        const timeDisplay = document.querySelector('.current-time');
        if (timeDisplay) {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleString('zh-TW');
        }
    }

    async initializeChart() {
        const canvas = document.getElementById('checkinChart');
        if (!canvas) {
            console.warn('圖表容器未找到，跳過圖表初始化');
            return;
        }

        try {
            this.chartInstance = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '入場人數統計',
                        data: [],
                        borderColor: '#3b82f6',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } catch (error) {
            console.warn('圖表建立失敗:', error);
            throw error;
        }
    }

    destroy() {
        // 清理所有事件監聽器
        this._formState.eventHandlers.forEach((handler, event) => {
            const form = document.getElementById('entryForm');
            if (form) {
                form.removeEventListener(event, handler);
            }
        });
        
        // 清理定時器
        if (this._timeUpdateInterval) {
            clearInterval(this._timeUpdateInterval);
        }

        this._formState.eventHandlers.clear();
        this._initialized = false;
        this._eventsBound = false;

        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }
}

// 使用 core.registerModule 進行註冊
window.HimanSystem.core.registerModule('checkin', new CheckinModule());
