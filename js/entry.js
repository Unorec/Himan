// 載入入場登記區段
<<<<<<< Updated upstream
function loadEntrySection() {
    const content = `
        <div class="section-container">
            <h2>入場登記</h2>
            <div class="entry-form">
                <div class="form-group">
                    <label>衣櫃號碼</label>
                    <input type="number" id="lockerNumber" min="1" max="100">
                </div>
                <button type="button" id="registerEntry" class="primary-button">登記入場</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    
    // 綁定事件處理
    document.getElementById('registerEntry').addEventListener('click', handleEntry);
}

function handleEntry() {
    const lockerNumber = document.getElementById('lockerNumber').value;
    if (!lockerNumber) {
        showToast('請輸入衣櫃號碼', 'error');
        return;
    }
    
    const entry = {
        locker: lockerNumber,
        time: new Date().toISOString(),
        status: 'active'
    };
    
    storageManager.addRecord(entry);
    showToast('入場登記成功', 'success');
    document.getElementById('lockerNumber').value = '';
}

// 確保函數可被全域訪問
window.loadEntrySection = loadEntrySection;

// 調整金額
function adjustAmount(action) {
    const amountInput = document.getElementById('amount');
    let currentAmount = parseInt(amountInput.value) || 0;
    
    const settings = storageManager.getSettings() || { basePrice: 300 };
    const adjustStep = Math.ceil(settings.basePrice * 0.1); // 以基本價的10%為調整單位

    if (action === 'add') {
        currentAmount += adjustStep;
    } else if (action === 'subtract') {
        currentAmount = Math.max(0, currentAmount - adjustStep);
    }

    amountInput.value = currentAmount;
}

// 設定預設金額
function setAmount(amount) {
    const amountInput = document.getElementById('amount');
    amountInput.value = Math.round(amount); // 四捨五入到整數
}

// 處理入場登記提交
async function handleEntrySubmit() {
    try {
        showLoading(true);

        // 取得表單數據
        const formData = {
            lockerNumber: parseInt(document.getElementById('lockerNumber').value),
            paymentType: document.querySelector('input[name="paymentType"]:checked').value,
            amount: document.getElementById('amount').value,
            ticketType: document.getElementById('ticketType')?.value,
            ticketNumber: document.getElementById('ticketNumber')?.value,
            remarks: document.getElementById('remarks').value,
            entryTime: new Date().toISOString(),
            status: 'active',
            id: generateEntryId()
        };

        // 驗證表單
        if (!validateEntryForm(formData)) {
            return;
        }

        // 儲存記錄
        if (storageManager.addEntry(formData)) {
            showToast('入場登記成功！');
            resetEntryForm();
        } else {
            throw new Error('儲存失敗');
        }

    } catch (error) {
        console.error('Entry registration error:', error);
        showToast(error.message || '登記失敗，請重試', 'error');
    } finally {
        showLoading(false);
    }
}

// 驗證表單
function validateEntryForm(formData) {
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    if (isLockerOccupied(formData.lockerNumber)) {
        showToast('此櫃位已被使用中', 'error');
        return false;
    }

    if (formData.paymentType === 'cash') {
        if (!formData.amount || formData.amount <= 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
    } else if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    // 檢查優惠時段的限制
    const timeSlotKey = isSpecialTimeSlot();
    if (timeSlotKey) {
        const slot = timeSlotPrices[timeSlotKey];
        if (formData.amount !== slot.price) {
            showToast(`優惠時段固定金額為 ${slot.price} 元`, 'error');
            return false;
        }
    }

    return true;
}

// 重置表單
function resetEntryForm() {
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    document.getElementById('amount').value = ''; // 清空金額輸入
    document.getElementById('hours').value = '24'; // 設定預設時數為 24
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    handlePaymentTypeChange();
}

// 檢查櫃位是否被使用
function isLockerOccupied(lockerNumber) {
    const entries = storageManager.getEntries() || [];
    return entries.some(entry => 
        entry.lockerNumber === lockerNumber && 
        ['active', 'temporary'].includes(entry.status)
    );
}

// 生成入場記錄ID
function generateEntryId() {
    return 'E' + Date.now();
}

// 將函數掛載到全域
window.handlePaymentTypeChange = handlePaymentTypeChange;
window.adjustAmount = adjustAmount;
window.setAmount = setAmount;
window.handleEntrySubmit = handleEntrySubmit;

// 初始化入場登記相關事件
function initializeEntryEvents() {
    // 付款方式切換事件
    const paymentRadios = document.querySelectorAll('input[name="paymentType"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', handlePaymentTypeChange);
    });

    // 櫃位號碼輸入驗證
    const lockerInput = document.getElementById('lockerNumber');
    if (lockerInput) {
        lockerInput.addEventListener('change', validateLockerNumber);
    }

    // 新增金額輸入框預設值設定
    const amountInput = document.getElementById('amount');
    if (amountInput && !amountInput.value) {
        const settings = storageManager.getSettings() || { basePrice: 500 };
        amountInput.value = settings.basePrice;
    }

    // 新增時數輸入事件監聽
    const hoursInput = document.getElementById('hours');
    if (hoursInput) {
        hoursInput.addEventListener('change', () => {
            updateAmountBasedOnHours();
        });
    }
}

function handlePaymentTypeChange() {
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    const cashFields = document.getElementById('cashFields');
    const ticketFields = document.getElementById('ticketFields');

    if (paymentType === 'cash') {
        cashFields.style.display = 'block';
        ticketFields.style.display = 'none';
    } else {
        cashFields.style.display = 'none';
        ticketFields.style.display = 'block';
    }
}

// 自動尋找可用櫃位
function findAvailableLocker() {
    const entries = storageManager.getEntries() || [];
    const settings = storageManager.getSettings();
    
    for (let i = 1; i <= settings.lockerCount; i++) {
        const isOccupied = entries.some(entry => 
            entry.lockerNumber === i && 
            (entry.status === 'active' || entry.status === 'temporary')
        );
        
        if (!isOccupied) {
            const lockerInput = document.getElementById('lockerNumber');
            if (lockerInput) {
                lockerInput.value = i;
                validateLockerNumber();
            }
            return;
        }
    }
    
    showToast('目前沒有可用櫃位', 'error');
}

// 驗證櫃位號碼
function validateLockerNumber() {
    const lockerInput = document.getElementById('lockerNumber');
    if (!lockerInput) return false;

    const lockerNumber = parseInt(lockerInput.value);
    
    // 更新櫃位範圍檢查
    if (!lockerNumber || lockerNumber < 1 || lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    // 檢查櫃位是否已被使用
    if (isLockerOccupied(lockerNumber)) {
        showToast('此櫃位已被使用中', 'error');
        return false;
    }

    return true;
}

// 檢查櫃位是否被使用
function isLockerOccupied(lockerNumber) {
    const entries = storageManager.getEntries() || [];
    return entries.some(entry => 
        entry.lockerNumber === lockerNumber && 
        (entry.status === 'active' || entry.status === 'temporary')
    );
}

// 處理入場登記提交
async function handleEntrySubmit() {
    showLoading(true);

    try {
        // 取得表單數據
        const formData = getEntryFormData();

        // 驗證表單
        if (!validateEntryForm(formData)) {
            return;
        }

        // 建立入場記錄
        const entry = {
            ...formData,
            entryTime: new Date().toISOString(),
            status: 'active',
            id: generateEntryId()
        };

        // 儲存記錄
        if (storageManager.addEntry(entry)) {
            resetEntryForm();
            showToast('入場登記成功！');
        } else {
            throw new Error('儲存記錄失敗');
        }

    } catch (error) {
        console.error('Entry registration error:', error);
        showToast('登記失敗，請重試', 'error');
    } finally {
        showLoading(false);
    }
}

// 取得表單數據
function getEntryFormData() {
    const currentTime = new Date();
    const hours = parseInt(document.getElementById('hours').value) || 3;
    
    // 確保時數在有效範圍內
    const validHours = Math.min(Math.max(hours, 1), 24);
    
    const data = {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        hours: validHours,
        entryTime: currentTime.toISOString(),
        expectedEndTime: new Date(currentTime.getTime() + validHours * 60 * 60 * 1000).toISOString(),
        remarks: document.getElementById('remarks').value || '',
        status: 'active',
        id: generateEntryId()
    };

    if (data.paymentType === 'cash') {
        data.amount = parseFloat(document.getElementById('amount').value) || 500; // 使用預設金額 500
    } else {
        data.ticketType = document.getElementById('ticketType').value;
        data.ticketNumber = document.getElementById('ticketNumber').value;
        // 根據票券類型設定對應時數
        const ticketHours = {
            'regular': 24,
            'unlimited': 24,
            'event': 24
        }[data.ticketType] || 24;
        data.hours = ticketHours;
        data.expectedEndTime = new Date(currentTime.getTime() + ticketHours * 60 * 60 * 1000).toISOString();
    }

    return data;
}

// 驗證入場表單
function validateEntryForm(formData) {
    // 櫃位驗證
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    // 使用時數驗證
    if (!formData.hours || formData.hours < 1 || formData.hours > 24) {
        showToast('請輸入有效的使用時數 (1-24小時)', 'error');
        return false;
    }

    // 付款方式驗證
    if (formData.paymentType === 'cash') {
        if (!formData.amount || formData.amount < 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
        
        // 檢查金額是否符合最低收費標準
        const settings = storageManager.getSettings() || { basePrice: 500 };
        if (amount < settings.basePrice) {
            showToast(`金額不得低於基本收費 ${settings.basePrice} 元`, 'error');
            return false;
        }
    } else if (formData.paymentType === 'ticket') {
        if (!formData.ticketType) {
            showToast('請選擇票券類型', 'error');
            return false;
        }
        if (!formData.ticketNumber) {
            showToast('請輸入票券號碼', 'error');
            return false;
        }
    }

    // 檢查優惠時段的限制
    const timeSlotKey = isSpecialTimeSlot();
    if (timeSlotKey) {
        const slot = timeSlotPrices[timeSlotKey];
        if (formData.amount !== slot.price) {
            showToast(`優惠時段固定金額為 ${slot.price} 元`, 'error');
            return false;
        }
    }

    return true;
}

// 時段費用設定
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

// 修改入場登記區段載入函數
=======
>>>>>>> Stashed changes
async function loadEntrySection() {
    const mainContent = document.getElementById('mainContent');
    const settings = storageManager.getSettings() || { basePrice: 500 };

    const entryHTML = `
        <div class="card">
            <div class="card-header">
                <h2>入場登記</h2>
            </div>
            <div class="card-body">
<<<<<<< Updated upstream
                <form id="entryForm" onsubmit="event.preventDefault(); handleEntrySubmit();">
                    <div class="form-group">
                        <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                        <input type="number" id="lockerNumber" min="1" max="300" class="form-control" required>
                    </div>
                    
                    <!-- 時段選擇 -->
                    <div class="form-group">
                        <label>入場時段及時數</label>
                        <div class="time-slots">
                            ${Object.entries(timeSlotPrices).map(([key, slot]) => `
                                <div class="time-slot-card" onclick="selectTimeSlot('${key}')">
                                    <div class="slot-header">${slot.name}</div>
                                    <div class="slot-time">${slot.startTime} - ${slot.endTime}</div>
                                    <div class="slot-price">$${slot.price}</div>
                                    <div class="slot-hours">${slot.hours}小時</div>
                                    <div class="slot-description">${slot.description}</div>
                                </div>
                            `).join('')}
=======
                <div class="form-group">
                    <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                    <input type="number" id="lockerNumber" min="1" max="300" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>付款方式</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="paymentType" value="cash" checked 
                                   onchange="handlePaymentTypeChange()">
                            現金
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="paymentType" value="ticket" 
                                   onchange="handlePaymentTypeChange()">
                            票券
                        </label>
                    </div>
                </div>

                <!-- 現金付款區塊 -->
                <div id="cashFields">
                    <div class="form-group">
                        <label for="amount">金額</label>
                        <div class="amount-input-group">
                            <input type="number" id="amount" class="form-control" 
                                   placeholder="請輸入金額" min="0">
                        </div>
                        ${isSpecialTimeSlot() ? `
                            <div class="special-price-notice">
                                目前為優惠時段：${getCurrentSpecialPrice()}
                            </div>
                        ` : ''}
                    </div>
                    <div class="form-group">
                        <label for="hours">使用時數</label>
                        <div class="hours-input-group">
                            <input type="number" id="hours" class="form-control" 
                                   value="24" min="1" max="24">
                            <span class="unit">小時</span>
>>>>>>> Stashed changes
                        </div>
                    </div>

<<<<<<< Updated upstream
                    <div class="form-group">
                        <label>付款方式</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="paymentType" value="cash" checked 
                                       onchange="handlePaymentTypeChange()">
                                現金
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="paymentType" value="ticket" 
                                       onchange="handlePaymentTypeChange()">
                                票券
                            </label>
                        </div>
=======
                <!-- 票券付款區塊 -->
                <div id="ticketFields" style="display: none;">
                    <div class="form-group">
                        <label for="ticketType">票券類型</label>
                        <select id="ticketType" class="form-control" onchange="handleTicketTypeChange()">
                            <option value="regular">平日券 (24小時)</option>
                            <option value="unlimited">暢遊券 (24小時)</option>
                            <option value="event">活動券 (24小時)</option>
                        </select>
>>>>>>> Stashed changes
                    </div>

                    <!-- 現金付款區塊 -->
                    <div id="cashFields">
                        <div class="form-group">
                            <label for="amount">金額</label>
                            <div class="amount-input-group">
                                <input type="number" id="amount" class="form-control" 
                                       value="${settings.basePrice}" min="0">
                                <div class="amount-buttons">
                                    <button onclick="adjustAmount('add')" type="button" class="small-button">+</button>
                                    <button onclick="adjustAmount('subtract')" type="button" class="small-button">-</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="hours">使用時數</label>
                            <div class="hours-input-group">
                                <input type="number" id="hours" class="form-control" 
                                       value="3" min="1" max="24">
                                <span class="unit">小時</span>
                            </div>
                        </div>
                    </div>

                    <!-- 票券付款區塊 -->
                    <div id="ticketFields" style="display: none;">
                        <div class="form-group">
                            <label for="ticketType">票券類型</label>
                            <select id="ticketType" class="form-control" onchange="handleTicketTypeChange()">
                                <option value="regular">平日券 (24小時)</option>
                                <option value="unlimited">暢遊券 (24小時)</option>
                                <option value="event">活動券 (24小時)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="ticketNumber">票券號碼</label>
                            <input type="text" id="ticketNumber" class="form-control" 
                                   placeholder="請輸入票券號碼">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="remarks">備註說明</label>
                        <textarea id="remarks" class="form-control" rows="2" 
                                 placeholder="可輸入特殊需求或備註說明"></textarea>
                    </div>

<<<<<<< Updated upstream
                    <div class="form-group">
                        <label for="purposeOfVisit">來訪目的</label>
                        <textarea id="purposeOfVisit" class="form-control" 
                            rows="3" placeholder="請輸入來訪目的"></textarea>
                    </div>
                    <button type="submit" class="primary-button" id="submitButton">
                        <span class="button-text">確認登記</span>
                    </button>
                </form>
=======
                <div class="form-group">
                    <label for="remarks">備註說明</label>
                    <textarea id="remarks" class="form-control" rows="2" 
                             placeholder="可輸入特殊需求或備註說明"></textarea>
                </div>

                <button onclick="handleEntrySubmit()" class="primary-button">
                    確認登記
                </button>
>>>>>>> Stashed changes
            </div>
        </div>
    `;

    mainContent.innerHTML = entryHTML;
    initializeEntryEvents();
<<<<<<< Updated upstream

    // 添加按鈕狀態處理
    const submitButton = document.getElementById('submitButton');
    const purposeInput = document.getElementById('purposeOfVisit');
    
    if (submitButton && purposeInput) {
        purposeInput.addEventListener('input', () => {
            submitButton.disabled = !purposeInput.value.trim();
        });
    }
}

// 選擇時段
function selectTimeSlot(slotKey) {
    const slot = timeSlotPrices[slotKey];
    if (!slot) return;

    // 更新金額和時數
    document.getElementById('amount').value = slot.price;
    document.getElementById('hours').value = slot.hours;

    // 視覺反饋
    document.querySelectorAll('.time-slot-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

// 處理票券類型變更
function handleTicketTypeChange() {
    const ticketType = document.getElementById('ticketType').value;
    const hoursMap = {
        'regular': 24,
        'unlimited': 24,
        'event': 24
    };
    
    const hours = hoursMap[ticketType] || 24;
    
    if (document.getElementById('hours')) {
        document.getElementById('hours').value = hours;
=======
}

// 調整金額
function adjustAmount(action) {
    const amountInput = document.getElementById('amount');
    let currentAmount = parseInt(amountInput.value) || 0;
    
    const settings = storageManager.getSettings() || { basePrice: 300 };
    const adjustStep = Math.ceil(settings.basePrice * 0.1); // 以基本價的10%為調整單位

    if (action === 'add') {
        currentAmount += adjustStep;
    } else if (action === 'subtract') {
        currentAmount = Math.max(0, currentAmount - adjustStep);
    }

    amountInput.value = currentAmount;
}

// 設定預設金額
function setAmount(amount) {
    const amountInput = document.getElementById('amount');
    amountInput.value = Math.round(amount); // 四捨五入到整數
}

// 處理入場登記提交
async function handleEntrySubmit() {
    try {
        showLoading(true);

        // 取得表單數據
        const formData = {
            lockerNumber: parseInt(document.getElementById('lockerNumber').value),
            paymentType: document.querySelector('input[name="paymentType"]:checked').value,
            amount: document.getElementById('amount').value,
            ticketType: document.getElementById('ticketType')?.value,
            ticketNumber: document.getElementById('ticketNumber')?.value,
            remarks: document.getElementById('remarks').value,
            entryTime: new Date().toISOString(),
            status: 'active',
            id: generateEntryId()
        };

        // 驗證表單
        if (!validateEntryForm(formData)) {
            return;
        }

        // 儲存記錄
        if (storageManager.addEntry(formData)) {
            showToast('入場登記成功！');
            resetEntryForm();
        } else {
            throw new Error('儲存失敗');
        }

    } catch (error) {
        console.error('Entry registration error:', error);
        showToast(error.message || '登記失敗，請重試', 'error');
    } finally {
        showLoading(false);
    }
}

// 驗證表單
function validateEntryForm(formData) {
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    if (isLockerOccupied(formData.lockerNumber)) {
        showToast('此櫃位已被使用中', 'error');
        return false;
    }

    if (formData.paymentType === 'cash') {
        if (!formData.amount || formData.amount <= 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
    } else if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    // 檢查優惠時段的限制
    const timeSlotKey = isSpecialTimeSlot();
    if (timeSlotKey) {
        const slot = timeSlotPrices[timeSlotKey];
        if (formData.amount !== slot.price) {
            showToast(`優惠時段固定金額為 ${slot.price} 元`, 'error');
            return false;
        }
    }

    return true;
}

// 重置表單
function resetEntryForm() {
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    document.getElementById('amount').value = ''; // 清空金額輸入
    document.getElementById('hours').value = '24'; // 設定預設時數為 24
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    handlePaymentTypeChange();
}

// 檢查櫃位是否被使用
function isLockerOccupied(lockerNumber) {
    const entries = storageManager.getEntries() || [];
    return entries.some(entry => 
        entry.lockerNumber === lockerNumber && 
        ['active', 'temporary'].includes(entry.status)
    );
}

// 生成入場記錄ID
function generateEntryId() {
    return 'E' + Date.now();
}

// 將函數掛載到全域
window.handlePaymentTypeChange = handlePaymentTypeChange;
window.adjustAmount = adjustAmount;
window.setAmount = setAmount;
window.handleEntrySubmit = handleEntrySubmit;

// 初始化入場登記相關事件
function initializeEntryEvents() {
    // 付款方式切換事件
    const paymentRadios = document.querySelectorAll('input[name="paymentType"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', handlePaymentTypeChange);
    });

    // 櫃位號碼輸入驗證
    const lockerInput = document.getElementById('lockerNumber');
    if (lockerInput) {
        lockerInput.addEventListener('change', validateLockerNumber);
>>>>>>> Stashed changes
    }

    // 新增金額輸入框預設值設定
    const amountInput = document.getElementById('amount');
    if (amountInput && !amountInput.value) {
        const settings = storageManager.getSettings() || { basePrice: 500 };
        amountInput.value = settings.basePrice;
    }

    // 新增時數輸入事件監聽
    const hoursInput = document.getElementById('hours');
    if (hoursInput) {
        hoursInput.addEventListener('change', () => {
            updateAmountBasedOnHours();
        });
    }
}

<<<<<<< Updated upstream
// 修改表單驗證
function validateEntryForm(formData) {
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    if (isLockerOccupied(formData.lockerNumber)) {
        showToast('此櫃位已被使用中', 'error');
        return false;
    }

    if (!formData.hours || formData.hours < 1 || formData.hours > 24) {
        showToast('請輸入有效的使用時數 (1-24小時)', 'error');
        return false;
    }

    if (formData.paymentType === 'cash') {
        if (!formData.amount || formData.amount <= 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
        
        // 檢查金額是否符合最低收費標準
        const settings = storageManager.getSettings() || { basePrice: 500 };
        if (amount < settings.basePrice) {
            showToast(`金額不得低於基本收費 ${settings.basePrice} 元`, 'error');
            return false;
        }
    } else if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    // 檢查優惠時段的限制
    const timeSlotKey = isSpecialTimeSlot();
    if (timeSlotKey) {
        const slot = timeSlotPrices[timeSlotKey];
        if (formData.amount !== slot.price) {
            showToast(`優惠時段固定金額為 ${slot.price} 元`, 'error');
            return false;
        }
    }

    return true;
}

// 修改取得表單數據函數
function getEntryFormData() {
    const currentTime = new Date();
    const hours = parseInt(document.getElementById('hours').value) || 3;
    
    // 確保時數在有效範圍內
    const validHours = Math.min(Math.max(hours, 1), 24);
    
    return {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        amount: parseInt(document.getElementById('amount').value),
        ticketType: document.getElementById('ticketType')?.value,
        ticketNumber: document.getElementById('ticketNumber')?.value,
        hours: validHours,
        entryTime: currentTime.toISOString(),
        expectedEndTime: new Date(currentTime.getTime() + hours * 60 * 60 * 1000).toISOString(),
        remarks: document.getElementById('remarks').value,
        status: 'active',
        id: generateEntryId()
    };
}

// 將新函數掛載到全域
window.selectTimeSlot = selectTimeSlot;
window.handleTicketTypeChange = handleTicketTypeChange;

// 判斷是否為優惠時段
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

// 獲取當前優惠價格
function getCurrentSpecialPrice() {
    const timeSlotKey = isSpecialTimeSlot();
    if (!timeSlotKey) return null;

    const slot = timeSlotPrices[timeSlotKey];
    return `${slot.name} - ${slot.price}元 (限制使用至隔日早上6點)`;
}

// 新增根據時數更新金額的函數
function updateAmountBasedOnHours() {
    const hoursInput = document.getElementById('hours');
    const amountInput = document.getElementById('amount');
    const settings = storageManager.getSettings() || { basePrice: 500 };

    if (hoursInput && amountInput) {
        const hours = parseInt(hoursInput.value) || 3;
        // 確保時數在1-24之間
        const validHours = Math.min(Math.max(hours, 1), 24);
        hoursInput.value = validHours;
        
        // 計算金額：基本價格為500，超過3小時每小時加收100
        let calculatedAmount = settings.basePrice;
        if (validHours > 3) {
            calculatedAmount += (validHours - 3) * 100;
        }
        
        amountInput.value = calculatedAmount;
    }
}

// 修改處理入場登記提交函數中的表單驗證
function validateEntryForm(formData) {
    // ...existing code...

    if (formData.paymentType === 'cash') {
        const amount = parseInt(formData.amount);
        if (isNaN(amount)) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
    }

    // ...existing code...
}

// 修改取得表單資料函數
function getEntryFormData() {
    const currentTime = new Date();
    const settings = storageManager.getSettings() || { basePrice: 500 };
    
    const formData = {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        hours: parseInt(document.getElementById('hours').value) || 3,
        entryTime: currentTime.toISOString(),
        remarks: document.getElementById('remarks').value || '',
        status: 'active',
        id: generateEntryId()
    };

    if (formData.paymentType === 'cash') {
        formData.amount = parseInt(document.getElementById('amount').value) || settings.basePrice;
    } else {
        formData.ticketType = document.getElementById('ticketType').value;
        formData.ticketNumber = document.getElementById('ticketNumber').value;
    }

    // 計算預期結束時間
    formData.expectedEndTime = new Date(currentTime.getTime() + formData.hours * 60 * 60 * 1000).toISOString();

    return formData;
}

// 修改重置表單函數
function resetEntryForm() {
    const settings = storageManager.getSettings() || { basePrice: 500 };
    
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    document.getElementById('amount').value = settings.basePrice;
    document.getElementById('hours').value = '3';
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    handlePaymentTypeChange();
}
    document.getElementById('lockerNumber').value = '';

// 確保所有必要的函數都被導出到全域
window.loadEntrySection = loadEntrySection;
window.handleEntrySubmit = handleEntrySubmit;
window.validateEntryForm = validateEntryForm;
window.handlePaymentTypeChange = handlePaymentTypeChange;
function handleError(error) {
    document.getElementById('remarks').value = '';
    showToast(error.message || '操作失敗，請重試', 'error');
    document.getElementById('hours').value = '3';
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    handlePaymentTypeChange();
}

async function handleEntrySubmit() {
    showLoading(true);
    try {
        // 取得表單數據
        const formData = {
            lockerNumber: parseInt(document.getElementById('lockerNumber').value),
            paymentType: document.querySelector('input[name="paymentType"]:checked').value,
            amount: document.getElementById('amount').value,
            ticketType: document.getElementById('ticketType')?.value,
            ticketNumber: document.getElementById('ticketNumber')?.value,
            remarks: document.getElementById('remarks').value,
            entryTime: new Date().toISOString(),
            status: 'active',
            id: generateEntryId()
        };

        // 驗證表單
        if (!validateEntryForm(formData)) {
            return;
        }

        // 儲存記錄
        if (storageManager.addEntry(formData)) {
            showToast('入場登記成功！');
            resetEntryForm();
        } else {
            throw new Error('儲存失敗');
        }
    } catch (error) {
        handleError(error);
        console.error('Entry Error:', error);
    } finally {
        showLoading(false);
    }
=======
function handlePaymentTypeChange() {
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    const cashFields = document.getElementById('cashFields');
    const ticketFields = document.getElementById('ticketFields');

    if (paymentType === 'cash') {
        cashFields.style.display = 'block';
        ticketFields.style.display = 'none';
    } else {
        cashFields.style.display = 'none';
        ticketFields.style.display = 'block';
    }
}

// 自動尋找可用櫃位
function findAvailableLocker() {
    const entries = storageManager.getEntries() || [];
    const settings = storageManager.getSettings();
    
    for (let i = 1; i <= settings.lockerCount; i++) {
        const isOccupied = entries.some(entry => 
            entry.lockerNumber === i && 
            (entry.status === 'active' || entry.status === 'temporary')
        );
        
        if (!isOccupied) {
            const lockerInput = document.getElementById('lockerNumber');
            if (lockerInput) {
                lockerInput.value = i;
                validateLockerNumber();
            }
            return;
        }
    }
    
    showToast('目前沒有可用櫃位', 'error');
}

// 驗證櫃位號碼
function validateLockerNumber() {
    const lockerInput = document.getElementById('lockerNumber');
    if (!lockerInput) return false;

    const lockerNumber = parseInt(lockerInput.value);
    
    // 更新櫃位範圍檢查
    if (!lockerNumber || lockerNumber < 1 || lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    // 檢查櫃位是否已被使用
    if (isLockerOccupied(lockerNumber)) {
        showToast('此櫃位已被使用中', 'error');
        return false;
    }

    return true;
}

// 檢查櫃位是否被使用
function isLockerOccupied(lockerNumber) {
    const entries = storageManager.getEntries() || [];
    return entries.some(entry => 
        entry.lockerNumber === lockerNumber && 
        (entry.status === 'active' || entry.status === 'temporary')
    );
}

// 處理入場登記提交
async function handleEntrySubmit() {
    showLoading(true);

    try {
        // 取得表單數據
        const formData = getEntryFormData();

        // 驗證表單
        if (!validateEntryForm(formData)) {
            return;
        }

        // 建立入場記錄
        const entry = {
            ...formData,
            entryTime: new Date().toISOString(),
            status: 'active',
            id: generateEntryId()
        };

        // 儲存記錄
        if (storageManager.addEntry(entry)) {
            resetEntryForm();
            showToast('入場登記成功！');
        } else {
            throw new Error('儲存記錄失敗');
        }

    } catch (error) {
        console.error('Entry registration error:', error);
        showToast('登記失敗，請重試', 'error');
    } finally {
        showLoading(false);
    }
}

// 取得表單數據
function getEntryFormData() {
    const currentTime = new Date();
    const hours = parseInt(document.getElementById('hours').value) || 3;
    
    // 確保時數在有效範圍內
    const validHours = Math.min(Math.max(hours, 1), 24);
    
    const data = {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        hours: validHours,
        entryTime: currentTime.toISOString(),
        expectedEndTime: new Date(currentTime.getTime() + validHours * 60 * 60 * 1000).toISOString(),
        remarks: document.getElementById('remarks').value || '',
        status: 'active',
        id: generateEntryId()
    };

    if (data.paymentType === 'cash') {
        data.amount = parseFloat(document.getElementById('amount').value) || 500; // 使用預設金額 500
    } else {
        data.ticketType = document.getElementById('ticketType').value;
        data.ticketNumber = document.getElementById('ticketNumber').value;
        // 根據票券類型設定對應時數
        const ticketHours = {
            'regular': 24,
            'unlimited': 24,
            'event': 24
        }[data.ticketType] || 24;
        data.hours = ticketHours;
        data.expectedEndTime = new Date(currentTime.getTime() + ticketHours * 60 * 60 * 1000).toISOString();
    }

    return data;
}

// 驗證入場表單
function validateEntryForm(formData) {
    // 櫃位驗證
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    // 使用時數驗證
    if (!formData.hours || formData.hours < 1 || formData.hours > 24) {
        showToast('請輸入有效的使用時數 (1-24小時)', 'error');
        return false;
    }

    // 付款方式驗證
    if (formData.paymentType === 'cash') {
        if (!formData.amount || formData.amount < 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
        
        // 檢查金額是否符合最低收費標準
        const settings = storageManager.getSettings() || { basePrice: 500 };
        if (amount < settings.basePrice) {
            showToast(`金額不得低於基本收費 ${settings.basePrice} 元`, 'error');
            return false;
        }
    } else if (formData.paymentType === 'ticket') {
        if (!formData.ticketType) {
            showToast('請選擇票券類型', 'error');
            return false;
        }
        if (!formData.ticketNumber) {
            showToast('請輸入票券號碼', 'error');
            return false;
        }
    }

    // 檢查優惠時段的限制
    const timeSlotKey = isSpecialTimeSlot();
    if (timeSlotKey) {
        const slot = timeSlotPrices[timeSlotKey];
        if (formData.amount !== slot.price) {
            showToast(`優惠時段固定金額為 ${slot.price} 元`, 'error');
            return false;
        }
    }

    return true;
}

// 時段費用設定
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

// 修改入場登記區段載入函數
async function loadEntrySection() {
    const mainContent = document.getElementById('mainContent');
    const settings = storageManager.getSettings() || { basePrice: 500 };

    const entryHTML = `
        <div class="card">
            <div class="card-header">
                <h2>入場登記</h2>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                    <input type="number" id="lockerNumber" min="1" max="300" class="form-control" required>
                </div>
                
                <!-- 時段選擇 -->
                <div class="form-group">
                    <label>入場時段及時數</label>
                    <div class="time-slots">
                        ${Object.entries(timeSlotPrices).map(([key, slot]) => `
                            <div class="time-slot-card" onclick="selectTimeSlot('${key}')">
                                <div class="slot-header">${slot.name}</div>
                                <div class="slot-time">${slot.startTime} - ${slot.endTime}</div>
                                <div class="slot-price">$${slot.price}</div>
                                <div class="slot-hours">${slot.hours}小時</div>
                                <div class="slot-description">${slot.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label>付款方式</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="paymentType" value="cash" checked 
                                   onchange="handlePaymentTypeChange()">
                            現金
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="paymentType" value="ticket" 
                                   onchange="handlePaymentTypeChange()">
                            票券
                        </label>
                    </div>
                </div>

                <!-- 現金付款區塊 -->
                <div id="cashFields">
                    <div class="form-group">
                        <label for="amount">金額</label>
                        <div class="amount-input-group">
                            <input type="number" id="amount" class="form-control" 
                                   value="${settings.basePrice}" min="0">
                            <div class="amount-buttons">
                                <button onclick="adjustAmount('add')" type="button" class="small-button">+</button>
                                <button onclick="adjustAmount('subtract')" type="button" class="small-button">-</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="hours">使用時數</label>
                        <div class="hours-input-group">
                            <input type="number" id="hours" class="form-control" 
                                   value="3" min="1" max="24">
                            <span class="unit">小時</span>
                        </div>
                    </div>
                </div>

                <!-- 票券付款區塊 -->
                <div id="ticketFields" style="display: none;">
                    <div class="form-group">
                        <label for="ticketType">票券類型</label>
                        <select id="ticketType" class="form-control" onchange="handleTicketTypeChange()">
                            <option value="regular">平日券 (24小時)</option>
                            <option value="unlimited">暢遊券 (24小時)</option>
                            <option value="event">活動券 (24小時)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ticketNumber">票券號碼</label>
                        <input type="text" id="ticketNumber" class="form-control" 
                               placeholder="請輸入票券號碼">
                    </div>
                </div>

                <div class="form-group">
                    <label for="remarks">備註說明</label>
                    <textarea id="remarks" class="form-control" rows="2" 
                             placeholder="可輸入特殊需求或備註說明"></textarea>
                </div>

                <button onclick="handleEntrySubmit()" class="primary-button">確認登記</button>
            </div>
        </div>
    `;

    mainContent.innerHTML = entryHTML;
    initializeEntryEvents();
}

// 選擇時段
function selectTimeSlot(slotKey) {
    const slot = timeSlotPrices[slotKey];
    if (!slot) return;

    // 更新金額和時數
    document.getElementById('amount').value = slot.price;
    document.getElementById('hours').value = slot.hours;

    // 視覺反饋
    document.querySelectorAll('.time-slot-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

// 處理票券類型變更
function handleTicketTypeChange() {
    const ticketType = document.getElementById('ticketType').value;
    const hoursMap = {
        'regular': 24,
        'unlimited': 24,
        'event': 24
    };
    
    const hours = hoursMap[ticketType] || 24;
    
    if (document.getElementById('hours')) {
        document.getElementById('hours').value = hours;
    }
}

// 修改表單驗證
function validateEntryForm(formData) {
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 300) {
        showToast('請輸入有效的櫃位號碼 (1-300)', 'error');
        return false;
    }

    if (isLockerOccupied(formData.lockerNumber)) {
        showToast('此櫃位已被使用中', 'error');
        return false;
    }

    if (!formData.hours || formData.hours < 1 || formData.hours > 24) {
        showToast('請輸入有效的使用時數 (1-24小時)', 'error');
        return false;
    }

    if (formData.paymentType === 'cash') {
        if (!formData.amount || formData.amount <= 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
        
        // 檢查金額是否符合最低收費標準
        const settings = storageManager.getSettings() || { basePrice: 500 };
        if (amount < settings.basePrice) {
            showToast(`金額不得低於基本收費 ${settings.basePrice} 元`, 'error');
            return false;
        }
    } else if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    // 檢查優惠時段的限制
    const timeSlotKey = isSpecialTimeSlot();
    if (timeSlotKey) {
        const slot = timeSlotPrices[timeSlotKey];
        if (formData.amount !== slot.price) {
            showToast(`優惠時段固定金額為 ${slot.price} 元`, 'error');
            return false;
        }
    }

    return true;
}

// 修改取得表單數據函數
function getEntryFormData() {
    const currentTime = new Date();
    const hours = parseInt(document.getElementById('hours').value) || 3;
    
    // 確保時數在有效範圍內
    const validHours = Math.min(Math.max(hours, 1), 24);
    
    return {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        amount: parseInt(document.getElementById('amount').value),
        ticketType: document.getElementById('ticketType')?.value,
        ticketNumber: document.getElementById('ticketNumber')?.value,
        hours: validHours,
        entryTime: currentTime.toISOString(),
        expectedEndTime: new Date(currentTime.getTime() + hours * 60 * 60 * 1000).toISOString(),
        remarks: document.getElementById('remarks').value,
        status: 'active',
        id: generateEntryId()
    };
}

// 將新函數掛載到全域
window.selectTimeSlot = selectTimeSlot;
window.handleTicketTypeChange = handleTicketTypeChange;

// 判斷是否為優惠時段
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

// 獲取當前優惠價格
function getCurrentSpecialPrice() {
    const timeSlotKey = isSpecialTimeSlot();
    if (!timeSlotKey) return null;

    const slot = timeSlotPrices[timeSlotKey];
    return `${slot.name} - ${slot.price}元 (限制使用至隔日早上6點)`;
}

// 新增根據時數更新金額的函數
function updateAmountBasedOnHours() {
    const hoursInput = document.getElementById('hours');
    const amountInput = document.getElementById('amount');
    const settings = storageManager.getSettings() || { basePrice: 500 };

    if (hoursInput && amountInput) {
        const hours = parseInt(hoursInput.value) || 3;
        // 確保時數在1-24之間
        const validHours = Math.min(Math.max(hours, 1), 24);
        hoursInput.value = validHours;
        
        // 計算金額：基本價格為500，超過3小時每小時加收100
        let calculatedAmount = settings.basePrice;
        if (validHours > 3) {
            calculatedAmount += (validHours - 3) * 100;
        }
        
        amountInput.value = calculatedAmount;
    }
}

// 修改處理入場登記提交函數中的表單驗證
function validateEntryForm(formData) {
    // ...existing code...

    if (formData.paymentType === 'cash') {
        const amount = parseInt(formData.amount);
        if (!amount || amount < 0) {
            showToast('請輸入有效金額', 'error');
            return false;
        }
        
        // 檢查金額是否符合最低收費標準
        const settings = storageManager.getSettings() || { basePrice: 500 };
        if (amount < settings.basePrice) {
            showToast(`金額不得低於基本收費 ${settings.basePrice} 元`, 'error');
            return false;
        }
    }

    // ...existing code...
}

// 修改取得表單資料函數
function getEntryFormData() {
    const currentTime = new Date();
    const settings = storageManager.getSettings() || { basePrice: 500 };
    
    const formData = {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        hours: parseInt(document.getElementById('hours').value) || 3,
        entryTime: currentTime.toISOString(),
        remarks: document.getElementById('remarks').value || '',
        status: 'active',
        id: generateEntryId()
    };

    if (formData.paymentType === 'cash') {
        formData.amount = parseInt(document.getElementById('amount').value) || settings.basePrice;
    } else {
        formData.ticketType = document.getElementById('ticketType').value;
        formData.ticketNumber = document.getElementById('ticketNumber').value;
    }

    // 計算預期結束時間
    formData.expectedEndTime = new Date(currentTime.getTime() + formData.hours * 60 * 60 * 1000).toISOString();

    return formData;
}

// 修改重置表單函數
function resetEntryForm() {
    const settings = storageManager.getSettings() || { basePrice: 500 };
    
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    document.getElementById('amount').value = settings.basePrice;
    document.getElementById('hours').value = '3';
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    handlePaymentTypeChange();
>>>>>>> Stashed changes
}