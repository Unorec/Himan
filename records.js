document.addEventListener('DOMContentLoaded', function() {
    const recordsBody = document.getElementById('recordsBody');
    const searchInput = document.getElementById('recordSearch');
    const searchBtn = document.getElementById('searchBtn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentRecords = [];

    // 全域變數定義
    const STORAGE_KEY = 'himanRecords';
    let records = loadRecords();

    // 載入記錄
    function loadRecords() {
        const savedRecords = localStorage.getItem(STORAGE_KEY);
        return savedRecords ? JSON.parse(savedRecords) : [];
    }

    // 儲存記錄
    function saveRecords(records) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        // 更新當前記錄
        currentRecords = records;
    }

    // 模擬從後端獲取數據
    fetchRecords().then(data => {
        currentRecords = data;
        renderRecords(currentRecords);
    });

    // 搜尋功能
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredRecords = currentRecords.filter(record => 
            record.lockerNumber.toLowerCase().includes(searchTerm) ||
            record.notes.toLowerCase().includes(searchTerm)
        );
        renderRecords(filteredRecords);
    }

    // 過濾功能
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const filterValue = this.id.replace('filter', '').toLowerCase();
            const filteredRecords = filterValue === 'all' 
                ? currentRecords 
                : currentRecords.filter(record => record.status === filterValue);
            renderRecords(filteredRecords);
        });
    });

    // 渲染記錄
    function renderRecords(records) {
        recordsBody.innerHTML = records.map(record => `
            <tr>
                <td>${record.lockerNumber}</td>
                <td><span class="status-badge ${record.status}">${getStatusText(record.status)}</span></td>
                <td>${formatDateTime(record.entryTime)}</td>
                <td>${record.tempExitTime ? formatDateTime(record.tempExitTime) : '-'}</td>
                <td>${record.returnTime ? formatDateTime(record.returnTime) : '-'}</td>
                <td>${formatDuration(record.remainingTime)}</td>
                <td>
                    <button class="btn btn-info" onclick="showPaymentDetails(${record.id})">
                        ${calculateTotal(record.extraCharges)}元
                    </button>
                </td>
                <td>
                    <button class="btn btn-warning" onclick="handleTempExit(${record.id})">暫離</button>
                    <button class="btn btn-success" onclick="handleAddCharge(${record.id})">加收費</button>
                    <button class="btn btn-primary" onclick="handleChangeLocker(${record.id})">換櫃</button>
                </td>
            </tr>
        `).join('');
    }

    // 輔助函數
    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('zh-TW');
    }

    function formatDuration(minutes) {
        if (minutes <= 0) return '已超時';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}小時${mins}分鐘`;
    }

    function getStatusText(status) {
        const statusMap = {
            'active': '使用中',
            'warning': '即將到期',
            'critical': '緊急',
            'expired': '已超時'
        };
        return statusMap[status] || status;
    }

    function calculateTotal(charges) {
        // 添加防護檢查
        if (!Array.isArray(charges) || charges.length === 0) {
            return 0;
        }
        return charges.reduce((sum, charge) => sum + charge.amount, 0);
    }

    // 暫離處理
    window.handleTemporaryLeave = function(button) {
        const row = button.closest('tr');
        const now = new Date();
        row.cells[3].textContent = now.toLocaleString('zh-TW');
        row.querySelector('.status-badge').className = 'status-badge warning';
        row.querySelector('.status-badge').textContent = '暫離中';
        button.textContent = '返回';
        button.onclick = () => handleReturn(button);
        
        // 更新記錄
        updateRecord(row, { tempLeaveTime: now, status: 'temporary_leave' });
    };

    // 返回處理
    window.handleReturn = function(button) {
        const row = button.closest('tr');
        const now = new Date();
        row.cells[4].textContent = now.toLocaleString('zh-TW');
        row.querySelector('.status-badge').className = 'status-badge active';
        row.querySelector('.status-badge').textContent = '使用中';
        button.textContent = '暫離';
        button.onclick = () => handleTemporaryLeave(button);
        
        // 更新記錄
        updateRecord(row, { returnTime: now, status: 'active' });
    };

    // 結束處理
    window.handleCheckout = function(button) {
        const row = button.closest('tr');
        if (confirm('確定要結束使用嗎？')) {
            row.remove();
            // 更新記錄
            removeRecord(row.cells[0].textContent);
        }
    };

    // 更新記錄
    function updateRecord(row, updates) {
        const lockerNumber = row.cells[0].textContent;
        const recordIndex = records.findIndex(r => r.lockerNumber === lockerNumber);
        if (recordIndex !== -1) {
            records[recordIndex] = { ...records[recordIndex], ...updates };
            saveRecords();
        }
    }

    // 移除記錄
    function removeRecord(lockerNumber) {
        records = records.filter(r => r.lockerNumber !== lockerNumber);
        saveRecords();
    }

    // 匯出報表
    window.exportReport = function() {
        const now = new Date();
        const fileName = `himan_report_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.csv`;
        
        let csvContent = "櫃位號碼,狀態,入場時間,暫離時間,返回時間,費用資訊\n";
        records.forEach(record => {
            csvContent += `${record.lockerNumber},${record.status},${record.entryTime},${record.tempLeaveTime || ''},${record.returnTime || ''},${record.paymentInfo}\n`;
        });

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    };

    // 搜尋功能
    document.getElementById('searchBtn')?.addEventListener('click', function() {
        const searchText = document.getElementById('recordSearch').value.toLowerCase();
        const rows = document.querySelectorAll('#recordsBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchText) ? '' : 'none';
        });
    });

    // 新增頁面切換事件監聽
    window.addEventListener('hashchange', function() {
        if (location.hash === '#records') {
            loadAndRenderRecords();
        }
    });

    // 初始載入檢查
    if (location.hash === '#records') {
        loadAndRenderRecords();
    }

    // 載入並渲染記錄
    function loadAndRenderRecords() {
        const records = loadRecords();
        if (records && records.length > 0) {
            currentRecords = records;
            renderRecords(records);
        }
    }
});

// 模擬API調用
function fetchRecords() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                { id: 1, lockerNumber: 'A001', status: 'active', entryTime: '2024-01-10T10:00:00', tempExitTime: null, returnTime: null, remainingTime: 120, extraCharges: [{ id: 1, amount: 500 }], notes: '' },
                { id: 2, lockerNumber: 'B015', status: 'warning', entryTime: '2024-01-10T11:30:00', tempExitTime: null, returnTime: null, remainingTime: 30, extraCharges: [{ id: 1, amount: 700 }], notes: '優惠券使用' },
                // 更多模擬數據...
            ]);
        }, 1000);
    });
}

// 這些函數將在實際實現中完成
function showPaymentDetails(id) {
    console.log('顯示付款詳情:', id);
}

function handleTempExit(id) {
    console.log('處理暫時離開:', id);
}

function handleAddCharge(id) {
    console.log('處理加收費用:', id);
}

function handleChangeLocker(id) {
    console.log('處理更換櫃位:', id);
}

// 處理暫離功能
function handleTemporaryLeave(button) {
    const row = button.closest('tr');
    const lockerNumber = row.querySelector('td:first-child').textContent;
    
    // 更新暫離時間
    const leaveTime = new Date().toLocaleString('zh-TW');
    row.querySelector('td:nth-child(4)').textContent = leaveTime;
    
    // 更新狀態
    row.querySelector('td:nth-child(2)').textContent = '暫離中';
    row.classList.add('temporary-leave');
    
    // 更新按鈕狀態
    button.style.display = 'none';
    row.querySelector('.btn-success').style.display = 'inline-block';
}

// 處理返回功能
function handleReturn(button) {
    const row = button.closest('tr');
    const lockerNumber = row.querySelector('td:first-child').textContent;
    
    // 更新返回時間
    const returnTime = new Date().toLocaleString('zh-TW');
    row.querySelector('td:nth-child(5)').textContent = returnTime;
    
    // 更新狀態
    row.querySelector('td:nth-child(2)').textContent = '使用中';
    row.classList.remove('temporary-leave');
    
    // 更新按鈕狀態
    button.style.display = 'none';
    row.querySelector('.btn-warning').style.display = 'inline-block';
}

// 費用常數定義
if (!window.PRICING) {
    window.PRICING = {
        REGULAR: 500,
        WEEKEND: 700,
        DISCOUNT: 350
    };
}

// 判斷是否為週末
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 5 || day === 6; // 週五、週六、週日
}

// 計算基本費用
function getBasePrice(entryTime) {
    const entryDate = new Date(entryTime);
    return isWeekend(entryDate) ? PRICING.WEEKEND_PRICE : PRICING.WEEKDAY_PRICE;
}

// 修改費用計算函數
function calculateFee(entryTime, exitTime) {
    const entry = new Date(entryTime);
    const exit = exitTime ? new Date(exitTime) : new Date();
    
    // 計算使用時數
    const hoursUsed = Math.ceil((exit - entry) / (1000 * 60 * 60));
    
    // 基本費用
    let totalFee = getBasePrice(entry);
    
    // 超時費用計算
    if (hoursUsed > PRICING.TIME_LIMIT) {
        const overtimeHours = Math.ceil(hoursUsed - PRICING.TIME_LIMIT);
        // 超時費用按照當下是平日還是假日來計算
        const overtimeRate = isWeekend(exit) ? 
            PRICING.OVERTIME_RATE * 1.4 : // 假日超時費用較高
            PRICING.OVERTIME_RATE;
        totalFee += overtimeHours * overtimeRate;
    }
    
    return {
        basePrice: getBasePrice(entry),
        overtimeHours: Math.max(0, hoursUsed - PRICING.TIME_LIMIT),
        totalFee: totalFee,
        hoursUsed: hoursUsed
    };
}

// 修改結帳函數
function handleCheckout(button) {
    const row = button.closest('tr');
    const lockerNumber = row.querySelector('td:first-child').textContent;
    const entryTime = row.querySelector('td:nth-child(3)').textContent;
    
    if (confirm(`確定要為 ${lockerNumber} 號櫃位結帳嗎？`)) {
        const feeDetails = calculateFee(entryTime);
        
        const message = `結帳明細：\n` +
            `使用時數：${feeDetails.hoursUsed}小時\n` +
            `基本費用：${feeDetails.basePrice}元\n` +
            (feeDetails.overtimeHours > 0 ? 
                `超時時數：${feeDetails.overtimeHours}小時\n` : '') +
            `應付總額：${feeDetails.totalFee}元`;
            
        if (confirm(message)) {
            // 更新記錄狀態
            const records = loadRecords();
            const updatedRecords = records.map(record => {
                if (record.lockerNumber === lockerNumber) {
                    return {
                        ...record,
                        status: 'checked-out',
                        checkoutTime: new Date().toISOString(),
                        finalFee: feeDetails.totalFee
                    };
                }
                return record;
            });
            
            // 儲存更新後的記錄
            saveRecords(updatedRecords);
            
            // 更新 UI
            row.querySelector('td:nth-child(2)').textContent = '已結帳';
            row.classList.add('checked-out');
            row.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化記錄顯示
    initializeRecords();
    
    // 監聽頁面切換
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#records') {
            loadRecords();
        }
    });
});

function initializeRecords() {
    if (window.location.hash === '#records') {
        loadRecords();
    }
}

function loadRecords() {
    const records = Storage.getEntryRecords();
    displayRecords(records);
}

function displayRecords(records) {
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.lockerNumber}</td>
            <td>${getStatus(record)}</td>
            <td>${formatDateTime(record.entryTime)}</td>
            <td>${record.tempLeaveTime ? formatDateTime(record.tempLeaveTime) : '-'}</td>
            <td>${record.returnTime ? formatDateTime(record.returnTime) : '-'}</td>
            <td>${calculateRemainingTime(record)}</td>
            <td>${formatPaymentInfo(record)}</td>
            <td class="action-buttons">
                <button class="btn btn-warning" onclick="handleTemporaryLeave(${record.lockerNumber})">暫離</button>
                <button class="btn btn-success" onclick="handleReturn(${record.lockerNumber})">返回</button>
                <button class="btn btn-danger" onclick="handleCheckout(${record.lockerNumber})">結帳</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 輔助函數
function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-TW');
}

function getStatus(record) {
    if (record.checkoutTime) return '已結束';
    if (record.tempLeaveTime && !record.returnTime) return '暫離中';
    return '使用中';
}

function calculateRemainingTime(record) {
    // 根據您的業務邏輯實作計算剩餘時間
    return '計算中...';
}

function formatPaymentInfo(record) {
    return `${record.paymentType === 'cash' ? '現金' : '票券'}: ${record.amount}元`;
}