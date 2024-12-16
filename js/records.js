// Import dependencies
import { storageManager } from './storage.js';
import { showLoading, showToast, showModal, closeModal } from './ui.js';
import { lockerManager } from './lockers.js';

// 記錄相關配置
const recordsConfig = {
    itemsPerPage: 10,
    currentPage: 1,
    currentFilter: 'all'
};

// 載入入場記錄和櫃位狀態
export async function loadRecordsSection() {
    const mainContent = document.getElementById('mainContent');
    
    const recordsHTML = `
        <div class="records-container">
            <div class="status-panel">
                <h2>即時櫃位狀態</h2>
                <div class="locker-grid" id="lockerGrid"></div>
            </div>
            <div class="records-panel">
                <h2>入場記錄列表</h2>
                <div class="records-filters">
                    <input type="text" id="searchInput" placeholder="搜尋櫃位或備註..." class="search-input">
                    <select id="statusFilter" class="status-filter">
                        <option value="all">全部狀態</option>
                        <option value="active">使用中</option>
                        <option value="completed">已結束</option>
                    </select>
                </div>
                <div class="records-list" id="recordsList"></div>
            </div>
        </div>
    `;

    mainContent.innerHTML = recordsHTML;
    initializeRecordsEvents();
    updateLockerGrid();
    updateRecordsList();
}

// 更新櫃位狀態顯示
export function updateLockerGrid() {
    const grid = document.getElementById('lockerGrid');
    const lockerStatus = lockerManager.getLockerStatus();
    const maxLockers = 500;
    
    let gridHTML = '';
    for (let i = 1; i <= maxLockers; i++) {
        const status = lockerStatus[i] ? 'occupied' : 'available';
        const statusText = lockerStatus[i] ? '使用中' : '可使用';
        
        gridHTML += `
            <div class="locker-cell ${status}" data-locker="${i}">
                <span class="locker-number">${i}</span>
                <span class="locker-status">${statusText}</span>
            </div>
        `;
    }
    
    grid.innerHTML = gridHTML;

    // 添加點擊事件
    grid.querySelectorAll('.locker-cell').forEach(cell => {
        cell.addEventListener('click', () => showLockerDetail(cell.dataset.locker));
    });
}

// 更新入場記錄列表
export function updateRecordsList(filter = 'all', searchTerm = '') {
    const records = storageManager.getEntries() || [];
    const recordsList = document.getElementById('recordsList');
    
    const filteredRecords = records.filter(record => {
        const matchesFilter = filter === 'all' || record.status === filter;
        const matchesSearch = !searchTerm || 
            record.lockerNumber.toString().includes(searchTerm) ||
            (record.remarks && record.remarks.includes(searchTerm));
        return matchesFilter && matchesSearch;
    });

    const recordsHTML = filteredRecords.map(record => `
        <div class="record-item ${record.status}">
            <div class="record-header">
                <span class="locker-number">櫃位 #${record.lockerNumber}</span>
                <span class="record-status ${record.status}">
                    ${record.status === 'active' ? '使用中' : '已結束'}
                </span>
            </div>
            <div class="record-details">
                <div>入場時間: ${new Date(record.entryTime).toLocaleString()}</div>
                ${record.status === 'completed' ? 
                    `<div>離場時間: ${new Date(record.exitTime).toLocaleString()}</div>` : 
                    `<div>預計結束: ${new Date(record.expectedEndTime).toLocaleString()}</div>`
                }
                <div>付款方式: ${record.paymentType === 'cash' ? 
                    `現金 $${record.amount}` : 
                    `票券 (${record.ticketType})`}</div>
                ${record.remarks ? `<div>備註: ${record.remarks}</div>` : ''}
            </div>
            ${record.status === 'active' ? 
                `<button class="exit-button" onclick="handleExit('${record.id}')">
                    登記離場
                </button>` : ''
            }
        </div>
    `).join('');

    recordsList.innerHTML = recordsHTML || '<div class="no-records">目前無入場記錄</div>';
}

// 顯示櫃位詳細資訊
export function showLockerDetail(lockerId) {
    const records = storageManager.getEntries() || [];
    const activeRecord = records.find(r => 
        r.lockerNumber.toString() === lockerId && 
        r.status === 'active'
    );

    if (activeRecord) {
        showModal(`
            <div class="locker-detail">
                <h3>櫃位 #${lockerId} 使用狀態</h3>
                <div class="detail-content">
                    <p>入場時間: ${new Date(activeRecord.entryTime).toLocaleString()}</p>
                    <p>預計結束: ${new Date(activeRecord.expectedEndTime).toLocaleString()}</p>
                    <p>付款方式: ${activeRecord.paymentType === 'cash' ? 
                        `現金 $${activeRecord.amount}` : 
                        `票券 (${activeRecord.ticketType})`}</p>
                    ${activeRecord.remarks ? `<p>備註: ${activeRecord.remarks}</p>` : ''}
                    <button class="primary-button" 
                            onclick="handleExit('${activeRecord.id}')">
                        登記離場
                    </button>
                </div>
            </div>
        `, '櫃位詳細資訊');
    } else {
        showModal(`
            <div class="locker-detail">
                <h3>櫃位 #${lockerId}</h3>
                <p class="available-status">目前可使用</p>
            </div>
        `, '櫃位詳細資訊');
    }
}

// 初始化事件監聽
export function initializeRecordsEvents() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            updateRecordsList(statusFilter.value, e.target.value);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            updateRecordsList(e.target.value, searchInput.value);
        });
    }

    // 將事件處理函數添加到全域
    window.handleExit = handleExit;
}

// 處理離場
export async function handleExit(recordId) {
    const records = storageManager.getEntries() || [];
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
        showToast('找不到該入場記錄', 'error');
        return;
    }

    const record = records[recordIndex];
    record.status = 'completed';
    record.exitTime = new Date().toISOString();

    // 更新記錄
    storageManager.updateEntry(recordId, record);
    
    // 釋放櫃位
    lockerManager.releaseLocker(record.lockerNumber);

    // 更新顯示
    updateLockerGrid();
    updateRecordsList();
    showToast('已完成離場登記');
}

// 顯示記錄操作選項
function showActionOptions(element, record) {
    const options = document.createElement('div');
    options.className = 'action-options';
    
    // 建立選項清單
    const actionsList = document.createElement('ul');
    
    // 新增查看詳情選項
    const viewDetails = document.createElement('li');
    viewDetails.textContent = '查看詳情';
    viewDetails.onclick = () => showRecordDetails(record);
    
    // 新增編輯選項
    const editRecord = document.createElement('li');
    editRecord.textContent = '編輯記錄';
    editRecord.onclick = () => editRecordData(record);
    
    // 新增刪除選項
    const deleteRecord = document.createElement('li');
    deleteRecord.textContent = '刪除記錄';
    deleteRecord.onclick = () => deleteRecordData(record.id);
    
    // 組合選項
    actionsList.appendChild(viewDetails);
    actionsList.appendChild(editRecord);
    actionsList.appendChild(deleteRecord);
    options.appendChild(actionsList);
    
    // 設定位置
    const rect = element.getBoundingClientRect();
    options.style.position = 'absolute';
    options.style.top = `${rect.bottom + window.scrollY}px`;
    options.style.left = `${rect.left}px`;
    
    // 添加到文件中
    document.body.appendChild(options);
    
    // 點擊外部關閉選項
    const closeOptions = (e) => {
        if (!options.contains(e.target) && e.target !== element) {
            options.remove();
            document.removeEventListener('click', closeOptions);
        }
    };
    
    document.addEventListener('click', closeOptions);
}

// 處理操作選項的選擇
function handleActionSelect(action, record) {
    switch (action) {
        case 'view':
            showRecordDetails(record);
            break;
        case 'edit':
            showEditModal(record);
            break;
        case 'delete':
            showDeleteConfirm(record);
            break;
        case 'extend':
            showExtendTimeModal(record);
            break;
        case 'change':
            showLockerChangeModal(record);
            break;
        default:
            console.warn('未知的操作類型:', action);
    }
}

/**
 * 處理記錄操作
 * @param {string} action - 操作類型
 * @param {Object} record - 記錄資料
 */
function handleRecordAction(action, record) {
    switch (action) {
        case 'extend':
            // 延長使用時間
            handleTimeExtension(record);
            break;
        case 'change':
            // 更換櫃位
            handleLockerChange(record);
            break;
        case 'charge':
            // 加收費用
            handleAdditionalCharge(record);
            break;
        case 'exit':
            // 登記離場
            handleExit(record.id);
            break;
        default:
            console.warn('未知的操作類型:', action);
    }
}

/**
 * 處理時間延長
 * @param {Object} record - 記錄資料
 */
function handleTimeExtension(record) {
    showModal(`
        <div class="time-extension">
            <h3>延長使用時間</h3>
            <div class="form-group">
                <label>延長時數</label>
                <input type="number" id="extensionHours" min="1" max="24" value="1" class="form-control">
            </div>
            <div class="form-actions">
                <button class="primary-button" onclick="confirmTimeExtension('${record.id}')">確認延長</button>
                <button class="secondary-button" onclick="closeModal()">取消</button>
            </div>
        </div>
    `, '延長使用時間');
}

/**
 * 處理櫃位更換
 * @param {Object} record - 記錄資料
 */
function handleLockerChange(record) {
    const availableLockers = lockerManager.getAvailableLockers();
    showModal(`
        <div class="locker-change">
            <h3>更換櫃位</h3>
            <div class="form-group">
                <label>選擇新櫃位</label>
                <select id="newLocker" class="form-control">
                    ${availableLockers.map(locker => 
                        `<option value="${locker}">${locker}號櫃</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>更換原因</label>
                <textarea id="changeReason" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button class="primary-button" onclick="confirmLockerChange('${record.id}')">確認更換</button>
                <button class="secondary-button" onclick="closeModal()">取消</button>
            </div>
        </div>
    `, '更換櫃位');
}

/**
 * 處理額外收費
 * @param {Object} record - 記錄資料
 */
function handleAdditionalCharge(record) {
    showModal(`
        <div class="additional-charge">
            <h3>加收費用</h3>
            <div class="form-group">
                <label>金額</label>
                <input type="number" id="additionalAmount" min="0" class="form-control">
            </div>
            <div class="form-group">
                <label>原因說明</label>
                <textarea id="chargeReason" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button class="primary-button" onclick="confirmAdditionalCharge('${record.id}')">確認收費</button>
                <button class="secondary-button" onclick="closeModal()">取消</button>
            </div>
        </div>
    `, '加收費用');
}

/**
 * 確認延長使用時間
 * @param {string} recordId - 記錄ID
 */
function confirmTimeExtension(recordId) {
    const hours = parseInt(document.getElementById('extensionHours').value);
    if (!hours || hours < 1 || hours > 24) {
        showToast('請輸入有效的延長時數(1-24小時)', 'error');
        return;
    }

    const records = storageManager.getEntries() || [];
    const record = records.find(r => r.id === recordId);
    if (!record) {
        showToast('找不到該記錄', 'error');
        return;
    }

    // 計算新的結束時間
    const currentEndTime = new Date(record.expectedEndTime);
    const newEndTime = new Date(currentEndTime.getTime() + hours * 60 * 60 * 1000);
    
    // 計算額外費用
    const extraCharge = calculateExtraCharge(hours);

    // 更新記錄
    record.expectedEndTime = newEndTime.toISOString();
    record.amount += extraCharge;
    record.extensions = record.extensions || [];
    record.extensions.push({
        time: new Date().toISOString(),
        hours: hours,
        charge: extraCharge
    });

    // 儲存更新
    storageManager.updateEntry(recordId, record);
    
    // 關閉modal並更新顯示
    closeModal();
    updateRecordsList();
    showToast(`已成功延長${hours}小時，額外費用: $${extraCharge}`);
}

/**
 * 確認更換櫃位
 * @param {string} recordId - 記錄ID
 */
function confirmLockerChange(recordId) {
    const newLockerId = document.getElementById('newLocker').value;
    const reason = document.getElementById('changeReason').value;

    if (!reason.trim()) {
        showToast('請輸入更換原因', 'error');
        return;
    }

    const records = storageManager.getEntries() || [];
    const record = records.find(r => r.id === recordId);
    if (!record) {
        showToast('找不到該記錄', 'error');
        return;
    }

    // 釋放原櫃位
    lockerManager.releaseLocker(record.lockerNumber);
    
    // 佔用新櫃位
    if (!lockerManager.occupyLocker(parseInt(newLockerId))) {
        showToast('無法使用選擇的櫃位', 'error');
        return;
    }

    // 記錄更換歷史
    const oldLockerId = record.lockerNumber;
    record.lockerNumber = parseInt(newLockerId);
    record.changes = record.changes || [];
    record.changes.push({
        time: new Date().toISOString(),
        from: oldLockerId,
        to: parseInt(newLockerId),
        reason: reason
    });

    // 儲存更新
    storageManager.updateEntry(recordId, record);
    
    // 關閉modal並更新顯示
    closeModal();
    updateLockerGrid();
    updateRecordsList();
    showToast(`已將櫃位從 ${oldLockerId} 號更換至 ${newLockerId} 號`);
}

/**
 * 確認額外收費
 * @param {string} recordId - 記錄ID
 */
function confirmAdditionalCharge(recordId) {
    const amount = parseInt(document.getElementById('additionalAmount').value);
    const reason = document.getElementById('chargeReason').value;

    if (!amount || amount <= 0) {
        showToast('請輸入有效的金額', 'error');
        return;
    }

    if (!reason.trim()) {
        showToast('請輸入收費原因', 'error');
        return;
    }

    const records = storageManager.getEntries() || [];
    const record = records.find(r => r.id === recordId);
    if (!record) {
        showToast('找不到該記錄', 'error');
        return;
    }

    // 更新記錄
    record.amount += amount;
    record.charges = record.charges || [];
    record.charges.push({
        time: new Date().toISOString(),
        amount: amount,
        reason: reason
    });

    // 儲存更新
    storageManager.updateEntry(recordId, record);
    
    // 關閉modal並更新顯示
    closeModal();
    updateRecordsList();
    showToast(`已加收費用 $${amount}`);
}

/**
 * 計算額外費用
 * @param {number} hours - 延長時數
 * @returns {number} - 計算後的費用
 */
function calculateExtraCharge(hours) {
    // 這裡可以根據實際的收費標準進行計算
    const hourlyRate = 100; // 每小時收費
    return hours * hourlyRate;
}

// Export functions and assign to window
const recordsExports = {
    loadRecordsSection,
    showActionOptions,
    handleActionSelect,
    handleRecordAction,
    showConsumptionHistory,
    showAddChargeModal,
    confirmAddCharge,
    showTimeHistory,
    showLockerChangeHistory,
    confirmCompleteUse
};

// Assign functions to window object
Object.assign(window, {
    confirmAddCharge,
    showTimeHistory,
    showLockerChangeHistory,
    confirmCompleteUse,
    handleActionSelect,
    showRecordDetails,
    handleRecordAction,
    handleTimeExtension,
    handleLockerChange,
    handleAdditionalCharge,
    confirmTimeExtension,
    confirmLockerChange,
    confirmAdditionalCharge
});

/**
 * 顯示消費歷史記錄
 * @param {string} customerId - 客戶ID
 */
const showConsumptionHistory = async (customerId) => {
    try {
        const records = await getCustomerRecords(customerId);
        const content = `
            <div class="history-container">
                <h3>消費歷史記錄</h3>
                <div class="records-list">
                    ${records.map(record => `
                        <div class="record-item">
                            <div class="record-date">${new Date(record.timestamp).toLocaleString()}</div>
                            <div class="record-details">
                                <div>櫃號：${record.lockerId}</div>
                                <div>消費項目：${record.items.join(', ')}</div>
                                <div>金額：$${record.amount}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        showModal(content, '消費歷史');
    } catch (error) {
        console.error('載入消費歷史失敗:', error);
        showToast('載入消費歷史失敗', 'error');
    }
};

/**
 * 初始化記錄模組
 */
export const initializeRecords = () => {
    loadSection();
};

/**
 * 載入記錄區段
 */
const loadSection = () => {
    // ...原有的記錄區段載入邏輯...
};

// 確保導出所需的函數
export default {
    loadSection,
    initializeRecords,
    showConsumptionHistory
};