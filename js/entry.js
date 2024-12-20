// 確保模組只初始化一次
(function() {
    if (window.entryModule) return;
    
    // 基本入場登記功能
    function loadEntrySection() {
        console.log('開始載入入場登記區段');
        return new Promise((resolve, reject) => {
            try {
                const mainContent = document.getElementById('mainContent');
                if (!mainContent) {
                    throw new Error('找不到主要內容容器');
                }

                console.log('渲染入場登記表單');
                // 您原有的入場登記 HTML 內容
                mainContent.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h2>入場登記</h2>
                        </div>
                        <div class="card-body">
                            <!-- 優惠時段提示 -->
                            <div id="specialTimeInfo" class="special-time-card" style="display: none;">
                                <div class="special-time-header">
                                    <span class="special-time-title">優惠時段</span>
                                    <span class="special-time-price">NT$ <span id="specialTimePrice">350</span></span>
                                </div>
                                <div class="special-time-info">
                                    營業時間：18:30 - 19:30
                                </div>
                                <div class="time-limit-warning">
                                    ※ 優惠時段入場限制使用至隔日早上6:00
                                </div>
                            </div>
                            <form id="entryForm" novalidate> <!-- 添加 novalidate 屬性 -->
                                <div class="form-group">
                                    <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                                    <input type="number" id="lockerNumber" name="lockerNumber" min="1" max="300" class="form-control" required>
                                </div>

                                <div class="form-group">
                                    <label>付款方式</label>
                                    <div class="radio-group">
                                        <label class="radio-label">
                                            <input type="radio" name="paymentType" value="cash" checked>現金
                                        </label>
                                        <label class="radio-label">
                                            <input type="radio" name="paymentType" value="ticket">票券
                                        </label>
                                    </div>
                                </div>

                                <div id="cashFields">
                                    <div class="form-group">
                                        <label for="amount">金額</label>
                                        <div class="amount-input-group">
                                            <input type="number" id="amount" name="amount" class="form-control" value="500" min="0">
                                            <div class="amount-buttons">
                                                <button type="button" onclick="adjustAmount('add')" class="small-button">+</button>
                                                <button type="button" onclick="adjustAmount('subtract')" class="small-button">-</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="hours">使用時數</label>
                                        <div class="hours-input-group">
                                            <input type="number" id="hours" name="hours" class="form-control" value="24" min="1" max="24">
                                            <span class="unit">小時</span>
                                        </div>
                                    </div>
                                </div>

                                <div id="ticketFields" style="display: none;">
                                    <div class="form-group">
                                        <label for="ticketType">票券類型</label>
                                        <select id="ticketType" name="ticketType" class="form-control">
                                            <option value="regular">平日券 (24小時)</option>
                                            <option value="unlimited">暢遊券 (24小時)</option>
                                            <option value="event">優惠券 (24小時)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="ticketNumber">票券號碼</label>
                                        <input type="text" id="ticketNumber" name="ticketNumber" class="form-control">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="remarks">備註</label>
                                    <textarea id="remarks" name="remarks" class="form-control" rows="2"></textarea>
                                </div>

                                <button type="submit" class="primary-button">確認登記</button>
                            </form>
                        </div>
                    </div>
                `;

                console.log('初始化入場登記事件');
                initializeEntryEvents();
                console.log('入場登記載入完成');
                resolve();
            } catch (error) {
                console.error('入場登記載入失敗:', error);
                reject(error);
            }
        });
    }

    // 優惠時段設定
    const timeSlotPrices = {
        weekdayEvening: {
            name: '平日晚間優惠',
            price: 350,
            startTime: '18:30',
            endTime: '19:30',
            maxStayTime: '06:00', // 隔天早上6點
            days: [1, 2, 3, 4],  // 週一到週四
            description: '平日晚間優惠時段 (限制使用至隔日6點)'
        },
        weekendEvening: {
            name: '假日晚間優惠',
            price: 500,
            startTime: '18:30',
            endTime: '19:30',
            maxStayTime: '06:00', // 隔天早上6點
            days: [5, 6, 0],     // 週五、六、日
            description: '假日晚間優惠時段 (限制使用至隔日6點)'
        }
    };

    // 檢查特殊時段並計算結束時間
    function checkSpecialTimeSlot(date, settings) {
        const day = date.getDay();
        const time = date.getHours() * 100 + date.getMinutes();
        
        // 添加時間字串解析輔助函數
        function parseTimeString(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 100 + minutes;
        }
        
        for (const [key, slot] of Object.entries(settings.timeSlots)) {
            const startTime = parseTimeString(slot.startTime);
            const endTime = parseTimeString(slot.endTime);
            
            if (slot.days.includes(day) && time >= startTime && time <= endTime) {
                return key;
            }
        }
        return null;
    }

    // 計算到隔天早上6點的時數
    function calculateEndTime(date, settings) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(6, 0, 0, 0);
        
        const diffHours = (nextDay - date) / (1000 * 60 * 60);
        return {
            endTime: nextDay,
            hours: Math.ceil(diffHours)
        };
    }

    // 處理付款方式切換
    function handlePaymentTypeChange() {
        const cashFields = document.getElementById('cashFields');
        const ticketFields = document.getElementById('ticketFields');
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;

        if (paymentType === 'cash') {
            cashFields.style.display = 'block';
            ticketFields.style.display = 'none';

            const settings = window.storageManager.getSettings();
            const timeSlotKey = checkSpecialTimeSlot(new Date(), settings);
            
            if (timeSlotKey) {
                const slot = settings.timeSlots[timeSlotKey];
                document.getElementById('amount').value = slot.price;
                
                // 計算到隔天早上6點的時數
                const { hours } = calculateEndTime(new Date(), settings);
                
                document.getElementById('hours').value = hours;
                document.getElementById('hours').max = hours;
                document.getElementById('hours').disabled = true;
            } else {
                document.getElementById('amount').value = settings.basePrice;
                document.getElementById('hours').value = '24';
                document.getElementById('hours').max = '24';
                document.getElementById('hours').disabled = false;
            }
        } else {
            cashFields.style.display = 'none';
            ticketFields.style.display = 'block';

            // 票券固定24小時
            document.getElementById('hours').value = '24';
            document.getElementById('hours').disabled = true;
        }
    }

    // 加入金額調整功能
    function adjustAmount(action) {
        const amountInput = document.getElementById('amount');
        let currentAmount = parseInt(amountInput.value) || 0;
        // 使用 window.storageManager.getSettings() 取得設定
        const settings = window.storageManager?.getSettings() || { basePrice: 500 };
        const adjustStep = Math.ceil(settings.basePrice * 0.1);

        if (action === 'add') {
            currentAmount += adjustStep;
        } else if (action === 'subtract') {
            currentAmount = Math.max(0, currentAmount - adjustStep);
        }

        amountInput.value = currentAmount;
    }

    // 檢查是否為優惠時段
    function isSpecialTimeSlot() {
        const now = new Date();
        const day = now.getDay(); // 0-6，0是週日
        const time = now.getHours() * 100 + now.getMinutes();

        const isInTimeRange = time >= 1830 && time <= 1930;
        
        if (!isInTimeRange) return false;

        if ([1, 2, 3, 4].includes(day)) {
            return 'weekdayEvening';
        } else if ([5, 6, 0].includes(day)) {
            return 'weekendEvening';
        }

        return false;
    }

    // 修改處理表單提交
    async function handleEntrySubmit(e) {
        try {
            const formData = {
                lockerNumber: parseInt(document.getElementById('lockerNumber').value),
                paymentType: document.querySelector('input[name="paymentType"]:checked').value,
                amount: parseInt(document.getElementById('amount').value),
                hours: parseInt(document.getElementById('hours').value) || 24,
                remarks: document.getElementById('remarks').value,
                status: 'active',
                id: 'E' + Date.now(),
                entryTime: new Date().toISOString()
            };

            // 添加付款方式特定欄位
            if (formData.paymentType === 'ticket') {
                formData.ticketType = document.getElementById('ticketType').value;
                formData.ticketNumber = document.getElementById('ticketNumber').value;
            }

            // 表單驗證
            if (!validateFormData(formData)) {
                return;
            }

            // 設定預期結束時間
            const endTime = new Date();
            endTime.setHours(endTime.getHours() + formData.hours);
            formData.expectedEndTime = endTime.toISOString();

            // 儲存記錄
            if (!window.storageManager?.addEntry(formData)) {
                throw new Error('儲存入場記錄失敗');
            }

            // 重置表單
            e.target.reset();
            document.getElementById('amount').value = '500';
            document.getElementById('hours').value = '24';

            // 顯示成功訊息
            window.showToast('入場登記成功');

        } catch (error) {
            console.error('Entry submit error:', error);
            window.showToast(error.message || '登記失敗', 'error');
        }
    }

    // 修改表單驗證
    function validateFormData(formData) {
        try {
            // 基本驗證
            if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
                throw new Error('請輸入有效的櫃位號碼 (1-300)');
            }

            const settings = window.storageManager.getSettings();
            const timeSlotKey = checkSpecialTimeSlot(new Date(), settings);

            if (timeSlotKey) {
                const { hours } = calculateEndTime(new Date(), settings);
                if (formData.hours > hours) {
                    throw new Error(`優惠時段限制使用至隔日早上6點 (${hours}小時)`);
                }
            }

            // 付款方式驗證
            if (formData.paymentType === 'cash') {
                if (!formData.amount || formData.amount <= 0) {
                    throw new Error('請輸入有效金額');
                }
                if (!formData.hours || formData.hours < 1 || formData.hours > 24) {
                    throw new Error('使用時數必須在 1-24 小時之間');
                }
            } else if (formData.paymentType === 'ticket') {
                if (!formData.ticketNumber) {
                    throw new Error('請輸入票券號碼');
                }
            }

            return true;
        } catch (error) {
            window.showToast(error.message, 'error');
            return false;
        }
    }

    // 加入時數變更監聽
    function initializeEntryEvents() {
        console.log('開始初始化入場登記事件');
        
        // 綁定表單提交事件
        const form = document.getElementById('entryForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleEntrySubmit(e);
            });
        }

        // 綁定付款方式切換事件
        const paymentInputs = document.querySelectorAll('input[name="paymentType"]');
        paymentInputs.forEach(input => {
            input.addEventListener('change', handlePaymentTypeChange);
        });

        // 綁定時數變更事件
        const hoursInput = document.getElementById('hours');
        if (hoursInput) {
            hoursInput.addEventListener('change', () => {
                const hours = parseInt(hoursInput.value) || 3;
                const validHours = Math.min(Math.max(hours, 1), 24);
                hoursInput.value = validHours;
            });
        }

        // 綁定票券類型變更事件
        const ticketTypeSelect = document.getElementById('ticketType');
        if (ticketTypeSelect) {
            ticketTypeSelect.addEventListener('change', () => {
                document.getElementById('hours').value = '24';
            });
        }

        console.log('入場登記事件初始化完成');
    }

    function updateSpecialTimeStatus() {
        const settings = window.storageManager.getSettings();
        const timeSlotKey = checkSpecialTimeSlot(new Date(), settings);
        
        const statusElement = document.getElementById('specialTimeStatus');
        const specialTimeInfo = document.getElementById('specialTimeInfo');
        
        if (timeSlotKey) {
            const slot = settings.timeSlots[timeSlotKey];
            // 更新狀態欄
            if (statusElement) {
                statusElement.innerHTML = `
                    <div>
                        <span class="status-text">${slot.name}</span>
                        <span class="price">NT$ ${slot.price}</span>
                    </div>
                    <span class="time-limit">使用至隔日06:00</span>
                `;
                statusElement.style.display = 'block';
            }
            
            // 更新表單內的優惠提示
            if (specialTimeInfo) {
                document.getElementById('specialTimePrice').textContent = slot.price;
                specialTimeInfo.style.display = 'block';
            }
        } else {
            if (statusElement) statusElement.style.display = 'none';
            if (specialTimeInfo) specialTimeInfo.style.display = 'none';
        }
    }

    // 每分鐘更新優惠時段狀態
    setInterval(updateSpecialTimeStatus, 60000);

    // 確保所有必要的全域函數都正確掛載
    window.entryModule = {
        loadEntrySection,
        handlePaymentTypeChange,
        adjustAmount,
        isSpecialTimeSlot
    };

    // 掛載到全域
    Object.assign(window, window.entryModule);
    
    console.log('Entry module initialized');
})();

// 確保模組已掛載到全域
if (typeof window.loadEntrySection !== 'function') {
    window.loadEntrySection = loadEntrySection;
    console.log('入場登記模組已初始化');
}