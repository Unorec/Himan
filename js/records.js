// 記錄管理的靈動詩篇
class RecordsManager {
    constructor() {
        this.state = {
            records: [],
            currentFilter: 'all',
            searchQuery: '',
            isLoading: false
        };
        
        this.recordStatus = {
            ACTIVE: 'active',           // 使用中的靈動
            TEMPORARY: 'temporary',     // 暫離的韻律
            OVERTIME: 'overtime',       // 超時的迴響
            COMPLETED: 'completed'      // 完成的詩篇
        };
    }

    // 系統初始化的優雅綻放
    async init() {
        try {
            // 確保存儲系統的靈感湧現
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }

            // 綁定事件的靈動韻律
            this.bindEvents();
            
            // 初次渲染的優雅展現
            await this.render();
            
            console.log('記錄管理的靈感已然綻放');
            return true;
        } catch (error) {
            console.error('記錄初始化的迷失:', error);
            return false;
        }
    }

    // 事件綁定的優雅韻律
    bindEvents() {
        // 狀態篩選的靈動切換
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.state.currentFilter = e.target.value;
                this.refreshRecords();
            });
        }

        // 搜尋框的優雅回應
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.state.searchQuery = searchInput.value;
                this.refreshRecords();
            }, 300));
        }
    }

    // 記錄更新的靈動刷新
    async refreshRecords() {
        try {
            this.state.isLoading = true;
            this.showLoading(true);

            // 獲取記錄的靈感綻放
            const records = await this.getFilteredRecords();
            
            // 渲染記錄的優雅呈現
            this.renderRecords(records);
        } catch (error) {
            console.error('記錄刷新的迷失:', error);
            this.showToast('記錄更新失敗', 'error');
        } finally {
            this.state.isLoading = false;
            this.showLoading(false);
        }
    }

    // 記錄篩選的精妙藝術
    async getFilteredRecords() {
        let records = await window.storageManager?.getEntries() || [];

        // 狀態篩選的靈動之美
        if (this.state.currentFilter !== 'all') {
            records = records.filter(record => 
                record.status === this.state.currentFilter
            );
        }

        // 搜尋關鍵字的優雅篩選
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            records = records.filter(record =>
                record.lockerNumber.toString().includes(query) ||
                record.remarks?.toLowerCase().includes(query)
            );
        }

        // 時間排序的優雅韻律
        return records.sort((a, b) => 
            new Date(b.entryTime) - new Date(a.entryTime)
        );
    }

    // 記錄渲染的視覺詩篇
    renderRecords(records) {
        const container = document.getElementById('recordsTableBody');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        暫無記錄的靈感綻放
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = records.map(record => this.createRecordRow(record)).join('');
    }

    // 記錄行的優雅創作
    createRecordRow(record) {
        const status = this.getStatusInfo(record);
        const timeRemaining = this.calculateTimeRemaining(record);
        
        return `
            <tr class="record-row ${status.className}">
                <td>${record.lockerNumber}</td>
                <td>
                    <div class="payment-info">
                        ${this.formatPaymentInfo(record)}
                    </div>
                </td>
                <td>
                    <div class="time-info">
                        <div>入場：${this.formatDateTime(record.entryTime)}</div>
                        ${this.formatExitInfo(record)}
                    </div>
                </td>
                <td>
                    <div class="remaining-time ${timeRemaining.className}">
                        ${timeRemaining.text}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${status.className}">
                        ${status.text}
                    </span>
                </td>
                <td>
                    ${this.createActionButtons(record)}
                </td>
            </tr>
        `;
    }

    // 狀態信息的優雅詮釋
    getStatusInfo(record) {
        const statusMap = {
            [this.recordStatus.ACTIVE]: {
                text: '使用中',
                className: 'status-active'
            },
            [this.recordStatus.TEMPORARY]: {
                text: '暫時外出',
                className: 'status-temporary'
            },
            [this.recordStatus.OVERTIME]: {
                text: '已超時',
                className: 'status-overtime'
            },
            [this.recordStatus.COMPLETED]: {
                text: '已完成',
                className: 'status-completed'
            }
        };

        return statusMap[record.status] || statusMap[this.recordStatus.ACTIVE];
    }

    // 時間計算的靈動藝術
    calculateTimeRemaining(record) {
        const now = new Date();
        const entryTime = new Date(record.entryTime);
        const endTime = new Date(entryTime.getTime() + record.hours * 60 * 60 * 1000);
        const timeDiff = endTime - now;

        if (timeDiff < 0) {
            return {
                text: '已超時',
                className: 'text-error'
            };
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return {
            text: `剩餘 ${hours}時${minutes}分`,
            className: hours < 1 ? 'text-warning' : ''
        };
    }

    // 操作按鈕的優雅呈現
    createActionButtons(record) {
        const buttons = [];

        if (record.status === this.recordStatus.ACTIVE) {
            buttons.push(`
                <button onclick="recordsManager.handleAction('${record.id}', 'temporaryExit')"
                        class="btn btn-secondary btn-sm">
                    暫時外出
                </button>
            `);
        }

        if (record.status === this.recordStatus.TEMPORARY) {
            buttons.push(`
                <button onclick="recordsManager.handleAction('${record.id}', 'return')"
                        class="btn btn-primary btn-sm">
                    返回使用
                </button>
            `);
        }

        buttons.push(`
            <button onclick="recordsManager.showActionModal('${record.id}')"
                    class="btn btn-info btn-sm">
                更多操作
            </button>
        `);

        return buttons.join('');
    }

    // 格式化的優雅工藝
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatPaymentInfo(record) {
        return record.paymentType === 'cash' ?
            `現金：NT$ ${record.amount}` :
            `票券：${record.ticketNumber}`;
    }

    formatExitInfo(record) {
        if (!record.temporaryExits?.length) return '';

        const lastExit = record.temporaryExits[record.temporaryExits.length - 1];
        return `
            <div>外出：${this.formatDateTime(lastExit.exitTime)}</div>
            ${lastExit.returnTime ? 
                `<div>返回：${this.formatDateTime(lastExit.returnTime)}</div>` : 
                ''
            }
        `;
    }

    // 延遲處理的優雅方案
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 載入動畫的靈動展現
    showLoading(show = true) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // 提示訊息的優雅呈現
    showToast(message, type = 'info') {
        window.showToast?.(message, type);
    }

    // 渲染方法的優雅呈現
    render() {
        const tableBody = document.getElementById('recordsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        this.state.records.forEach(record => {
            const row = this.createRecordRow(record);
            tableBody.appendChild(row);
        });
    }
}

// 將記錄管理優雅地綻放到全域
window.recordsManager = new RecordsManager();

// 當文檔準備就緒時，喚醒記錄的靈感
document.addEventListener('DOMContentLoaded', () => {
    window.recordsManager.init().catch(console.error);
});