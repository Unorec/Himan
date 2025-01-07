class RecordsManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.records = []; // 將來從後端獲取的數據
        
        // 初始化日期範圍
        this.setDefaultDateRange();
    }

    initializeElements() {
        // 搜尋表單元素
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.lockerNumberInput = document.getElementById('lockerNumber');
        this.paymentTypeSelect = document.getElementById('paymentType');
        this.priceTypeSelect = document.getElementById('priceType');
        this.searchBtn = document.getElementById('searchBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // 結果顯示元素
        this.totalRecordsSpan = document.getElementById('totalRecords');
        this.totalAmountSpan = document.getElementById('totalAmount');
        this.recordsTableBody = document.getElementById('recordsTableBody');
        
        // 分頁元素
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.pageInfoSpan = document.getElementById('pageInfo');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.resetBtn.addEventListener('click', () => this.resetForm());
        this.prevPageBtn.addEventListener('click', () => this.changePage(-1));
        this.nextPageBtn.addEventListener('click', () => this.changePage(1));

        // 綁定排序功能
        document.querySelectorAll('.records-table th').forEach(th => {
            th.addEventListener('click', () => this.sortRecords(th.dataset.sort));
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        this.startDateInput.value = this.formatDate(firstDayOfMonth);
        this.endDateInput.value = this.formatDate(today);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    async performSearch() {
        try {
            const searchParams = {
                startDate: this.startDateInput.value,
                endDate: this.endDateInput.value,
                lockerNumber: this.lockerNumberInput.value,
                paymentType: this.paymentTypeSelect.value,
                priceType: this.priceTypeSelect.value
            };

            // 模擬 API 調用
            this.records = await this.fetchRecords(searchParams);
            this.currentPage = 1;
            this.updateUI();
        } catch (error) {
            console.error('搜尋失敗:', error);
            this.showError('搜尋失敗，請稍後再試');
        }
    }

    resetForm() {
        this.setDefaultDateRange();
        this.lockerNumberInput.value = '';
        this.paymentTypeSelect.value = '';
        this.priceTypeSelect.value = '';
        this.records = [];
        this.updateUI();
    }

    changePage(delta) {
        const totalPages = Math.ceil(this.records.length / this.itemsPerPage);
        const newPage = this.currentPage + delta;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.updateUI();
        }
    }

    updateUI() {
        this.updateTable();
        this.updatePagination();
        this.updateSummary();
    }

    updateTable() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageRecords = this.records.slice(start, end);

        this.recordsTableBody.innerHTML = pageRecords.map(record => `
            <tr>
                <td>${this.formatDateTime(record.entryTime)}</td>
                <td>${record.lockerNumber}</td>
                <td>${this.formatPaymentType(record.paymentType)}</td>
                <td>${this.formatPaymentInfo(record)}</td>
                <td>${this.calculateTotal(record)}</td>
            </tr>
        `).join('');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.records.length / this.itemsPerPage);
        this.pageInfoSpan.textContent = `第 ${this.currentPage} 頁，共 ${totalPages} 頁`;
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages;
    }

    updateSummary() {
        const totalRecords = this.records.length;
        const totalAmount = this.records.reduce((sum, record) => sum + this.calculateTotal(record), 0);

        this.totalRecordsSpan.textContent = totalRecords;
        this.totalAmountSpan.textContent = `$${totalAmount.toFixed(2)}`;
    }

    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return `${this.formatDate(date)} ${date.toTimeString().split(' ')[0]}`;
    }

    formatPaymentType(paymentType) {
        switch (paymentType) {
            case 'cash': return '現金';
            case 'card': return '信用卡';
            default: return '未知';
        }
    }

    formatPaymentInfo(record) {
        return record.paymentType === 'cash' ? `$${record.amount}` : `${record.cardType} - $${record.amount}`;
    }

    calculateTotal(record) {
        return record.base + record.additional.reduce((sum, fee) => sum + fee.amount, 0);
    }

    async fetchRecords(searchParams) {
        // 模擬 API 調用
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        entryTime: '2023-01-01T08:00:00Z',
                        lockerNumber: 'A123',
                        paymentType: 'cash',
                        amount: 100,
                        base: 50,
                        additional: [{ type: '加班費', amount: 50 }]
                    },
                    // 更多模擬數據...
                ]);
            }, 1000);
        });
    }

    showError(message) {
        alert(message);
    }

    showFeeDetails(recordId) {
        const modal = document.getElementById('feeDetailsModal');
        // 獲取費用明細數據
        const fees = this.getFeeDetails(recordId);
        
        modal.querySelector('.modal-body').innerHTML = `
            <div class="fee-panel">
                <div class="fee-content">
                    <div class="fee-item">
                        <span>基本費用</span>
                        <span>$${fees.base}</span>
                    </div>
                    ${fees.additional.map(fee => `
                        <div class="fee-item">
                            <span>${fee.type}</span>
                            <span>$${fee.amount}</span>
                        </div>
                    `).join('')}
                    <div class="fee-total">
                        <span>總計</span>
                        <span>$${this.calculateTotal(fees)}</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    showLockerChangeModal(recordId) {
        const modal = document.getElementById('lockerChangeModal');
        modal.dataset.recordId = recordId;
        modal.style.display = 'block';
    }

    confirmLockerChange() {
        const modal = document.getElementById('lockerChangeModal');
        const recordId = modal.dataset.recordId;
        const newLockerNumber = document.getElementById('newLockerNumber').value;
        
        // 更新置物櫃號碼的邏輯
        this.updateLockerNumber(recordId, newLockerNumber);
        
        modal.style.display = 'none';
    }

    // 其他輔助方法...
}

// 初始化記錄管理器
document.addEventListener('DOMContentLoaded', () => {
    window.recordsManager = new RecordsManager();
});
