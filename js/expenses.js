// 生活支出管理模組
window.expensesModule = {
    initialized: false,

    async init() {
        try {
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }
            
            // 綁定事件處理
            this.bindEvents();
            // 初始化月份選擇器
            this.initMonthFilter();
            // 顯示支出資料
            this.renderExpenses();

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Expenses initialization error:', error);
            return false;
        }
    },

    bindEvents() {
        // 新增支出按鈕
        const addBtn = document.getElementById('addExpenseBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddExpenseModal());
        }

        // 月份篩選
        const monthFilter = document.getElementById('expenseFilterMonth');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => this.renderExpenses());
        }
    },

    initMonthFilter() {
        const monthFilter = document.getElementById('expenseFilterMonth');
        if (!monthFilter) return;

        const today = new Date();
        const months = [];
        
        // 生成過去12個月的選項
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                value: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
                label: `${date.getFullYear()}年${date.getMonth() + 1}月`
            });
        }

        monthFilter.innerHTML = `
            <option value="">全部月份</option>
            ${months.map(month => `
                <option value="${month.value}">${month.label}</option>
            `).join('')}
        `;
    },

    renderExpenses() {
        const selectedMonth = document.getElementById('expenseFilterMonth')?.value;
        const expenses = this.getFilteredExpenses(selectedMonth);
        const summary = this.calculateSummary(expenses);

        // 更新統計資訊
        this.renderSummary(summary);
        
        // 更新支出列表
        this.renderExpensesList(expenses);
    },

    getFilteredExpenses(monthFilter) {
        const expenses = window.storageManager?.getExpenses() || [];
        
        if (!monthFilter) return expenses;

        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const filterDate = new Date(monthFilter + '-01');
            return expenseDate.getFullYear() === filterDate.getFullYear() &&
                   expenseDate.getMonth() === filterDate.getMonth();
        });
    },

    calculateSummary(expenses) {
        return {
            total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
            count: expenses.length,
            average: expenses.length ? 
                Math.round(expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length) : 0,
            categories: this.getCategorySummary(expenses)
        };
    },

    getCategorySummary(expenses) {
        const categories = {};
        expenses.forEach(expense => {
            if (!categories[expense.category]) {
                categories[expense.category] = 0;
            }
            categories[expense.category] += expense.amount;
        });
        return categories;
    },

    renderSummary(summary) {
        const summaryContainer = document.querySelector('.expenses-summary');
        if (!summaryContainer) return;

        summaryContainer.innerHTML = `
            <div class="expense-stat">
                <div class="label">總支出</div>
                <div class="amount">NT$ ${summary.total.toLocaleString()}</div>
            </div>
            <div class="expense-stat">
                <div class="label">支出次數</div>
                <div class="amount">${summary.count}</div>
            </div>
            <div class="expense-stat">
                <div class="label">平均每筆</div>
                <div class="amount">NT$ ${summary.average.toLocaleString()}</div>
            </div>
        `;
    },

    renderExpensesList(expenses) {
        const listContainer = document.querySelector('.expenses-list');
        if (!listContainer) return;

        if (expenses.length === 0) {
            listContainer.innerHTML = '<div class="no-data">尚無支出記錄</div>';
            return;
        }

        listContainer.innerHTML = expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(expense => `
                <div class="expense-item">
                    <div class="expense-details">
                        <div class="expense-main">
                            <span class="expense-title">${expense.description}</span>
                            <span class="expense-category">${expense.category}</span>
                        </div>
                        <div class="expense-date">${this.formatDate(expense.date)}</div>
                    </div>
                    <div class="expense-amount">NT$ ${expense.amount.toLocaleString()}</div>
                </div>
            `).join('');
    },

    showAddExpenseModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>新增支出</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addExpenseForm">
                    <div class="form-group">
                        <label for="expenseDate">日期 <span class="required">*</span></label>
                        <input type="date" id="expenseDate" class="form-control" 
                               value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseAmount">金額 <span class="required">*</span></label>
                        <input type="number" id="expenseAmount" class="form-control" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseCategory">類別 <span class="required">*</span></label>
                        <select id="expenseCategory" class="form-control" required>
                            <option value="食品">食品</option>
                            <option value="交通">交通</option>
                            <option value="娛樂">娛樂</option>
                            <option value="日用品">日用品</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expenseDescription">說明 <span class="required">*</span></label>
                        <input type="text" id="expenseDescription" class="form-control" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-button">新增</button>
                        <button type="button" class="secondary-button" onclick="closeModal()">取消</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        
        // 綁定表單提交事件
        document.getElementById('addExpenseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addExpense();
        });
    },

    async addExpense() {
        try {
            const expense = {
                id: 'expense_' + Date.now(),
                date: document.getElementById('expenseDate').value,
                amount: parseInt(document.getElementById('expenseAmount').value),
                category: document.getElementById('expenseCategory').value,
                description: document.getElementById('expenseDescription').value,
                createdAt: new Date().toISOString()
            };

            await window.storageManager?.addExpense(expense);
            this.renderExpenses();
            closeModal();
            showToast('支出新增成功');
        } catch (error) {
            console.error('Add expense error:', error);
            showToast('支出新增失敗', 'error');
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
};

// 確保頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    window.expensesModule.init();
});
