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
            return `現金 NT$ ${record.amount || 0}`;
        } else if (record.paymentType === 'ticket') {
            return `票券：${record.ticketType || ''} ${record.ticketNumber ? `(${record.ticketNumber})` : ''}`;
        }
        return '未指定付款方式';
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
            },

            // 顯示補款模態框
            showAddChargeModal: async (recordId) => {
                try {
                    const record = await recordsModule.utils.getRecordById(recordId);
                    if (!record) {
                        throw new Error('找不到此記錄');
                    }
        
                    const modalContent = `
                        <div class="modal-header">
                            <h3>補款登記</h3>
                            <button class="close-button" onclick="closeModal()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="addChargeForm" onsubmit="recordsModule.handlers.handleAddCharge(event, '${recordId}')">
                                <div class="form-group">
                                    <label>櫃位號碼: ${record.lockerNumber}</label>
                                </div>
                                <div class="form-group">
                                    <label>目前費用: NT$ ${record.amount || 0}</label>
                                </div>
                                <div class="form-group">
                                    <label for="additionalCharge">補款金額</label>
                                    <input type="number" 
                                           id="additionalCharge" 
                                           name="additionalCharge" 
                                           min="0" 
                                           step="50" 
                                           class="form-control" 
                                           required>
                                </div>
                                <div class="form-group">
                                    <label for="chargeNote">備註</label>
                                    <textarea id="chargeNote" 
                                            name="chargeNote" 
                                            class="form-control"
                                            rows="3"></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="primary-button">確認補款</button>
                                    <button type="button" class="secondary-button" onclick="closeModal()">取消</button>
                                </div>
                            </form>
                        </div>
                    `;
        
                    showModal(modalContent);
                } catch (error) {
                    console.error('Show add charge modal error:', error);
                    showToast(error.message || '顯示補款視窗失敗', 'error');
                }
            },
        
            // 處理補款提交
            handleAddCharge: async (event, recordId) => {
                event.preventDefault();
                try {
                    const form = event.target;
                    const additionalCharge = parseInt(form.additionalCharge.value);
                    const note = form.chargeNote.value.trim();
        
                    const record = await recordsModule.utils.getRecordById(recordId);
                    if (!record) {
                        throw new Error('找不到此記錄');
                    }
        
                    // 更新記錄的金額
                    record.amount = (record.amount || 0) + additionalCharge;
                    record.chargeHistory = record.chargeHistory || [];
                    record.chargeHistory.push({
                        amount: additionalCharge,
                        note: note,
                        timestamp: new Date().toISOString()
                    });
        
                    // 確認是否已結帳
                    record.isSettled = record.amount <= 0;
        
                    // 儲存更新
                    await window.storageManager.updateEntry(record);
                    
                    closeModal();
                    showToast('補款登記成功');
                    recordsModule.updateRecordsDisplay();
        
                } catch (error) {
                    console.error('Add charge error:', error);
                    showToast(error.message || '補款登記失敗', 'error');
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

function createRecordElement(record) {
    return `
        <div class="record-item ${record.status === 'active' ? 'active' : 'completed'}">
            <div class="record-header">
                <span class="record-id">${record.id}</span>
                <span class="record-status ${record.status}">${
                    record.status === 'active' ? '使用中' : '已結束'
                }</span>
            </div>
            <div class="record-body">
                <div class="record-info">
                    <p><strong>櫃位號碼:</strong> ${record.lockerNumber}</p>
                    <p><strong>入場時間:</strong> ${formatDateTime(record.entryTime)}</p>
                    ${record.exitTime ? `<p><strong>退場時間:</strong> ${formatDateTime(record.exitTime)}</p>` : ''}
                </div>
                <div class="payment-info">
                    <p><strong>付款方式:</strong> ${
                        record.paymentType === 'cash' ? '現金' : 
                        record.paymentType === 'card' ? '刷卡' : '未指定'
                    }</p>
                    <p><strong>金額:</strong> NT$ ${record.amount || 0}</p>
                    ${record.isSpecialTime ? '<span class="special-time-tag">優惠時段</span>' : ''}
                </div>
            </div>
            <div class="record-actions">
                ${record.status === 'active' ? `
                    <button class="action-button" onclick="recordsModule.handlers.handleCheckout('${record.id}')">
                        結帳退場
                    </button>
                    <button class="secondary-button" onclick="recordsModule.handlers.showAddChargeModal('${record.id}')">
                        補款
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

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
                    </div>
                </div>
            </div>
        `;

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
