// 載入入場登記區段
async function loadEntrySection() {
    const mainContent = document.getElementById('mainContent');
    const settings = storageManager.getSettings();
    
    const entryHTML = `
        <div class="card">
            <div class="card-header">
                <h2>入場登記</h2>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="lockerNumber">櫃位號碼 <span class="required">*</span></label>
                        <div class="input-group">
                            <input type="number" id="lockerNumber" 
                                   min="1" max="${settings.lockerCount}" 
                                   class="form-control" required>
                            <button onclick="findAvailableLocker()" class="secondary-button">
                                找空櫃
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group col-md-6">
                        <label>付款方式 <span class="required">*</span></label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="paymentType" value="cash" checked>
                                現金
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="paymentType" value="ticket">
                                票券
                            </label>
                        </div>
                    </div>
                </div>

                <div id="cashFields" class="form-row">
                    <div class="form-group col-md-6">
                        <label for="amount">金額 <span class="required">*</span></label>
                        <input type="number" id="amount" class="form-control" 
                               value="${settings.basePrice}" readonly>
                    </div>
                </div>

                <div id="ticketFields" class="form-row" style="display: none;">
                    <div class="form-group col-md-6">
                        <label for="ticketType">票券類型 <span class="required">*</span></label>
                        <select id="ticketType" class="form-control">
                            <option value="regular">平日券</option>
                            <option value="allday">暢遊券</option>
                            <option value="special">特殊票券</option>
                        </select>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="ticketNumber">票券號碼 <span class="required">*</span></label>
                        <input type="text" id="ticketNumber" class="form-control" 
                               placeholder="請輸入票券號碼">
                    </div>
                </div>

                <div class="form-group">
                    <label for="remarks">備註</label>
                    <textarea id="remarks" class="form-control" rows="2" 
                            placeholder="輸入特殊需求或備註事項"></textarea>
                </div>

                <div class="form-actions">
                    <button onclick="handleEntrySubmit()" class="primary-button">
                        確認登記
                    </button>
                    <button onclick="resetEntryForm()" class="secondary-button">
                        重置表單
                    </button>
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = entryHTML;
    initializeEntryEvents();
}

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

// 處理付款方式切換
function handlePaymentTypeChange(e) {
    const cashFields = document.getElementById('cashFields');
    const ticketFields = document.getElementById('ticketFields');

    if (e.target.value === 'cash') {
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