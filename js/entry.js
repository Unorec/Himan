// 載入入場登記區段
async function loadEntrySection() {
    const mainContent = document.getElementById('mainContent');
    const settings = storageManager.getSettings() || { basePrice: 300 };

    const entryHTML = `
        <div class="card">
            <div class="card-header">
                <h2>入場登記</h2>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                    <input type="number" id="lockerNumber" min="1" max="100" class="form-control" required>
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
                                <button onclick="adjustAmount('add')" type="button" class="small-button">
                                    +
                                </button>
                                <button onclick="adjustAmount('subtract')" type="button" class="small-button">
                                    -
                                </button>
                            </div>
                        </div>
                        <div class="price-presets">
                            <button onclick="setAmount(${settings.basePrice})" type="button" class="preset-button">
                                基本價 ($${settings.basePrice})
                            </button>
                            <button onclick="setAmount(${settings.basePrice * 1.2})" type="button" class="preset-button">
                                旺季價 (+20%)
                            </button>
                            <button onclick="setAmount(${settings.basePrice * 0.9})" type="button" class="preset-button">
                                優惠價 (-10%)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 票券付款區塊 -->
                <div id="ticketFields" style="display: none;">
                    <div class="form-group">
                        <label for="ticketType">票券類型</label>
                        <select id="ticketType" class="form-control">
                            <option value="regular">平日券</option>
                            <option value="holiday">假日券</option>
                            <option value="vip">VIP券</option>
                            <option value="special">特殊票券</option>
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

                <button onclick="handleEntrySubmit()" class="primary-button">
                    確認登記
                </button>
            </div>
        </div>
    `;

    mainContent.innerHTML = entryHTML;
    initializeEntryEvents();
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
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 100) {
        showToast('請輸入有效的櫃位號碼 (1-100)', 'error');
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

    return true;
}

// 重置表單
function resetEntryForm() {
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    const settings = storageManager.getSettings() || { basePrice: 300 };
    document.getElementById('amount').value = settings.basePrice;
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
    const settings = storageManager.getSettings();
    
    // 檢查是否為有效數字
    if (!lockerNumber || lockerNumber < 1 || lockerNumber > settings.lockerCount) {
        showToast(`請輸入有效的櫃位號碼 (1-${settings.lockerCount})`, 'error');
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
    return {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        amount: document.getElementById('amount').value,
        ticketType: document.getElementById('ticketType')?.value,
        ticketNumber: document.getElementById('ticketNumber')?.value,
        remarks: document.getElementById('remarks').value
    };
}

// 驗證入場表單
function validateEntryForm(formData) {
    if (!validateLockerNumber()) {
        return false;
    }

    if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    return true;
}

// 重置入場表單
function resetEntryForm() {
    const settings = storageManager.getSettings();
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    handlePaymentTypeChange({ target: { value: 'cash' } });
    document.getElementById('amount').value = settings.basePrice;
}

// 生成入場記錄ID
function generateEntryId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `entry_${timestamp}_${random}`;
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
            id: generateEntryId(), // 使用新的 ID 生成函數
            entryTime: new Date().toISOString(),
            status: 'active'
        };

        console.log('Creating new entry:', entry); // 調試用

        // 儲存記錄
        if (storageManager.addEntry(entry)) {
            resetEntryForm();
            showToast('入場登記成功！');
            
            // 如果在同一頁面，更新記錄顯示
            if (typeof updateRecordsDisplay === 'function') {
                updateRecordsDisplay();
            }
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
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    const data = {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: paymentType,
        remarks: document.getElementById('remarks').value || ''
    };

    if (paymentType === 'cash') {
        data.amount = parseFloat(document.getElementById('amount').value);
    } else {
        data.ticketType = document.getElementById('ticketType').value;
        data.ticketNumber = document.getElementById('ticketNumber').value;
    }

    console.log('Form data:', data); // 調試用
    return data;
}

// 驗證入場表單
function validateEntryForm(formData) {
    if (!formData.lockerNumber || isNaN(formData.lockerNumber)) {
        showToast('請輸入有效的櫃位號碼', 'error');
        return false;
    }

    if (formData.paymentType === 'cash' && (!formData.amount || isNaN(formData.amount))) {
        showToast('請輸入有效的金額', 'error');
        return false;
    }

    if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    return true;
}
// 時段費用設定
const timeSlotPrices = {
    morning: {
        name: '早鳥時段',
        hours: 3,
        price: 200,
        startTime: '06:00',
        endTime: '12:00',
        description: '早上優惠價'
    },
    afternoon: {
        name: '午間時段',
        hours: 4,
        price: 300,
        startTime: '12:00',
        endTime: '18:00',
        description: '標準時段'
    },
    evening: {
        name: '夜間時段',
        hours: 2,
        price: 250,
        startTime: '18:00',
        endTime: '22:00',
        description: '晚間優惠'
    },
    night: {
        name: '夜貓時段',
        hours: 6,
        price: 400,
        startTime: '22:00',
        endTime: '06:00',
        description: '夜間包段優惠'
    }
};

// 修改入場登記區段載入函數
async function loadEntrySection() {
    const mainContent = document.getElementById('mainContent');
    const settings = storageManager.getSettings() || { basePrice: 300 };

    const entryHTML = `
        <div class="card">
            <div class="card-header">
                <h2>入場登記</h2>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                    <input type="number" id="lockerNumber" min="1" max="100" class="form-control" required>
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
                            <option value="regular">平日券 (3小時)</option>
                            <option value="half-day">半日券 (6小時)</option>
                            <option value="full-day">全日券 (12小時)</option>
                            <option value="vip">VIP券 (不限時)</option>
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
        'regular': 3,
        'half-day': 6,
        'full-day': 12,
        'vip': 24
    };
    
    if (document.getElementById('hours')) {
        document.getElementById('hours').value = hoursMap[ticketType] || 3;
    }
}

// 修改表單驗證
function validateEntryForm(formData) {
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 100) {
        showToast('請輸入有效的櫃位號碼 (1-100)', 'error');
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
    } else if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        showToast('請輸入票券號碼', 'error');
        return false;
    }

    return true;
}

// 修改取得表單數據函數
function getEntryFormData() {
    const currentTime = new Date();
    const hours = parseInt(document.getElementById('hours').value) || 3;
    
    return {
        lockerNumber: parseInt(document.getElementById('lockerNumber').value),
        paymentType: document.querySelector('input[name="paymentType"]:checked').value,
        amount: parseInt(document.getElementById('amount').value),
        ticketType: document.getElementById('ticketType')?.value,
        ticketNumber: document.getElementById('ticketNumber')?.value,
        hours: hours,
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