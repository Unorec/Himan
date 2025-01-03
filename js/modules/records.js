(function() {
    'use strict';

    class RecordsSystem extends window.HimanSystem.Module {
        constructor() {
            super();
            this.records = new Map();
            this.elements = {};
        }

        async moduleSetup() {
            await this.bindElements();
            await this.loadRecords();
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
                this.elements.statusFilter.addEventListener('change', 
                    () => this.filterRecords());
            }
            if (this.elements.searchInput) {
                this.elements.searchInput.addEventListener('input', 
                    this.debounce(() => this.filterRecords(), 300));
            }
        }

        async loadRecords() {
            try {
                const storage = this.getModule('storage');
                const records = await storage.getItems(/^record_/);
                this.records = new Map(records.map(r => [r.id, r]));
                this.renderRecords();
                this.emit('records:loaded');
            } catch (error) {
                this.emit('records:error', error);
                throw error;
            }
        }

        async addRecord(record) {
            try {
                const id = `record_${Date.now()}`;
                const newRecord = {
                    ...record,
                    id,
                    timestamp: new Date().toISOString()
                };
                
                await this.getModule('storage')
                    .setItem(id, newRecord);
                
                this.records.set(id, newRecord);
                this.renderRecords();
                this.emit('record:added', newRecord);
                return id;
            } catch (error) {
                this.emit('record:error', error);
                throw error;
            }
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

        debounce(func, wait) {
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
    }

    // 註冊模組
    window.HimanSystem.core.registerModule('records', new RecordsSystem());
})();