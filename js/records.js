(function() {
    'use strict';

    class RecordsSystem {
        constructor() {
            this.records = new Map();
            this.initialize();
        }

        initialize() {
            this.bindElements();
            this.loadRecords();
            this.attachEventListeners();
        }

        bindElements() {
            this.elements = {
                recordsTable: document.querySelector('.records-table table'),
                statusFilter: document.getElementById('statusFilter'),
                searchInput: document.getElementById('searchInput')
            };
        }

        attachEventListeners() {
            if (this.elements.statusFilter) {
                this.elements.statusFilter.addEventListener('change', () => this.filterRecords());
            }
            if (this.elements.searchInput) {
                this.elements.searchInput.addEventListener('input', () => this.filterRecords());
            }
        }

        async loadRecords() {
            try {
                // 從 localStorage 或 API 載入記錄
                const savedRecords = localStorage.getItem('entryRecords');
                if (savedRecords) {
                    this.records = new Map(JSON.parse(savedRecords));
                }
                this.renderRecords();
            } catch (error) {
                console.error('載入入場記錄失敗:', error);
                window.showToast?.('載入記錄失敗', 'error');
            }
        }

        addRecord(record) {
            const id = Date.now().toString();
            record.id = id;
            record.timestamp = new Date().toISOString();
            this.records.set(id, record);
            this.saveRecords();
            this.renderRecords();
            return id;
        }

        updateRecord(id, updates) {
            const record = this.records.get(id);
            if (record) {
                Object.assign(record, updates);
                this.saveRecords();
                this.renderRecords();
                return true;
            }
            return false;
        }

        deleteRecord(id) {
            const result = this.records.delete(id);
            if (result) {
                this.saveRecords();
                this.renderRecords();
            }
            return result;
        }

        filterRecords() {
            const status = this.elements.statusFilter?.value || 'all';
            const searchText = this.elements.searchInput?.value.toLowerCase() || '';

            const filtered = Array.from(this.records.values()).filter(record => {
                const matchesStatus = status === 'all' || record.status === status;
                const matchesSearch = !searchText || 
                    record.lockerNumber.toString().includes(searchText) ||
                    record.remarks?.toLowerCase().includes(searchText);
                return matchesStatus && matchesSearch;
            });

            this.renderFilteredRecords(filtered);
        }

        findActiveByLocker(lockerNumber) {
            return Array.from(this.records.values()).find(record => 
                record.lockerNumber === lockerNumber && 
                record.status === 'active'
            );
        }

        saveRecords() {
            try {
                localStorage.setItem('entryRecords', 
                    JSON.stringify(Array.from(this.records.entries())));
            } catch (error) {
                console.error('儲存入場記錄失敗:', error);
                window.showToast?.('儲存記錄失敗', 'error');
            }
        }

        renderFilteredRecords(records) {
            if (!this.elements.recordsTable) return;

            const tbody = document.createElement('tbody');
            records.forEach(record => {
                const row = this.createRecordRow(record);
                tbody.appendChild(row);
            });

            const existingTbody = this.elements.recordsTable.querySelector('tbody');
            if (existingTbody) {
                existingTbody.replaceWith(tbody);
            } else {
                this.elements.recordsTable.appendChild(tbody);
            }
        }

        renderRecords() {
            this.filterRecords();
        }

        createRecordRow(record) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.lockerNumber}</td>
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>${record.paymentType === 'cash' ? '現金' : '票券'}</td>
                <td>${record.amount || record.ticketNumber || '-'}</td>
                <td>${this.getStatusDisplay(record.status)}</td>
                <td>${record.remarks || '-'}</td>
                <td>
                    <button class="action-btn" data-action="edit" data-id="${record.id}">編輯</button>
                    <button class="action-btn" data-action="delete" data-id="${record.id}">刪除</button>
                </td>
            `;
            return row;
        }

        getStatusDisplay(status) {
            const statusMap = {
                active: '使用中',
                temporary: '暫時外出',
                completed: '已完成'
            };
            return statusMap[status] || status;
        }
    }

    // 註冊模組
    window.HimanSystem.ModuleManager.register('records', RecordsSystem);
})();