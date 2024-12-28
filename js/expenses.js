// 生活支出管理模組
window.expensesModule = {
    initialized: false,

    async init() {
        try {
            // 等待儲存管理器初始化
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
            console.error('支出模組初始化失敗:', error);
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

    async renderExpenses() {
        try {
            const selectedMonth = document.getElementById('expenseFilterMonth')?.value;
            const expenses = await this.getFilteredExpenses(selectedMonth);
            const summary = this.calculateSummary(expenses);

            // 更新統計資訊
            this.renderSummary(summary);
            
            // 更新支出列表
            this.renderExpensesList(expenses);
        } catch (error) {
            console.error('渲染支出資料失敗:', error);
            window.showToast?.('載入支出資料失敗', 'error');
        }
    },

    async getFilteredExpenses(monthFilter) {
        try {
            // 等待取得支出資料
            const expenses = await window.storageManager?.getExpenses();
            
            // 確保 expenses 是陣列
            if (!Array.isArray(expenses)) {
                console.warn('支出資料格式不正確，返回空陣列');
                return [];
            }
            
            if (!monthFilter) return expenses;

            return expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                const filterDate = new Date(monthFilter + '-01');
                return expenseDate.getFullYear() === filterDate.getFullYear() &&
                       expenseDate.getMonth() === filterDate.getMonth();
            });
        } catch (error) {
            console.error('取得支出資料失敗:', error);
            return [];
        }
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

        // 新增圖表顯示
        if (summary.count > 0) {
            this.renderExpenseChart(summary.categories);
        }
    },

    renderExpenseChart(categories) {
        const chartContainer = document.getElementById('expenseChart');
        if (!chartContainer) return;

        // 將類別資料轉換為圖表格式
        const chartData = {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#4caf50', '#2196f3', '#ff9800', '#f44336', 
                    '#9c27b0', '#e91e63', '#009688', '#673ab7'
                ]
            }]
        };

        // 如果已存在圖表，先銷毀
        if (this.chart) {
            this.chart.destroy();
        }

        // 建立新圖表
        this.chart = new Chart(chartContainer.getContext('2d'), {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: '支出類別分析'
                    }
                }
            }
        });
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
                    <div class="expense-actions">
                        <div class="expense-amount">NT$ ${expense.amount.toLocaleString()}</div>
                        <button onclick="expensesModule.deleteExpense('${expense.id}')" 
                                class="delete-btn">
                            刪除
                        </button>
                    </div>
                </div>
            `).join('');
    },

    async deleteExpense(expenseId) {
        try {
            if (!confirm('確定要刪除此筆支出記錄嗎？')) return;
            
            await window.storageManager.deleteExpense(expenseId);
            this.renderExpenses();
            window.showToast('支出記錄已刪除');
        } catch (error) {
            console.error('刪除支出失敗:', error);
            window.showToast('刪除支出失敗', 'error');
        }
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
                        <label>日期 <span class="required">*</span></label>
                        <input type="date" id="expenseDate" class="form-control" 
                               value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>金額 <span class="required">*</span></label>
                        <input type="number" id="expenseAmount" class="form-control" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>類別 <span class="required">*</span></label>
                        <select id="expenseCategory" class="form-control" required>
                            <option value="食品">食品</option>
                            <option value="日用品">日用品</option>
                            <option value="清潔用品">清潔用品</option>
                            <option value="維修費用">維修費用</option>
                            <option value="水電費">水電費</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>說明 <span class="required">*</span></label>
                        <input type="text" id="expenseDescription" class="form-control" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-button">新增</button>
                        <button type="button" class="secondary-button" onclick="closeModal()">取消</button>
                    </div>
                </form>
            </div>
        `;
        
        window.showModal(modalContent);
        
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
            window.closeModal();
            window.showToast('支出新增成功');
        } catch (error) {
            console.error('新增支出失敗:', error);
            window.showToast('新增支出失敗', 'error');
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