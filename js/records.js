<<<<<<< Updated upstream
// 建立全域命名空間
window.recordsModule = {
    config: {
        itemsPerPage: 10,
        currentPage: 1,
        currentFilter: 'all'
    },
    utils: {},
    handlers: {}
};

// 工具函數
recordsModule.utils = {
    formatDateTime: (dateString) => {
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
    },

    calculateRemainingTime: (record) => {
        if (!record || !record.entryTime || !record.hours) return '時間資料錯誤';
        
        const now = new Date();
        const entryTime = new Date(record.entryTime);
        const endTime = new Date(entryTime.getTime() + record.hours * 60 * 60 * 1000);
        
        if (now > endTime) return '已超時';
        
        const remaining = endTime - now;
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        
        return `剩餘 ${hours}時${minutes}分`;
    },

    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    formatPaymentInfo: (record) => {
        if (record.paymentType === 'cash') {
            return `現金 $${record.amount}`;
        }
        return `票券：${record.ticketType || ''} ${record.ticketNumber ? `(${record.ticketNumber})` : ''}`;
    },

    formatExitReturnTime: (record) => {
        let html = '';
        if (record.temporaryExits?.length > 0) {
            const lastExit = record.temporaryExits[record.temporaryExits.length - 1];
            html += `
                <div>外出：${recordsModule.utils.formatDateTime(lastExit.exitTime)}</div>
                ${lastExit.returnTime ? `<div>返回：${recordsModule.utils.formatDateTime(lastExit.returnTime)}</div>` : ''}
            `;
        }
        return html;
    },

    formatStatus: (status) => {
        const statusMap = {
            'active': '使用中',
            'temporary': '暫時外出',
            'completed': '已結束',
            'nearExpiry': '即將超時',
            'overtime': '已超時',
            'unpaid': '未結消費'
        };
        return statusMap[status] || status;
    },

    generateQuickActionButtons: (record) => {
        if (record.status === 'active') {
            return `
                <button onclick="recordsModule.handlers.handleRecordAction('${record.id}', 'temporaryExit')" 
                        class="secondary-button">
                    暫時外出
                </button>
            `;
        } else if (record.status === 'temporary') {
            return `
                <button onclick="recordsModule.handlers.handleRecordAction('${record.id}', 'return')" 
                        class="secondary-button">
                    返回使用
                </button>
            `;
        }
        return '';
    },

    statusStyles: {
        active: 'status-active',
        temporary: 'status-temporary',
        completed: 'status-completed',
        nearExpiry: 'status-near-expiry',
        overtime: 'status-overtime',
        unpaid: 'status-unpaid'
    },

    getTimeStatus: (record) => {
        if (record.status === 'completed') return 'completed';
        if (record.status === 'temporary') return 'temporary';
        if (record.unpaidCharges?.length > 0) return 'unpaid';

        const now = new Date();
        const entryTime = new Date(record.entryTime);
        const endTime = new Date(entryTime.getTime() + record.hours * 60 * 60 * 1000);
        
        const timeDiff = endTime - now;
        const thirtyMinutes = 30 * 60 * 1000;

        if (timeDiff < 0) return 'overtime';
        if (timeDiff <= thirtyMinutes) return 'nearExpiry';
        return 'active';
    },

    getRecordById: (recordId) => {
        try {
            const entries = window.storageManager.getEntries() || [];
            return entries.find(entry => entry.id === recordId);
        } catch (error) {
            console.error('Error getting record by ID:', error);
            return null;
        }
    },

    getAvailableLockers: async (currentLocker) => {
        try {
            const entries = window.storageManager.getEntries() || [];
            
            // 取得已使用的櫃位
            const occupiedLockers = entries
                .filter(entry => 
                    entry.status !== 'completed' && 
                    entry.lockerNumber !== parseInt(currentLocker)
                )
                .map(entry => entry.lockerNumber);
            
            // 生成可用櫃位清單
            const availableLockers = [];
            const maxLockers = 300; // 固定設置為 300 個櫃位
            
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
    }
};

// 初始化入場記錄部分
async function initializeRecords() {
    try {
        // 檢查依賴
        if (!window.storageManager?.isInitialized) {
            throw new Error('Storage manager not initialized');
        }
        if (typeof showToast !== 'function') {
            throw new Error('Toast function not found');
        }
        if (typeof showLoading !== 'function') {
            throw new Error('Loading function not found');
        }

        // 初始化事件處理器
        recordsModule.handlers = {
            handleStatusFilter: () => {
                recordsModule.updateRecordsDisplay();
            },
            handleSearch: recordsModule.utils.debounce(() => {
                recordsModule.updateRecordsDisplay();
            }, 300),

            // 新增操作處理函數
            showActionOptions: (recordId) => {
                try {
                    const record = recordsModule.utils.getRecordById(recordId);
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
                                <button onclick="recordsModule.handlers.showTimeHistory('${record.id}')" 
                                        class="menu-button">
                                    <i class="icon">⏱️</i>
                                    <span>時間記錄</span>
                                </button>

                                ${record.status === 'active' ? `
                                    <button onclick="recordsModule.handlers.showChangeLockerModal('${record.id}')" 
                                            class="menu-button">
                                        <i class="icon">🔄</i>
                                        <span>換置物櫃</span>
                                    </button>

                                    <button onclick="recordsModule.handlers.showAddChargeModal('${record.id}')" 
                                            class="menu-button">
                                        <i class="icon">💰</i>
                                        <span>新增消費</span>
                                    </button>
                                ` : ''}

                                ${['active', 'overtime'].includes(record.status) ? `
                                    <button onclick="recordsModule.handlers.handleOvertimeAction('${record.id}')" 
                                            class="menu-button warning">
                                        <i class="icon">⚠️</i>
                                        <span>處理超時</span>
                                    </button>
                                ` : ''}

                                ${record.status === 'active' ? `
                                    <div class="menu-divider"></div>
                                    <button onclick="recordsModule.handlers.handleRecordAction('${record.id}', 'complete')" 
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
            },

            handleRecordAction: async (recordId, action) => {
                try {
                    showLoading(true);
                    const record = recordsModule.utils.getRecordById(recordId);
                    if (!record) {
                        throw new Error('找不到記錄');
                    }

                    const updatedRecord = { ...record };
                    const now = new Date().toISOString();

                    switch (action) {
                        case 'temporaryExit':
                            updatedRecord.status = 'temporary';
                            updatedRecord.temporaryExits = [
                                ...(updatedRecord.temporaryExits || []),
                                { exitTime: now, returnTime: null }
                            ];
                            break;

                        case 'return':
                            updatedRecord.status = 'active';
                            if (updatedRecord.temporaryExits?.length) {
                                updatedRecord.temporaryExits[updatedRecord.temporaryExits.length - 1].returnTime = now;
                            }
                            break;

                        case 'complete':
                            if (confirm('確定要結束使用嗎？此操作無法復原。')) {
                                updatedRecord.status = 'completed';
                                updatedRecord.endTime = now;
                            } else {
                                return;
                            }
                            break;

                        default:
                            throw new Error('無效的操作');
                    }

                    if (window.storageManager.updateEntry(recordId, updatedRecord)) {
                        showToast('操作成功');
                        closeModal();
                        recordsModule.updateRecordsDisplay();
                    } else {
                        throw new Error('更新失敗');
                    }

                } catch (error) {
                    console.error('Record action error:', error);
                    showToast(error.message || '操作失敗', 'error');
                } finally {
                    showLoading(false);
                }
            },

            showTimeHistory: (recordId) => {
                try {
                    const record = recordsModule.utils.getRecordById(recordId);
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
                                <div class="time-item">
                                    <div class="time-label">入場時間</div>
                                    <div class="time-value">${recordsModule.utils.formatDateTime(record.entryTime)}</div>
                                </div>
                                ${record.temporaryExits?.map((exit, index) => `
                                    <div class="time-item">
                                        <div class="time-label">第 ${index + 1} 次外出</div>
                                        <div class="time-value">
                                            外出：${recordsModule.utils.formatDateTime(exit.exitTime)}<br>
                                            ${exit.returnTime ? `返回：${recordsModule.utils.formatDateTime(exit.returnTime)}` : '尚未返回'}
                                        </div>
                                    </div>
                                `).join('') || ''}
                                ${record.endTime ? `
                                    <div class="time-item">
                                        <div class="time-label">結束時間</div>
                                        <div class="time-value">${recordsModule.utils.formatDateTime(record.endTime)}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;

                    showModal(modalContent);
                } catch (error) {
                    console.error('Error showing time history:', error);
                    showToast('顯示時間記錄失敗', 'error');
                }
            },

            handleOvertimeAction: async (recordId) => {
                try {
                    const record = recordsModule.utils.getRecordById(recordId);
                    if (!record) {
                        throw new Error('找不到記錄');
                    }
            
                    const overtimeHours = Math.ceil(
                        (new Date() - new Date(record.entryTime)) / (60 * 60 * 1000) - record.hours
                    );
            
                    const modalContent = `
                        <div class="modal-header">
                            <h3>處理超時</h3>
                            <button onclick="closeModal()" class="close-button">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>超時時數</label>
                                <div class="info-text">${overtimeHours} 小時</div>
                            </div>
                            <div class="form-group">
                                <label for="overtimeCharge">超時費用</label>
                                <input type="number" id="overtimeCharge" class="form-control" 
                                       value="${overtimeHours * 100}" min="0">
                            </div>
                            <div class="form-actions">
                                <button onclick="recordsModule.handlers.confirmOvertimeCharge('${record.id}')" 
                                        class="primary-button">確認收費</button>
                                <button onclick="closeModal()" 
                                        class="secondary-button">取消</button>
                            </div>
                        </div>
                    `;
            
                    showModal(modalContent);
                } catch (error) {
                    console.error('Error handling overtime:', error);
                    showToast('處理超時失敗', 'error');
                }
            },
            
            confirmOvertimeCharge: async (recordId) => {
                try {
                    const charge = parseInt(document.getElementById('overtimeCharge').value);
                    if (!charge || charge < 0) {
                        throw new Error('請輸入有效金額');
                    }
            
                    const record = recordsModule.utils.getRecordById(recordId);
                    const updatedRecord = {
                        ...record,
                        additionalCharges: [
                            ...(record.additionalCharges || []),
                            {
                                type: 'overtime',
                                amount: charge,
                                timestamp: new Date().toISOString(),
                                description: '超時費用'
                            }
                        ]
                    };
            
                    if (window.storageManager.updateEntry(recordId, updatedRecord)) {
                        showToast('已新增超時費用');
                        closeModal();
                        recordsModule.updateRecordsDisplay();
                    } else {
                        throw new Error('更新失敗');
                    }
                } catch (error) {
                    console.error('Error confirming overtime charge:', error);
                    showToast(error.message || '處理超時費用失敗', 'error');
                }
            },

            showChangeLockerModal: async (recordId) => {
                try {
                    const record = recordsModule.utils.getRecordById(recordId);
                    if (!record) {
                        throw new Error('找不到記錄');
                    }
        
                    // 取得可用櫃位
                    const availableLockers = await recordsModule.utils.getAvailableLockers(record.lockerNumber);
        
                    const modalContent = `
                        <div class="modal-header">
                            <h3>換置物櫃</h3>
                            <button onclick="closeModal()" class="close-button">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>目前櫃位</label>
                                <div class="current-locker">${record.lockerNumber} 號</div>
                            </div>
        
                            <div class="form-group">
                                <label for="newLockerNumber">新櫃位號碼</label>
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
                                <label for="remarks">備註說明</label>
                                <textarea id="remarks" class="form-control" rows="2"></textarea>
                            </div>
        
                            <div class="form-actions">
                                <button onclick="recordsModule.handlers.confirmChangeLocker('${record.id}')" 
                                        class="primary-button">確認更換</button>
                                <button onclick="closeModal()" 
                                        class="secondary-button">取消</button>
                            </div>
                        </div>
                    `;
        
                    showModal(modalContent);
                } catch (error) {
                    console.error('Error showing change locker modal:', error);
                    showToast('顯示換櫃位視窗失敗', 'error');
                }
            },
        
            confirmChangeLocker: async (recordId) => {
                try {
                    const newLockerNumber = parseInt(document.getElementById('newLockerNumber').value);
                    const changeReason = document.getElementById('changeReason').value;
                    const remarks = document.getElementById('remarks').value;
        
                    if (!newLockerNumber) {
                        throw new Error('請選擇新櫃位');
                    }
        
                    showLoading(true);
        
                    const record = recordsModule.utils.getRecordById(recordId);
                    if (!record) {
                        throw new Error('找不到記錄');
                    }
        
                    const changeHistory = {
                        timestamp: new Date().toISOString(),
                        oldLocker: record.lockerNumber,
                        newLocker: newLockerNumber,
                        reason: changeReason,
                        remarks: remarks
                    };
        
                    const updatedRecord = {
                        ...record,
                        lockerNumber: newLockerNumber,
                        lockerHistory: [...(record.lockerHistory || []), changeHistory]
                    };
        
                    if (window.storageManager.updateEntry(recordId, updatedRecord)) {
                        showToast('櫃位更換成功');
                        closeModal();
                        recordsModule.updateRecordsDisplay();
                    } else {
                        throw new Error('更新失敗');
                    }
                } catch (error) {
                    console.error('Error confirming locker change:', error);
                    showToast(error.message || '換櫃位失敗', 'error');
                } finally {
                    showLoading(false);
                }
            }
        };

        // 回傳成功
        return true;
    } catch (error) {
        console.error('Records initialization error:', error);
        return false;
    }
}

// 更新記錄顯示
recordsModule.updateRecordsDisplay = () => {
    try {
        const records = recordsModule.getFilteredRecords();
        const tableBody = document.getElementById('recordsTableBody');
        
        if (!tableBody) {
            throw new Error('Records table body not found');
        }

        tableBody.innerHTML = records.length === 0 
            ? '<tr><td colspan="6" class="text-center">目前沒有記錄</td></tr>'
            : records.map(record => recordsModule.generateRecordRow(record)).join('');

    } catch (error) {
        console.error('Error updating records display:', error);
        showToast('更新記錄顯示失敗', 'error');
    }
};

// 新增記錄管理相關函數到 recordsModule
recordsModule.getFilteredRecords = () => {
    try {
        let records = window.storageManager.getEntries() || [];
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

recordsModule.generateRecordRow = (record) => {
    try {
        const timeStatus = recordsModule.utils.getTimeStatus(record);
        const statusClass = recordsModule.utils.statusStyles[timeStatus] || 'status-active';

        return `
            <tr class="record-row ${statusClass}">
                <td>${record.lockerNumber}</td>
                <td>${recordsModule.utils.formatPaymentInfo(record)}</td>
                <td>
                    <div class="time-info">
                        <div>入場：${recordsModule.utils.formatDateTime(record.entryTime)}</div>
                        ${recordsModule.utils.formatExitReturnTime(record)}
                    </div>
                </td>
                <td>
                    <div>使用時數：${record.hours}小時</div>
                    <div class="${timeStatus === 'nearExpiry' ? 'warning-text' : ''}">
                        ${recordsModule.utils.calculateRemainingTime(record)}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${record.status}">
                        ${recordsModule.utils.formatStatus(record.status)}
                    </span>
                </td>
                <td class="action-cell">
                    <div class="action-buttons">
                        <button onclick="recordsModule.handlers.showActionOptions('${record.id}')" 
                                class="primary-button">
                            操作選項
                        </button>
                        ${recordsModule.utils.generateQuickActionButtons(record)}
                    </div>
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error generating record row:', error);
        return `
            <tr>
                <td colspan="6" class="error-row">記錄顯示錯誤</td>
            </tr>
        `;
    }
};

// 主要載入函數
async function loadRecordsSection() {
    try {
        // 初始化檢查
        if (!(await initializeRecords())) {
            throw new Error('Records module initialization failed');
        }

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            throw new Error('Main content container not found');
        }

        // 設定基本 HTML 結構
        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-between align-center">
                        <h2>入場記錄</h2>
                        <div class="header-actions">
                            <select id="statusFilter" class="form-control">
                                <option value="all">全部狀態</option>
                                <option value="active">使用中</option>
                                <option value="temporary">暫時外出</option>
                                <option value="nearExpiry">即將超時</option>
                                <option value="overtime">已超時</option>
                                <option value="unpaid">未結消費</option>
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
                            </tbody>
                        </table>
=======
// 立即執行函數初始化模組
(function() {
    // 記錄相關配置
    const recordsConfig = {
        itemsPerPage: 10,
        currentPage: 1,
        currentFilter: 'all'
    };

    // 定義全域函數
    const loadRecordsSection = async () => {
        try {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) {
                throw new Error('Main content container not found');
            }

            showLoading(true);
            
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

            // 初始化事件監聽和更新顯示
            initializeRecordsEvents();
            updateRecordsDisplay();

        } catch (error) {
            console.error('Error loading records section:', error);
            showToast('載入記錄失敗', 'error');
        } finally {
            showLoading(false);
        }
    };

    // 確保全域可用
    if (typeof window !== 'undefined') {
        // 先檢查 moduleLoaded 是否存在
        window.moduleLoaded = window.moduleLoaded || {};
        
        // 掛載所有需要的函數到全域
        window.loadRecordsSection = loadRecordsSection;
        
        // 將所有函數掛載到全域
        Object.assign(window, {
            loadRecordsSection,
            calculateRemainingTime,
            showActionOptions,
            handleActionSelect,
            handleRecordAction,
            showTimeHistory,
            showChangeLockerModal,
            confirmChangeLocker,
            showConsumptionHistory,
            showAddChargeModal,
            confirmAddCharge,
            showLockerChangeHistory,
            confirmCompleteUse
        });

        // 最後標記模組已載入
        window.moduleLoaded.records = true;
        console.log('Records module initialized successfully');
    }
})();

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
        tableBody.innerHTML = records.map(record => generateRecordRow(record)).join('');

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
>>>>>>> Stashed changes
                    </div>
                </div>
            </div>
        `;

<<<<<<< Updated upstream
        // 綁定事件
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');

        if (statusFilter) {
            statusFilter.addEventListener('change', recordsModule.handlers.handleStatusFilter);
        }
        if (searchInput) {
            searchInput.addEventListener('input', recordsModule.handlers.handleSearch);
        }

        // 更新顯示
        recordsModule.updateRecordsDisplay();

    } catch (error) {
        console.error('[Records Section] Failed to load:', error);
        showToast('載入記錄失敗: ' + error.message, 'error');
    }
}

// 將主要函數掛載到全域
window.loadRecordsSection = loadRecordsSection;

// 標記模組已載入
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.records = true;
=======
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

        // 生成可用櫃位清單，更新為300個櫃位
        const availableLockers = [];
        const maxLockers = 300; // 固定設置為 300 個櫃位
        
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

// 時間計算相關函數
// 計算預期結束時間
const calculateExpectedEndTime = (record) => {
    try {
        const entryTime = new Date(record.entryTime);
        // 確保使用時數不超過 24 小時
        const hours = Math.min(record.hours || 3, 24);
        return new Date(entryTime.getTime() + hours * 60 * 60 * 1000);
    } catch (error) {
        console.error('Error calculating expected end time:', error);
        return new Date();
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

        // 檢查是否超過合理範圍
        if (amount > 100000) { // 設定單筆消費上限為 10 萬
            throw new Error('單筆消費金額超過限制');
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

// 修改記錄狀態樣式
const statusStyles = {
    active: 'status-active',
    temporary: 'status-temporary',
    completed: 'status-completed',
    nearExpiry: 'status-near-expiry'  // 新增快超時狀態樣式
};

// 修改記錄顯示函數
function generateRecordRow(record) {
    const timeStatus = getTimeStatus(record);
    const statusClass = statusStyles[timeStatus] || statusStyles.active;

    return `
        <tr class="record-row ${statusClass}">
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
                <div class="${timeStatus === 'nearExpiry' ? 'warning-text' : ''}">${calculateRemainingTime(record)}</div>
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
    `;
}

// 新增時間狀態檢查函數
function getTimeStatus(record) {
    if (record.status === 'completed') return 'completed';
    if (record.status === 'temporary') return 'temporary';

    const now = new Date();
    const expectedEnd = new Date(record.expectedEndTime);
    const timeToEnd = expectedEnd - now;
    const oneHour = 60 * 60 * 1000;

    // 檢查是否在優惠時段內且超過早上6點
    if (record.isSpecialTimeSlot) {
        const today6am = new Date();
        today6am.setHours(6, 0, 0, 0);
        if (now > today6am) {
            return 'nearExpiry';
        }
    }

    // 檢查是否距離結束時間不到1小時
    if (timeToEnd > 0 && timeToEnd <= oneHour) {
        return 'nearExpiry';
    }

    return 'active';
}
>>>>>>> Stashed changes
