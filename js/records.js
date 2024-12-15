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
    confirmCompleteUse
});

export default {
    loadRecordsSection,
    updateLockerGrid,
    updateRecordsList
};