// 統計報表的藝術結晶
class StatsModule {
    constructor() {
        this.charts = {};
        this.currentPeriod = 'month';
        this.isInitialized = false;
    }

    // 統計系統的優雅啟動
    async init() {
        try {
            // 等待儲存管理器就緒
            await this.waitForStorage();

            this.bindEvents();
            await this.loadStats();
            this.isInitialized = true;
            
            console.log('統計模組的靈感已然綻放');
            return true;
        } catch (error) {
            console.error('統計靈感的迷失:', error);
            return false;
        }
    }

    // 等待儲存系統就緒
    async waitForStorage() {
        if (!window.storageManager?.isInitialized) {
            await new Promise((resolve, reject) => {
                const maxAttempts = 10;
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.storageManager?.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('等待儲存系統超時'));
                    }
                }, 500);
            });
        }
    }

    // 綁定互動的優雅韻律
    bindEvents() {
        // 監聽記錄更新的靈動脈動
        window.addEventListener('recordsUpdated', () => {
            this.refreshStats();
        });

        // 期間切換的優雅之舞
        document.querySelectorAll('.period-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.refreshStats();
            });
        });
    }

    // 載入統計數據的優雅過程
    async loadStats() {
        try {
            // 確保儲存管理器完全初始化
            await this.waitForStorage();
            
            // 確認儲存管理器可用
            if (!window.storageManager?.getEntries) {
                throw new Error('儲存管理器未就緒');
            }

            const entries = await window.storageManager.getEntries();
            const stats = this.calculateStats(entries || []);
            
            // 僅在有效的統計數據時更新顯示
            if (stats) {
                this.updateStatsDisplay(stats);
            }
            
            return stats;
        } catch (error) {
            console.error('統計數據的迷失:', error);
            window.showToast?.('統計資料載入失敗', 'error');
            throw error;
        }
    }

    // 計算統計數據的精妙藝術
    calculateStats(entries) {
        const stats = {
            totalRevenue: 0,           // 營收的靈動之美
            dailyRevenue: {},          // 每日收入的優雅軌跡
            paymentTypes: {            // 付款方式的和諧分布
                cash: 0,
                ticket: 0
            },
            timeSlots: {               // 時段分布的優雅韻律
                morning: 0,
                afternoon: 0,
                evening: 0,
                night: 0
            },
            specialTimeCount: 0,        // 優惠時段的精彩綻放
            occupancyRate: 0            // 使用率的動人詩篇
        };

        // 優雅地遍歷每一筆記錄
        entries.forEach(entry => {
            // 收入的優雅統計
            stats.totalRevenue += entry.amount || 0;

            // 日期的靈動分組
            const dateKey = new Date(entry.entryTime).toISOString().split('T')[0];
            if (!stats.dailyRevenue[dateKey]) {
                stats.dailyRevenue[dateKey] = 0;
            }
            stats.dailyRevenue[dateKey] += entry.amount || 0;

            // 付款方式的優雅歸類
            stats.paymentTypes[entry.paymentType] += 1;

            // 時段分布的精妙計算
            if (entry.isEveningDiscount) {
                stats.specialTimeCount += 1;
            }
        });

        // 計算使用率的靈動公式
        const totalLockers = 300; // 櫃位總數的優雅設定
        stats.occupancyRate = (entries.length / totalLockers) * 100;

        return stats;
    }

    // 更新統計顯示的視覺詩篇
    updateStatsDisplay(stats) {
        this.renderSummaryCards(stats);
        this.renderRevenueChart(stats.dailyRevenue);
        this.renderPaymentTypeChart(stats.paymentTypes);
        this.renderOccupancyChart(stats.occupancyRate);
    }

    // 繪製概要卡片的優雅畫卷
    renderSummaryCards(stats) {
        const container = document.querySelector('.stats-summary');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-card">
                <div class="stats-title">總營收</div>
                <div class="stats-value">NT$ ${stats.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="stats-card">
                <div class="stats-title">使用率</div>
                <div class="stats-value">${stats.occupancyRate.toFixed(1)}%</div>
            </div>
            <div class="stats-card">
                <div class="stats-title">優惠時段使用</div>
                <div class="stats-value">${stats.specialTimeCount} 次</div>
            </div>
        `;
    }

    // 繪製營收圖表的靈動之美
    renderRevenueChart(dailyRevenue) {
        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (!ctx) return;

        // 優雅地銷毀舊有圖表
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        const dates = Object.keys(dailyRevenue).sort();
        const revenues = dates.map(date => dailyRevenue[date]);

        // 創造新的視覺詩篇
        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: '每日營收',
                    data: revenues,
                    borderColor: '#1976d2',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '營收趨勢圖'
                    }
                }
            }
        });
    }

    // 繪製付款方式圖表的和諧之美
    renderPaymentTypeChart(paymentTypes) {
        const ctx = document.getElementById('paymentChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.payment) {
            this.charts.payment.destroy();
        }

        this.charts.payment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['現金', '票券'],
                datasets: [{
                    data: [paymentTypes.cash, paymentTypes.ticket],
                    backgroundColor: ['#4caf50', '#ff9800']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: '付款方式分布'
                    }
                }
            }
        });
    }

    // 繪製使用率圖表的精妙呈現
    renderOccupancyChart(occupancyRate) {
        const ctx = document.getElementById('occupancyChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.occupancy) {
            this.charts.occupancy.destroy();
        }

        this.charts.occupancy = new Chart(ctx, {
            type: 'gauge',
            data: {
                datasets: [{
                    value: occupancyRate,
                    data: [0, 100],
                    backgroundColor: [
                        'rgba(25, 118, 210, 0.1)',
                        'rgba(25, 118, 210, 0.5)',
                        'rgba(25, 118, 210, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '櫃位使用率'
                    }
                }
            }
        });
    }

    // 導出報表的優雅藝術
    async exportReport() {
        try {
            const stats = await this.loadStats();
            const reportContent = this.generateReportContent(stats);
            
            // 創建優雅的下載連結
            const blob = new Blob([reportContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `營業報表_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        } catch (error) {
            console.error('報表導出的迷失:', error);
            throw error;
        }
    }

    // 生成報表內容的精妙藝術
    generateReportContent(stats) {
        const headers = ['日期', '營收', '使用率', '優惠次數'];
        const rows = Object.entries(stats.dailyRevenue).map(([date, revenue]) => {
            return [
                date,
                revenue,
                stats.occupancyRate.toFixed(1) + '%',
                stats.specialTimeCount
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    // 刷新統計的靈動更新
    async refreshStats() {
        try {
            await this.loadStats();
        } catch (error) {
            console.error('統計刷新的迷失:', error);
            window.showToast?.('統計資料更新失敗', 'error');
        }
    }
}

// 將統計模組優雅地綻放到全域
window.statsModule = new StatsModule();

// 當文檔準備就緒時，啟動統計的靈感
document.addEventListener('DOMContentLoaded', () => {
    // 只在進入統計頁面時初始化
    const currentSection = document.querySelector('.menu-item.active');
    if (currentSection?.dataset.section === 'stats') {
        window.statsModule.init().catch(console.error);
    }
});