// 載入入場記錄區段
async function loadRecordsSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.error('Main content container not found');
        return;
    }

    // 顯示載入中狀態
    showLoading(true);

    try {
        // 設定記錄區塊的 HTML
        const recordsHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-between align-center">
                        <h2>入場記錄</h2>
                        <div class="header-actions">
                            <select id="statusFilter" class="form-control">
                                <option value="all">全部狀態</option>
                                <option value="active">使用中</option>
                                <option value="temporary">暫時外出</option>
                                <option value="completed">已結束</option>
                            </select>
                            <input type="text" id="searchInput" class="form-control" 
                                   placeholder="搜尋櫃位號碼...">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>櫃位號碼</th>
                                    <th>付款資訊</th>
                                    <th>入場時間</th>
                                    <th>剩餘時間</th>
                                    <th>狀態</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="recordsTableBody">
                                <!-- 將由 JavaScript 動態生成 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // 設置 HTML 內容
        mainContent.innerHTML = recordsHTML;

        // 初始化事件監聽
        initializeRecordsEvents();

        // 立即更新記錄顯示
        updateRecordsDisplay();

    } catch (error) {
        console.error('Error loading records section:', error);
        showToast('載入記錄失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 初始化記錄相關事件
function initializeRecordsEvents() {
    // 狀態篩選事件
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            updateRecordsDisplay();
        });
    }

    // 搜尋框事件
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            updateRecordsDisplay();
        }, 300));
    }
}

// 更新記錄顯示
function updateRecordsDisplay() {
    const records = getFilteredRecords();
    const tableBody = document.getElementById('recordsTableBody');
    
    if (!tableBody) {
        console.error('Records table body not found');
        return;
    }

    try {
        if (records.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">目前沒有記錄</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = records.map(record => `
            <tr class="record-row ${record.status}">
                <td>${record.lockerNumber}</td>
                <td>${formatPaymentInfo(record)}</td>
                <td>${formatDateTime(record.entryTime)}</td>
                <td>${calculateRemainingTime(record)}</td>
                <td>
                    <span class="status-badge ${record.status}">
                        ${formatStatus(record.status)}
                    </span>
                </td>
                <td class="action-cell">
                    <button onclick="showActionOptions('${record.id}')" class="primary-button">
                        操作選項
                    </button>
                    ${generateQuickActionButtons(record)}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error updating records display:', error);
        showToast('更新記錄顯示失敗', 'error');
    }
}

// 生成快速操作按鈕
function generateQuickActionButtons(record) {
    if (record.status === 'active') {
        return `
            <button onclick="handleRecordAction('${record.id}', 'temporaryExit')" 
                    class="secondary-button">
                暫時外出
            </button>
        `;
    } else if (record.status === 'temporary') {
        return `
            <button onclick="handleRecordAction('${record.id}', 'return')" 
                    class="secondary-button">
                返回使用
            </button>
        `;
    }
    return '';
}

// 其他輔助函數...
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 取得篩選後的記錄
function getFilteredRecords() {
    let records = storageManager.getEntries() || [];
    const statusFilter = document.getElementById('statusFilter')?.value;
    const searchText = document.getElementById('searchInput')?.value?.toLowerCase();

    // 套用狀態篩選
    if (statusFilter && statusFilter !== 'all') {
        records = records.filter(record => record.status === statusFilter);
    }

    // 套用搜尋篩選
    if (searchText) {
        records = records.filter(record => 
            record.lockerNumber.toString().includes(searchText)
        );
    }

    // 依照時間排序，最新的在前面
    return records.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
}

// 格式化與輔助函數...
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('zh-TW');
}

function formatPaymentInfo(record) {
    if (record.paymentType === 'cash') {
        return `現金 $${record.amount}`;
    }
    return `票券: ${record.ticketType || ''} ${record.ticketNumber ? `(${record.ticketNumber})` : ''}`;
}

function formatStatus(status) {
    const statusMap = {
        'active': '使用中',
        'temporary': '暫時外出',
        'completed': '已結束'
    };
    return statusMap[status] || status;
}

function calculateRemainingTime(record) {
    if (record.status === 'completed') return '-';
    
    const settings = storageManager.getSettings();
    const maxStayHours = settings.maxStayHours || 12;
    const entryTime = new Date(record.entryTime);
    const now = new Date();
    const elapsedMs = now - entryTime;
    const remainingMs = (maxStayHours * 60 * 60 * 1000) - elapsedMs;

    if (remainingMs <= 0) return '已超時';

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小時${minutes}分鐘`;
}

// 將必要的函數掛載到 window
window.loadRecordsSection = loadRecordsSection;
window.updateRecordsDisplay = updateRecordsDisplay;
window.handleRecordAction = handleRecordAction;
window.showActionOptions = showActionOptions;
// 顯示操作選項
function showActionOptions(recordId) {
    console.log('Showing actions for record:', recordId);
    const record = getRecordById(recordId);
    if (!record) {
        console.error('Record not found:', recordId);
        showToast('找不到記錄', 'error');
        return;
    }

    const modalContent = `
        <div class="modal-header">
            <h3>櫃位 ${record.lockerNumber} - 操作選項</h3>
            <button onclick="closeModal()" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <div class="action-list">
                <!-- 換置物櫃 -->
                <button class="menu-button" onclick="handleActionSelect('changeLocker', '${record.id}')">
                    <i class="icon">🔄</i>
                    <span>換置物櫃</span>
                </button>

                <!-- 查看更換紀錄 -->
                <button class="menu-button" onclick="handleActionSelect('viewHistory', '${record.id}')">
                    <i class="icon">📋</i>
                    <span>更換紀錄</span>
                </button>

                <div class="menu-divider"></div>

                <!-- 結束使用 -->
                <button class="menu-button warning" onclick="handleActionSelect('complete', '${record.id}')">
                    <i class="icon">✓</i>
                    <span>結束使用</span>
                </button>
            </div>
        </div>
    `;

    showModal(modalContent);
}

// 處理操作選項選擇
function handleActionSelect(action, recordId) {
    console.log('Selected action:', action, 'for record:', recordId);
    closeModal();

    switch (action) {
        case 'changeLocker':
            showChangeLockerModal(recordId);
            break;

        case 'viewHistory':
            showLockerChangeHistory(recordId);
            break;

        case 'complete':
            confirmCompleteUse(recordId);
            break;

        default:
            console.error('Unknown action:', action);
            showToast('無效的操作', 'error');
    }
}

// 確認結束使用
function confirmCompleteUse(recordId) {
    if (confirm('確定要結束使用嗎？此操作無法復原。')) {
        handleRecordAction(recordId, 'complete');
    }
}

// 處理記錄操作
async function handleRecordAction(recordId, action) {
    console.log('Handling record action:', action, 'for record:', recordId);
    try {
        showLoading(true);

        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

        const updatedRecord = { ...record };
        const now = new Date().toISOString();

        switch (action) {
            case 'temporaryExit':
                updatedRecord.status = 'temporary';
                updatedRecord.temporaryExitTime = now;
                break;

            case 'return':
                updatedRecord.status = 'active';
                updatedRecord.returnTime = now;
                break;

            case 'complete':
                updatedRecord.status = 'completed';
                updatedRecord.endTime = now;
                break;

            default:
                throw new Error('無效的操作');
        }

        // 儲存更新
        if (storageManager.updateEntry(recordId, updatedRecord)) {
            showToast('操作成功');
            updateRecordsDisplay();
        } else {
            throw new Error('儲存失敗');
        }

    } catch (error) {
        console.error('Record action error:', error);
        showToast(error.message || '操作失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 取得記錄
function getRecordById(recordId) {
    const entries = storageManager.getEntries() || [];
    return entries.find(entry => entry.id === recordId);
}

// 掛載到全域
window.showActionOptions = showActionOptions;
window.handleActionSelect = handleActionSelect;
window.handleRecordAction = handleRecordAction;
window.confirmCompleteUse = confirmCompleteUse;
// 顯示換置物櫃 Modal
function showChangeLockerModal(recordId) {
    console.log('Showing change locker modal for record:', recordId);
    const record = getRecordById(recordId);
    if (!record) {
        showToast('找不到記錄', 'error');
        return;
    }

    // 取得可用櫃位
    const availableLockers = getAvailableLockers(record.lockerNumber);

    const modalContent = `
        <div class="modal-header">
            <h3>換置物櫃</h3>
            <button onclick="closeModal()" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>目前櫃位</label>
                <div class="current-locker-info">
                    ${record.lockerNumber} 號
                </div>
            </div>

            <div class="form-group">
                <label for="newLockerNumber">新櫃位號碼 <span class="required">*</span></label>
                <select id="newLockerNumber" class="form-control" required>
                    <option value="">請選擇新櫃位</option>
                    ${availableLockers.map(number => 
                        `<option value="${number}">櫃位 ${number}</option>`
                    ).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="changeReason">更換原因</label>
                <select id="changeReason" class="form-control">
                    <option value="maintenance">維修需求</option>
                    <option value="customer">客戶要求</option>
                    <option value="upgrade">升級櫃位</option>
                    <option value="other">其他原因</option>
                </select>
            </div>

            <div class="form-group">
                <label for="changeRemarks">備註說明</label>
                <textarea id="changeRemarks" class="form-control" 
                         rows="2" placeholder="輸入備註說明..."></textarea>
            </div>

            <div class="form-actions">
                <button onclick="confirmChangeLocker('${record.id}')" class="primary-button">
                    確認更換
                </button>
                <button onclick="closeModal()" class="secondary-button">
                    取消
                </button>
            </div>
        </div>
    `;

    showModal(modalContent);
}

// 取得可用櫃位
function getAvailableLockers(currentLocker) {
    const settings = storageManager.getSettings();
    const entries = storageManager.getEntries() || [];
    
    // 取得已使用的櫃位
    const occupiedLockers = entries
        .filter(entry => entry.status !== 'completed' && entry.lockerNumber !== currentLocker)
        .map(entry => entry.lockerNumber);

    // 生成可用櫃位清單
    const availableLockers = [];
    const maxLockers = settings.lockerCount || 100;
    
    for (let i = 1; i <= maxLockers; i++) {
        if (!occupiedLockers.includes(i)) {
            availableLockers.push(i);
        }
    }

    return availableLockers;
}

// 確認更換櫃位
async function confirmChangeLocker(recordId) {
    const newLockerNumber = document.getElementById('newLockerNumber')?.value;
    const changeReason = document.getElementById('changeReason')?.value;
    const changeRemarks = document.getElementById('changeRemarks')?.value;

    if (!newLockerNumber) {
        showToast('請選擇新櫃位', 'error');
        return;
    }

    try {
        showLoading(true);

        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

        // 建立更換記錄
        const changeRecord = {
            timestamp: new Date().toISOString(),
            oldLocker: record.lockerNumber,
            newLocker: parseInt(newLockerNumber),
            reason: changeReason,
            remarks: changeRemarks
        };

        // 更新記錄
        const updatedRecord = {
            ...record,
            lockerNumber: parseInt(newLockerNumber),
            changeHistory: [...(record.changeHistory || []), changeRecord]
        };

        if (storageManager.updateEntry(recordId, updatedRecord)) {
            closeModal();
            showToast('櫃位更換成功');
            updateRecordsDisplay();
        } else {
            throw new Error('更新失敗');
        }

    } catch (error) {
        console.error('Change locker error:', error);
        showToast(error.message || '更換櫃位失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 顯示櫃位更換歷史
function showLockerChangeHistory(recordId) {
    const record = getRecordById(recordId);
    if (!record) {
        showToast('找不到記錄', 'error');
        return;
    }

    if (!record.changeHistory?.length) {
        showToast('無更換記錄', 'info');
        return;
    }

    const modalContent = `
        <div class="modal-header">
            <h3>櫃位更換記錄</h3>
            <button onclick="closeModal()" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <div class="history-list">
                ${record.changeHistory.map(change => `
                    <div class="history-item">
                        <div class="history-time">
                            ${formatDateTime(change.timestamp)}
                        </div>
                        <div class="history-content">
                            <p>從 ${change.oldLocker} 號櫃位更換至 ${change.newLocker} 號櫃位</p>
                            <p>原因: ${formatChangeReason(change.reason)}</p>
                            ${change.remarks ? `<p>備註: ${change.remarks}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    showModal(modalContent);
}

// 格式化更換原因
function formatChangeReason(reason) {
    const reasonMap = {
        'maintenance': '維修需求',
        'customer': '客戶要求',
        'upgrade': '升級櫃位',
        'other': '其他原因'
    };
    return reasonMap[reason] || reason;
}

// 將函數掛載到全域
window.showChangeLockerModal = showChangeLockerModal;
window.confirmChangeLocker = confirmChangeLocker;
window.showLockerChangeHistory = showLockerChangeHistory;
// 更新記錄顯示函數
function updateRecordsDisplay() {
    const records = getFilteredRecords();
    const tableBody = document.getElementById('recordsTableBody');
    
    if (!tableBody) {
        console.error('Records table body not found');
        return;
    }

    try {
        if (records.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">目前沒有記錄</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = records.map(record => `
            <tr class="record-row ${record.status}">
                <td>${record.lockerNumber}</td>
                <td>${formatPaymentInfo(record)}</td>
                <td>
                    <div class="time-info">
                        <div>入場：${formatDateTime(record.entryTime)}</div>
                        ${formatExitReturnTime(record)}
                        ${record.endTime ? `<div>離場：${formatDateTime(record.endTime)}</div>` : ''}
                    </div>
                </td>
                <td>${calculateRemainingTime(record)}</td>
                <td>
                    <span class="status-badge ${record.status}">
                        ${formatStatus(record.status)}
                    </span>
                </td>
                <td class="action-cell">
                    <div class="action-buttons">
                        <button onclick="showActionOptions('${record.id}')" class="primary-button">
                            操作選項
                        </button>
                        ${generateQuickActionButtons(record)}
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error updating records display:', error);
        showToast('更新記錄顯示失敗', 'error');
    }
}

// 格式化外出/返回時間
function formatExitReturnTime(record) {
    let html = '';
    
    // 顯示最近一次的外出/返回記錄
    if (record.temporaryExits && record.temporaryExits.length > 0) {
        const lastExit = record.temporaryExits[record.temporaryExits.length - 1];
        html += `
            <div>外出：${formatDateTime(lastExit.exitTime)}</div>
            ${lastExit.returnTime ? `<div>返回：${formatDateTime(lastExit.returnTime)}</div>` : ''}
        `;
    } else if (record.temporaryExitTime) {
        // 支援舊格式的記錄
        html += `<div>外出：${formatDateTime(record.temporaryExitTime)}</div>`;
        if (record.returnTime) {
            html += `<div>返回：${formatDateTime(record.returnTime)}</div>`;
        }
    }

    return html;
}

// 修改處理記錄操作函數
async function handleRecordAction(recordId, action) {
    try {
        showLoading(true);

        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

        const updatedRecord = { ...record };
        const now = new Date().toISOString();

        switch (action) {
            case 'temporaryExit':
                // 初始化暫存外出記錄陣列
                updatedRecord.temporaryExits = updatedRecord.temporaryExits || [];
                // 添加新的外出記錄
                updatedRecord.temporaryExits.push({
                    exitTime: now,
                    returnTime: null
                });
                updatedRecord.status = 'temporary';
                break;

            case 'return':
                // 更新最後一筆外出記錄的返回時間
                if (updatedRecord.temporaryExits && updatedRecord.temporaryExits.length > 0) {
                    const lastExit = updatedRecord.temporaryExits[updatedRecord.temporaryExits.length - 1];
                    lastExit.returnTime = now;
                }
                updatedRecord.status = 'active';
                break;

            case 'complete':
                updatedRecord.status = 'completed';
                updatedRecord.endTime = now;
                break;

            default:
                throw new Error('無效的操作');
        }

        if (storageManager.updateEntry(recordId, updatedRecord)) {
            showToast('操作成功');
            updateRecordsDisplay();
        } else {
            throw new Error('更新失敗');
        }

    } catch (error) {
        console.error('Record action error:', error);
        showToast(error.message || '操作失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 顯示詳細時間記錄
function showTimeHistory(recordId) {
    const record = getRecordById(recordId);
    if (!record) {
        showToast('找不到記錄', 'error');
        return;
    }

    const modalContent = `
        <div class="modal-header">
            <h3>時間記錄詳情</h3>
            <button onclick="closeModal()" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <div class="time-history-list">
                <div class="time-record">
                    <div class="time-label">入場時間</div>
                    <div class="time-value">${formatDateTime(record.entryTime)}</div>
                </div>

                ${record.temporaryExits ? record.temporaryExits.map((exit, index) => `
                    <div class="time-record">
                        <div class="time-label">第 ${index + 1} 次外出</div>
                        <div class="time-value">
                            外出：${formatDateTime(exit.exitTime)}<br>
                            ${exit.returnTime ? `返回：${formatDateTime(exit.returnTime)}` : '未返回'}
                        </div>
                    </div>
                `).join('') : ''}

                ${record.endTime ? `
                    <div class="time-record">
                        <div class="time-label">離場時間</div>
                        <div class="time-value">${formatDateTime(record.endTime)}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    showModal(modalContent);
}

// 在操作選單中添加查看時間記錄選項
function showActionOptions(recordId) {
    const record = getRecordById(recordId);
    if (!record) return;

    const modalContent = `
        <div class="modal-header">
            <h3>櫃位 ${record.lockerNumber} - 操作選項</h3>
            <button onclick="closeModal()" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <div class="action-list">
                <button onclick="showTimeHistory('${record.id}')" class="menu-button">
                    <i class="icon">⏱️</i>
                    <span>時間記錄</span>
                </button>

                <button onclick="handleActionSelect('changeLocker', '${record.id}')" class="menu-button">
                    <i class="icon">🔄</i>
                    <span>換置物櫃</span>
                </button>

                ${record.changeHistory?.length ? `
                    <button onclick="showLockerChangeHistory('${record.id}')" class="menu-button">
                        <i class="icon">📋</i>
                        <span>更換紀錄</span>
                    </button>
                ` : ''}

                <div class="menu-divider"></div>

                <button onclick="handleActionSelect('complete', '${record.id}')" class="menu-button warning">
                    <i class="icon">✓</i>
                    <span>結束使用</span>
                </button>
            </div>
        </div>
    `;

    showModal(modalContent);
}

// 將新函數掛載到全域
window.showTimeHistory = showTimeHistory;