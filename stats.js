// 建立統計模組命名空間
window.statsModule = {
    charts: {},

    init() {
        this.bindEvents();
        return this;
    },

    bindEvents() {
        document.addEventListener('statsModuleReady', () => {
            this.loadStats();
        });
    },

    async loadStats() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="stats-container">
                <div class="stats-header">
                    <h2>營業統計報表</h2>
                    <div class="stats-controls">
                        <select id="timeRange">
                            <option value="today">今日</option>
                            <option value="week">本週</option>
                            <option value="month">本月</option>
                        </select>
                        <div class="export-buttons">
                            <button onclick="statsModule.exportCSV()" class="secondary-button">
                                <i class="fas fa-file-csv"></i> 匯出CSV
                            </button>
                            <button onclick="statsModule.exportPDF()" class="secondary-button">
                                <i class="fas fa-file-pdf"></i> 匯出PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stats-card">
                        <h3>收入概況</h3>
                        <div class="stats-summary">
                            <div class="summary-item">
                                <span>總營收</span>
                                <strong id="totalRevenue">0</strong>
                            </div>
                            <div class="summary-item">
                                <span>平均每日</span>
                                <strong id="avgDailyRevenue">0</strong>
                            </div>
                        </div>
                    </div>

                    <div class="stats-card">
                        <h3>使用分析</h3>
                        <div class="stats-summary">
                            <div class="summary-item">
                                <span>總入場人次</span>
                                <strong id="totalEntries">0</strong>
                            </div>
                            <div class="summary-item">
                                <span>平均停留時間</span>
                                <strong id="avgStayTime">0</strong>
                            </div>
                        </div>
                    </div>

                    <div class="stats-card full-width">
                        <h3>每日營收趨勢</h3>
                        <canvas id="revenueChart"></canvas>
                    </div>

                    <div class="stats-card">
                        <h3>時段分布</h3>
                        <canvas id="timeDistChart"></canvas>
                    </div>

                    <div class="stats-card">
                        <h3>付款方式分析</h3>
                        <canvas id="paymentChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        await this.initCharts();
        this.loadData();
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
    }
};

// 初始化統計模組
window.statsModule.init();