// Import dependencies
import { storageManager } from './storage.js';
import { showLoading, showToast, showModal, closeModal } from './ui.js';

// 記錄相關配置
const recordsConfig = {
    itemsPerPage: 10,
    currentPage: 1,
    currentFilter: 'all'
};

// 載入入場記錄區段
const loadRecordsSection = async () => {
    try {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            throw new Error('Main content container not found');
        }

        // 顯示載入中狀態
        showLoading(true);

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
                <!-- 新增圖表區塊 -->
                <div class="card-body">
                    <div class="dashboard-charts">
                        <div class="chart-container">
                            <canvas id="lockerStatusChart"></canvas>
                        </div>
                        <div class="chart-container">
                            <canvas id="hourlyOccupancyChart"></canvas>
                        </div>
                    </div>
                    
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

        // 初始化事件監聽和更新顯示
        initializeRecordsEvents();
        updateRecordsDisplay();
        initializeCharts(); // 初始化圖表

    } catch (error) {
        console.error('Error loading records section:', error);
        showToast('載入記錄失敗', 'error');
    } finally {
        showLoading(false);
    }
};

// 初始化記錄相關事件
const initializeRecordsEvents = () => {
    try {
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
    } catch (error) {
        console.error('Error initializing records events:', error);
    }
};

// 防抖函數
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};// 更新記錄顯示
const updateRecordsDisplay = () => {
    try {
        const records = getFilteredRecords();
        const tableBody = document.getElementById('recordsTableBody');
        
        if (!tableBody) {
            throw new Error('Records table body not found');
        }

        // 處理空記錄情況
        if (records.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">目前沒有記錄</td>
                </tr>
            `;
            return;
        }

        // 生成記錄列表 HTML
        tableBody.innerHTML = records.map(record => `
            <tr class="record-row ${record.status}">
                <td>${record.lockerNumber}</td>
                <td>${formatPaymentInfo(record)}</td>
                <td>
                    <div class="time-info">
                        <div>入場：${formatDateTime(record.entryTime)}</div>
                        ${formatExitReturnTime(record)}
                        <div>預計結束：${formatDateTime(calculateExpectedEndTime(record))}</div>
                    </div>
                </td>
                <td>
                    <div>使用時數：${record.hours}小時</div>
                    <div>${calculateRemainingTime(record)}</div>
                </td>
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

        updateCharts(); // 添加更新圖表的調用

    } catch (error) {
        console.error('Error updating records display:', error);
        showToast('更新記錄顯示失敗', 'error');
    }
};

// 取得篩選後的記錄
const getFilteredRecords = () => {
    try {
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
    } catch (error) {
        console.error('Error filtering records:', error);
        return [];
    }
};

// 格式化付款資訊
const formatPaymentInfo = (record) => {
    try {
        if (record.paymentType === 'cash') {
            return `現金 $${record.amount}`;
        }
        return `票券：${record.ticketType || ''} ${record.ticketNumber ? `(${record.ticketNumber})` : ''}`;
    } catch (error) {
        console.error('Error formatting payment info:', error);
        return '付款資訊錯誤';
    }
};

// 格式化外出/返回時間
const formatExitReturnTime = (record) => {
    try {
        let html = '';
        if (record.temporaryExits && record.temporaryExits.length > 0) {
            const lastExit = record.temporaryExits[record.temporaryExits.length - 1];
            html += `
                <div>外出：${formatDateTime(lastExit.exitTime)}</div>
                ${lastExit.returnTime ? `<div>返回：${formatDateTime(lastExit.returnTime)}</div>` : ''}
            `;
        } else if (record.temporaryExitTime) {
            html += `<div>外出：${formatDateTime(record.temporaryExitTime)}</div>`;
            if (record.returnTime) {
                html += `<div>返回：${formatDateTime(record.returnTime)}</div>`;
            }
        }
        return html;
    } catch (error) {
        console.error('Error formatting exit/return time:', error);
        return '';
    }
};

// 產生快速操作按鈕
const generateQuickActionButtons = (record) => {
    try {
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
    } catch (error) {
        console.error('Error generating quick action buttons:', error);
        return '';
    }
};

// 格式化狀態
const formatStatus = (status) => {
    const statusMap = {
        'active': '使用中',
        'temporary': '暫時外出',
        'completed': '已結束'
    };
    return statusMap[status] || status;
};// 顯示時間記錄
const showTimeHistory = (recordId) => {
    try {
        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
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
                                ${exit.returnTime ? `返回：${formatDateTime(exit.returnTime)}` : '尚未返回'}
                            </div>
                        </div>
                    `).join('') : ''}

                    ${record.endTime ? `
                        <div class="time-record">
                            <div class="time-label">結束時間</div>
                            <div class="time-value">${formatDateTime(record.endTime)}</div>
                        </div>
                    ` : ''}

                    <div class="time-record">
                        <div class="time-label">使用時數</div>
                        <div class="time-value">${record.hours} 小時</div>
                    </div>
                </div>
            </div>
        `;

        showModal(modalContent);
    } catch (error) {
        console.error('Error showing time history:', error);
        showToast('顯示時間記錄失敗', 'error');
    }
};

// 顯示換置物櫃視窗
const showChangeLockerModal = (recordId) => {
    try {
        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

        // 取得可用櫃位
        const availableLockers = getAvailableLockers(record.lockerNumber);

        const modalContent = `
            <div class="modal-header">
                <h3>更換置物櫃</h3>
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
                    <button onclick="confirmChangeLocker('${record.id}')" 
                            class="primary-button">確認更換</button>
                    <button onclick="closeModal()" 
                            class="secondary-button">取消</button>
                </div>
            </div>
        `;

        showModal(modalContent);
    } catch (error) {
        console.error('Error showing change locker modal:', error);
        showToast('顯示更換櫃位視窗失敗', 'error');
    }
};

// 取得可用櫃位
const getAvailableLockers = (currentLocker) => {
    try {
        const settings = storageManager.getSettings();
        const entries = storageManager.getEntries() || [];
        
        // 取得已使用的櫃位
        const occupiedLockers = entries
            .filter(entry => 
                entry.status !== 'completed' && 
                entry.lockerNumber !== parseInt(currentLocker)
            )
            .map(entry => entry.lockerNumber);

        // 生成可用櫃位清單
        const availableLockers = [];
        const maxLockers = settings?.lockerCount || 100;
        
        for (let i = 1; i <= maxLockers; i++) {
            if (!occupiedLockers.includes(i)) {
                availableLockers.push(i);
            }
        }

        return availableLockers;
    } catch (error) {
        console.error('Error getting available lockers:', error);
        return [];
    }
};

// 確認更換櫃位
const confirmChangeLocker = async (recordId) => {
    try {
        const newLockerNumber = document.getElementById('newLockerNumber').value;
        const changeReason = document.getElementById('changeReason').value;
        const changeRemarks = document.getElementById('changeRemarks').value;

        if (!newLockerNumber) {
            throw new Error('請選擇新櫃位');
        }

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
        console.error('Error confirming locker change:', error);
        showToast(error.message || '更換櫃位失敗', 'error');
    } finally {
        showLoading(false);
    }
};

// 將新函數掛載到全域
window.showTimeHistory = showTimeHistory;
window.showChangeLockerModal = showChangeLockerModal;
window.confirmChangeLocker = confirmChangeLocker;// 時間計算相關函數
// 計算預期結束時間
const calculateExpectedEndTime = (record) => {
    try {
        const entryTime = new Date(record.entryTime);
        const hours = record.hours || 3; // 預設3小時
        return new Date(entryTime.getTime() + hours * 60 * 60 * 1000);
    } catch (error) {
        console.error('Error calculating expected end time:', error);
        return new Date();
    }
};

// 計算剩餘時間
const calculateRemainingTime = (record) => {
    try {
        if (record.status === 'completed') return '已結束';
        
        const now = new Date();
        const expectedEnd = calculateExpectedEndTime(record);
        
        if (now > expectedEnd) {
            const overtimeMinutes = Math.floor((now - expectedEnd) / (1000 * 60));
            const hours = Math.floor(overtimeMinutes / 60);
            const minutes = overtimeMinutes % 60;
            return `超時 ${hours}小時${minutes}分鐘`;
        } else {
            const remainingMinutes = Math.floor((expectedEnd - now) / (1000 * 60));
            const hours = Math.floor(remainingMinutes / 60);
            const minutes = remainingMinutes % 60;
            return `剩餘 ${hours}小時${minutes}分鐘`;
        }
    } catch (error) {
        console.error('Error calculating remaining time:', error);
        return '計算錯誤';
    }
};

// 格式化日期時間
const formatDateTime = (dateString) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date time:', error);
        return '無效日期';
    }
};

// 操作功能相關
// 顯示操作選項
const showActionOptions = (recordId) => {
    try {
        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

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

                    <button onclick="showConsumptionHistory('${record.id}')" class="menu-button">
                        <i class="icon">💰</i>
                        <span>消費紀錄</span>
                    </button>

                    ${record.status === 'active' ? `
                        <button onclick="showChangeLockerModal('${record.id}')" class="menu-button">
                            <i class="icon">🔄</i>
                            <span>換置物櫃</span>
                        </button>
                    ` : ''}

                    ${record.changeHistory?.length ? `
                        <button onclick="showLockerChangeHistory('${record.id}')" class="menu-button">
                            <i class="icon">📋</i>
                            <span>更換紀錄</span>
                        </button>
                    ` : ''}

                    ${record.status === 'active' ? `
                        <div class="menu-divider"></div>
                        <button onclick="handleActionSelect('complete', '${record.id}')" 
                                class="menu-button warning">
                            <i class="icon">✓</i>
                            <span>結束使用</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        showModal(modalContent);
    } catch (error) {
        console.error('Error showing action options:', error);
        showToast('顯示操作選項失敗', 'error');
    }
};

// 處理操作選項選擇
const handleActionSelect = async (action, recordId) => {
    try {
        closeModal();
        
        switch (action) {
            case 'complete':
                await confirmCompleteUse(recordId);
                break;
            default:
                throw new Error('無效的操作');
        }
    } catch (error) {
        console.error('Error handling action select:', error);
        showToast(error.message || '操作失敗', 'error');
    }
};

// 處理記錄操作
const handleRecordAction = async (recordId, action) => {
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
                updatedRecord.temporaryExits = updatedRecord.temporaryExits || [];
                updatedRecord.temporaryExits.push({
                    exitTime: now,
                    returnTime: null
                });
                updatedRecord.status = 'temporary';
                break;

            case 'return':
                if (updatedRecord.temporaryExits?.length) {
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
};

// 確認結束使用
const confirmCompleteUse = async (recordId) => {
    try {
        if (confirm('確定要結束使用嗎？此操作無法復原。')) {
            await handleRecordAction(recordId, 'complete');
        }
    } catch (error) {
        console.error('Error confirming complete use:', error);
        showToast('操作失敗', 'error');
    }
};

// 取得記錄by ID
const getRecordById = (recordId) => {
    try {
        const entries = storageManager.getEntries() || [];
        return entries.find(entry => entry.id === recordId);
    } catch (error) {
        console.error('Error getting record by ID:', error);
        return null;
    }
};// 消費紀錄相關功能
// 顯示消費紀錄
const showConsumptionHistory = (recordId) => {
    try {
        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

        const totalAmount = calculateTotalAmount(record);
        const basicCharge = {
            type: 'basic',
            amount: record.amount,
            description: '基本費用',
            timestamp: record.entryTime
        };

        const allCharges = [basicCharge, ...(record.additionalCharges || [])];

        const modalContent = `
            <div class="modal-header">
                <h3>消費紀錄詳情</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <div class="consumption-summary">
                    <div class="summary-item">
                        <span class="label">櫃位號碼：</span>
                        <span class="value">${record.lockerNumber}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">入場時間：</span>
                        <span class="value">${formatDateTime(record.entryTime)}</span>
                    </div>
                    <div class="summary-item total">
                        <span class="label">總消費金額：</span>
                        <span class="value">$${totalAmount}</span>
                    </div>
                </div>

                <div class="consumption-list">
                    <table class="consumption-table">
                        <thead>
                            <tr>
                                <th>時間</th>
                                <th>項目</th>
                                <th>金額</th>
                                <th>說明</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allCharges.map(charge => `
                                <tr class="consumption-item ${charge.type}">
                                    <td>${formatDateTime(charge.timestamp)}</td>
                                    <td>${formatChargeType(charge.type)}</td>
                                    <td class="amount">$${charge.amount}</td>
                                    <td>${charge.description || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${record.status === 'active' ? `
                    <div class="modal-actions">
                        <button onclick="showAddChargeModal('${record.id}')" 
                                class="primary-button">
                            新增消費
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        showModal(modalContent);
    } catch (error) {
        console.error('Error showing consumption history:', error);
        showToast('顯示消費紀錄失敗', 'error');
    }
};

// 顯示新增消費視窗
const showAddChargeModal = (recordId) => {
    try {
        const modalContent = `
            <div class="modal-header">
                <h3>新增消費</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="chargeType">消費類型</label>
                    <select id="chargeType" class="form-control" required>
                        <option value="food">餐飲</option>
                        <option value="service">服務</option>
                        <option value="overtime">超時費用</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="chargeAmount">金額</label>
                    <input type="number" id="chargeAmount" class="form-control" 
                           min="1" step="1" required>
                </div>

                <div class="form-group">
                    <label for="chargeDescription">說明</label>
                    <textarea id="chargeDescription" class="form-control" 
                            rows="2"></textarea>
                </div>

                <div class="form-actions">
                    <button onclick="confirmAddCharge('${recordId}')" 
                            class="primary-button">確認新增</button>
                    <button onclick="closeModal()" 
                            class="secondary-button">取消</button>
                </div>
            </div>
        `;

        showModal(modalContent);
    } catch (error) {
        console.error('Error showing add charge modal:', error);
        showToast('顯示新增消費視窗失敗', 'error');
    }
};

// 確認新增消費
const confirmAddCharge = async (recordId) => {
    try {
        const type = document.getElementById('chargeType').value;
        const amount = parseInt(document.getElementById('chargeAmount').value);
        const description = document.getElementById('chargeDescription').value;

        if (!amount || amount <= 0) {
            throw new Error('請輸入有效金額');
        }

        showLoading(true);

        const record = getRecordById(recordId);
        if (!record) {
            throw new Error('找不到記錄');
        }

        const newCharge = {
            type,
            amount,
            description,
            timestamp: new Date().toISOString()
        };

        const updatedRecord = {
            ...record,
            additionalCharges: [...(record.additionalCharges || []), newCharge]
        };

        if (storageManager.updateEntry(recordId, updatedRecord)) {
            closeModal();
            showToast('新增消費成功');
            showConsumptionHistory(recordId);
        } else {
            throw new Error('儲存失敗');
        }

    } catch (error) {
        console.error('Add charge error:', error);
        showToast(error.message || '新增消費失敗', 'error');
    } finally {
        showLoading(false);
    }
};

// 計算總消費金額
const calculateTotalAmount = (record) => {
    try {
        let total = record.amount || 0;
        
        if (record.additionalCharges) {
            total += record.additionalCharges.reduce((sum, charge) => 
                sum + (charge.amount || 0), 0);
        }
        
        return total;
    } catch (error) {
        console.error('Error calculating total amount:', error);
        return 0;
    }
};

// 格式化消費類型
const formatChargeType = (type) => {
    const typeMap = {
        'basic': '基本費用',
        'food': '餐飲',
        'service': '服務',
        'overtime': '超時費用',
        'other': '其他'
    };
    return typeMap[type] || type;
};

// 顯示更換記錄歷史
const showLockerChangeHistory = (recordId) => {
    try {
        const record = getRecordById(recordId);
        if (!record || !record.changeHistory?.length) {
            throw new Error('沒有更換記錄');
        }

        const modalContent = `
            <div class="modal-header">
                <h3>置物櫃更換記錄</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <div class="change-history-list">
                    ${record.changeHistory.map(change => `
                        <div class="change-record">
                            <div class="change-time">${formatDateTime(change.timestamp)}</div>
                            <div class="change-details">
                                <div>從 ${change.oldLocker} 號櫃位更換至 ${change.newLocker} 號櫃位</div>
                                <div>原因：${formatChangeReason(change.reason)}</div>
                                ${change.remarks ? `<div>備註：${change.remarks}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        showModal(modalContent);
    } catch (error) {
        console.error('Error showing locker change history:', error);
        showToast(error.message || '顯示更換記錄失敗', 'error');
    }
};

// 格式化更換原因
const formatChangeReason = (reason) => {
    const reasonMap = {
        'maintenance': '維修需求',
        'customer': '客戶要求',
        'upgrade': '升級櫃位',
        'other': '其他原因'
    };
    return reasonMap[reason] || reason;
};

// 初始化圖表
const initializeCharts = () => {
    try {
        const statistics = calculateLockerStatistics();
        
        // 櫃位狀態圓餅圖
        const statusCtx = document.getElementById('lockerStatusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: ['可用', '使用中', '暫時外出'],
                datasets: [{
                    data: [
                        statistics.available,
                        statistics.active,
                        statistics.temporary
                    ],
                    backgroundColor: [
                        '#4CAF50', // 綠色 - 可用
                        '#2196F3', // 藍色 - 使用中
                        '#FFC107'  // 黃色 - 暫時外出
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '櫃位使用狀態分布'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // 時段使用率長條圖
        const hourlyData = calculateHourlyOccupancy();
        const hourlyCtx = document.getElementById('hourlyOccupancyChart').getContext('2d');
        new Chart(hourlyCtx, {
            type: 'bar',
            data: {
                labels: hourlyData.labels,
                datasets: [{
                    label: '使用數量',
                    data: hourlyData.data,
                    backgroundColor: '#2196F3'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '各時段使用情況'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '櫃位數量'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing charts:', error);
        showToast('圖表初始化失敗', 'error');
    }
};

// 計算櫃位統計資料
const calculateLockerStatistics = () => {
    try {
        const entries = storageManager.getEntries() || [];
        const settings = storageManager.getSettings();
        const totalLockers = settings.lockerCount || 500;

        const active = entries.filter(e => e.status === 'active').length;
        const temporary = entries.filter(e => e.status === 'temporary').length;
        const available = totalLockers - active - temporary;

        return {
            total: totalLockers,
            available: available,
            active: active,
            temporary: temporary
        };
    } catch (error) {
        console.error('Error calculating locker statistics:', error);
        return {
            total: 0,
            available: 0,
            active: 0,
            temporary: 0
        };
    }
};

// 計算時段使用率
const calculateHourlyOccupancy = () => {
    try {
        const entries = storageManager.getEntries() || [];
        const activeEntries = entries.filter(e => e.status === 'active' || e.status === 'temporary');
        
        // 定義時段
        const timeSlots = [
            '6-9', '9-12', '12-15', '15-18', '18-21', '21-24', '0-3', '3-6'
        ];
        
        // 初始化數據
        const hourlyCount = new Array(timeSlots.length).fill(0);

        // 統計各時段使用數量
        const now = new Date();
        activeEntries.forEach(entry => {
            const entryTime = new Date(entry.entryTime);
            const hour = entryTime.getHours();
            const slotIndex = Math.floor((hour + 18) % 24 / 3); // 從早上6點開始算
            hourlyCount[slotIndex]++;
        });

        return {
            labels: timeSlots,
            data: hourlyCount
        };
    } catch (error) {
        console.error('Error calculating hourly occupancy:', error);
        return {
            labels: [],
            data: []
        };
    }
};

// 更新圖表
const updateCharts = () => {
    try {
        initializeCharts();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
};

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

export default exports;