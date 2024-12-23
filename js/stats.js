// 建立統計模組命名空間
window.statsModule = {
    charts: {},

    init() {
        this.bindEvents();
        this.loadStats();
    },

    bindEvents() {
        document.addEventListener('statsModuleReady', () => {
            this.loadStats();
        });

        // 監聽記錄更新事件
        window.addEventListener('recordsUpdated', () => {
            this.loadStats();
        });
    },

    async loadStats() {
        try {
            const entries = await window.storageManager.getEntries() || [];
            const stats = this.calculateStats(entries);
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('載入統計資料失敗:', error);
        }
    },

    calculateStats(entries) {
    const stats = {
        totalRevenue: 0,
        basicCharges: 0,     // 基本入場費
        overtimeCharges: 0,  // 超時費用
        additionalCharges: 0, // 補充消費
        miscCharges: 0,      // 生活支出
        ticketSales: 0,      // 售票收入
        specialTimeCount: 0,  // 優惠時段人數
        regularCount: 0,      // 一般時段人數
        monthlyRevenue: {},
        dailyRevenue: {}
    };

    entries.forEach(entry => {
        // 基本入場費
        const baseAmount = entry.amount || 0;
        stats.basicCharges += baseAmount;
        stats.totalRevenue += baseAmount;

        // 超時費用
        if (entry.overtimeCharges) {
            stats.overtimeCharges += entry.overtimeCharges;
            stats.totalRevenue += entry.overtimeCharges;
        }

        // 補充消費
        if (entry.additionalCharges) {
            entry.additionalCharges.forEach(charge => {
                if (charge.type === 'misc') {
                    stats.miscCharges += charge.amount;
                } else {
                    stats.additionalCharges += charge.amount;
                }
                stats.totalRevenue += charge.amount;
            });
        }

        // 售票收入
        if (entry.ticketSales) {
            stats.ticketSales += entry.ticketSales;
            stats.totalRevenue += entry.ticketSales;
        }

        // 統計優惠/一般時段使用
        if (entry.isSpecialTime) {
            stats.specialTimeCount++;
        } else {
            stats.regularCount++;
        }

        // 更新每日收入
        const entryDate = new Date(entry.entryTime);
        const dateKey = entryDate.toISOString().split('T')[0];
        if (!stats.dailyRevenue[dateKey]) {
            stats.dailyRevenue[dateKey] = {
                basic: 0,
                overtime: 0,
                additional: 0,
                misc: 0,
                ticketSales: 0,
                total: 0
            };
        }
        const dayStats = stats.dailyRevenue[dateKey];
        dayStats.basic += baseAmount;
        dayStats.overtime += (entry.overtimeCharges || 0);
        if (entry.additionalCharges) {
            entry.additionalCharges.forEach(charge => {
                if (charge.type === 'misc') {
                    dayStats.misc += charge.amount;
                } else {
                    dayStats.additional += charge.amount;
                }
            });
        }
        dayStats.ticketSales += (entry.ticketSales || 0);
        dayStats.total = dayStats.basic + dayStats.overtime + dayStats.additional + dayStats.misc + dayStats.ticketSales;
    });

    return stats;
}

  updateStatsDisplay(stats) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    const html = `
        <div class="stats-container">
            <div class="stats-header">
                <h2>營業統計報表</h2>
                <div class="stats-actions">
                    <button onclick="statsModule.exportCSV()" class="primary-button">匯出CSV</button>
                    <button onclick="statsModule.exportTxtLog()" class="secondary-button">匯出記錄檔</button>
                </div>
            </div>
            <div class="stats-summary">
                <div class="revenue-breakdown">
                    <h3>收入明細</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>總營收</span>
                            <strong>NT$ ${stats.totalRevenue.toLocaleString()}</strong>
                        </div>
                        <div class="summary-item">
                            <span>基本入場費</span>
                            <strong>NT$ ${stats.basicCharges.toLocaleString()}</strong>
                        </div>
                        <div class="summary-item">
                            <span>超時費用</span>
                            <strong>NT$ ${stats.overtimeCharges.toLocaleString()}</strong>
                        </div>
                        <div class="summary-item">
                            <span>補充消費</span>
                            <strong>NT$ ${stats.additionalCharges.toLocaleString()}</strong>
                        </div>
                        <div class="summary-item">
                            <span>生活支出</span>
                            <strong>NT$ ${stats.miscCharges.toLocaleString()}</strong>
                        </div>
                        <div class="summary-item">
                            <span>售票收入</span>
                            <strong>NT$ ${stats.ticketSales.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
                <div class="customer-stats">
                    <h3>客流分析</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>優惠時段</span>
                            <strong>${stats.specialTimeCount} 人</strong>
                        </div>
                        <div class="summary-item">
                            <span>一般時段</span>
                            <strong>${stats.regularCount} 人</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div class="daily-stats">
                <h3>當日營收明細</h3>
                ${this.renderDailyStats(stats.dailyRevenue)}
            </div>
            <div class="stats-charts">
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = html;
    this.renderCharts(stats);
}

    renderDailyStats(dailyRevenue) {
        const today = new Date().toISOString().split('T')[0];
        const todayStats = dailyRevenue[today] || {
            basic: 0,
            overtime: 0,
            additional: 0,
            misc: 0,
            total: 0
        };

        return `
            <div class="daily-stats-grid">
                <div class="stat-item">
                    <span>基本入場費</span>
                    <strong>NT$ ${todayStats.basic.toLocaleString()}</strong>
                </div>
                <div class="stat-item">
                    <span>超時費用</span>
                    <strong>NT$ ${todayStats.overtime.toLocaleString()}</strong>
                </div>
                <div class="stat-item">
                    <span>補充消費</span>
                    <strong>NT$ ${todayStats.additional.toLocaleString()}</strong>
                </div>
                <div class="stat-item">
                    <span>生活支出</span>
                    <strong>NT$ ${todayStats.misc.toLocaleString()}</strong>
                </div>
                <div class="stat-item total">
                    <span>當日總計</span>
                    <strong>NT$ ${todayStats.total.toLocaleString()}</strong>
                </div>
            </div>
        `;
    },

    renderCharts(stats) {
        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(stats.dailyRevenue),
                datasets: [{
                    label: '每日營收',
                    data: Object.values(stats.dailyRevenue).map(day => day.total),
                    borderColor: '#1976d2',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => 'NT$ ' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    async initCharts() {
        // 時段分布圖
        this.charts.timeDist = new Chart(
            document.getElementById('timeDistChart'),
            {
                type: 'bar',
                data: {
                    labels: ['早班', '午班', '晚班', '夜班'],
                    datasets: [{
                        label: '入場人數',
                        data: [0, 0, 0, 0],
                        backgroundColor: '#4CAF50'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: '時段分布統計'
                        }
                    }
                }
            }
        );

        // 收入趨勢圖
        this.charts.revenue = new Chart(
            document.getElementById('revenueChart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '營業額',
                        data: [],
                        borderColor: '#2196F3'
                    }]
                }
            }
        );

        // 使用率圖
        this.charts.usage = new Chart(
            document.getElementById('usageChart'),
            {
                type: 'doughnut',
                data: {
                    labels: ['使用中', '空置'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#4CAF50', '#FFC107']
                    }]
                }
            }
        );
    },

    async loadStatsData() {
        try {
            const timeRange = document.getElementById('statsTimeRange').value;
            const entries = await window.storageManager.getEntries();
            
            // 根據時間範圍過濾資料
            const filteredData = this.filterDataByTimeRange(entries, timeRange);
            
            // 更新統計資訊
            this.updateStats(filteredData);
            
            // 更新圖表
            this.updateCharts(filteredData);
        } catch (error) {
            console.error('載入統計資料失敗:', error);
            window.showToast('載入統計資料失敗', 'error');
        }
    },

    filterDataByTimeRange(data, range) {
        const now = new Date();
        const startDate = new Date();
        
        switch(range) {
            case 'today':
                startDate.setHours(0,0,0,0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }
        
        return data.filter(entry => new Date(entry.entryTime) >= startDate);
    },

    updateStats(data) {
        document.getElementById('totalEntries').textContent = data.length;
        const totalRevenue = data.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        document.getElementById('totalRevenue').textContent = `NT$ ${totalRevenue}`;
    },

    async exportData() {
        try {
            const timeRange = document.getElementById('statsTimeRange').value;
            const data = await this.getStatsData(timeRange);
            
            // 建立 CSV 內容
            const csvContent = this.generateCSV(data);
            
            // 建立下載連結
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `stats_report_${timeRange}_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        } catch (error) {
            console.error('匯出失敗:', error);
            window.showToast('匯出報表失敗', 'error');
        }
    },

    generateCSV(data) {
        const headers = ['日期', '入場人數', '營業額', '平均停留時間'];
        const rows = data.map(row => [
            row.date,
            row.entries,
            row.revenue,
            row.avgStayTime
        ]);

        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    },

    async exportCSV() {
        try {
            const data = await this.getExportData();
            const csv = this.convertToCSV(data);
            
            // 建立下載連結
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `營業報表_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
            window.showToast('匯出失敗', 'error');
        }
    },

    async getExportData() {
        const entries = await window.storageManager.getEntries();
        const timeRange = document.getElementById('timeRange').value;
        const filteredData = this.filterDataByRange(entries, timeRange);
        
        return filteredData.map(entry => ({
            日期: new Date(entry.entryTime).toLocaleDateString(),
            時間: new Date(entry.entryTime).toLocaleTimeString(),
            櫃位號碼: entry.lockerNumber,
            金額: entry.amount,
            付款方式: entry.paymentType === 'cash' ? '現金' : '刷卡',
            優惠時段: entry.isSpecialTime ? '是' : '否'
        }));
    },

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
            headers.map(header => 
                JSON.stringify(row[header] || '')
            ).join(',')
        );
        
        return [
            headers.join(','),
            ...rows
        ].join('\n');
    },

    async exportTxtLog() {
        try {
            const entries = await window.storageManager.getEntries();
            const settings = window.storageManager.getSettings();
            
            // 產生文字記錄內容
            let content = '=== 營業記錄檔 ===\n';
            content += `產生時間: ${new Date().toLocaleString('zh-TW')}\n\n`;
            
            // 依日期分組記錄
            const groupedEntries = this.groupEntriesByDate(entries);
            
            for (const [date, dayEntries] of Object.entries(groupedEntries)) {
                content += `=== ${date} ===\n`;
                
                // 每日統計
                const dayStats = this.calculateDayStats(dayEntries);
                content += `營業額: ${dayStats.revenue} 元\n`;
                content += `入場人數: ${dayStats.count} 人\n`;
                content += `平均消費: ${dayStats.avgSpend} 元\n\n`;
                
                // 詳細記錄
                dayEntries.forEach(entry => {
                    content += this.formatEntryLog(entry);
                });
                
                content += '\n';
            }
            
            // 匯出文字檔
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `營業記錄_${new Date().toISOString().slice(0,10)}.txt`;
            link.click();
            
        } catch (error) {
            console.error('匯出記錄檔失敗:', error);
            window.showToast('匯出記錄檔失敗', 'error');
        }
    },

    groupEntriesByDate(entries) {
        return entries.reduce((groups, entry) => {
            const date = new Date(entry.entryTime).toLocaleDateString('zh-TW');
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
            return groups;
        }, {});
    },

    calculateDayStats(entries) {
        const revenue = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        const count = entries.length;
        return {
            revenue,
            count,
            avgSpend: count ? Math.round(revenue / count) : 0
        };
    },

    formatEntryLog(entry) {
        const entryTime = new Date(entry.entryTime).toLocaleTimeString('zh-TW');
        let log = `時間: ${entryTime}\n`;
        log += `櫃位: ${entry.lockerNumber}\n`;
        log += `入場費: ${entry.amount} 元\n`;
        
        if (entry.overtimeCharges) {
            log += `超時費: ${entry.overtimeCharges} 元\n`;
        }
        
        if (entry.additionalCharges && entry.additionalCharges.length > 0) {
            log += '消費明細:\n';
            let totalAdditional = 0;
            let totalMisc = 0;
            
            entry.additionalCharges.forEach(charge => {
                if (charge.type === 'misc') {
                    totalMisc += charge.amount;
                } else {
                    totalAdditional += charge.amount;
                }
                log += `  - ${charge.amount}元 (${charge.description})\n`;
            });
            
            if (totalAdditional > 0) {
                log += `補充消費小計: ${totalAdditional} 元\n`;
            }
            if (totalMisc > 0) {
                log += `生活支出小計: ${totalMisc} 元\n`;
            }
        }
        
        log += `總計金額: ${this.calculateTotalAmount(entry)} 元\n`;
        log += '-------------------\n';
        return log;
    },

    calculateTotalAmount(entry) {
        let total = entry.amount || 0;
        total += entry.overtimeCharges || 0;
        
        if (entry.additionalCharges) {
            entry.additionalCharges.forEach(charge => {
                total += charge.amount;
            });
        }
        
        return total;
    }
};

// 初始化統計模組
document.addEventListener('DOMContentLoaded', () => {
    window.statsModule.init();
});
