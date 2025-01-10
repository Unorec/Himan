if (!window.StatsModule) {
    window.StatsModule = (function() {
        // 私有變數
        let revenueChart = null;
        let occupancyChart = null;
        let ticketUsageChart = null;
        let chartsInitialized = false;
        let statsInitialized = false;  // 移至模組內部

        return {
            initializeCharts: function() {
                if (chartsInitialized) {
                    console.log('圖表已經初始化');
                    return;
                }

                try {
                    const revenueCtx = document.getElementById('revenueChart');
                    const occupancyCtx = document.getElementById('occupancyChart');
                    const ticketUsageCtx = document.getElementById('ticketUsageChart');

                    if (!revenueCtx || !occupancyCtx || !ticketUsageCtx) {
                        console.error('找不到必要的 canvas 元素');
                        return;
                    }

                    // 銷毀現有圖表
                    if (revenueChart) revenueChart.destroy();
                    if (occupancyChart) occupancyChart.destroy();
                    if (ticketUsageChart) ticketUsageChart.destroy();

                    // 創建新圖表
                    revenueChart = new Chart(revenueCtx, {
                        type: 'line',
                        data: {
                            labels: [],  // 將在資料載入時填充
                            datasets: [{
                                label: '營業額',
                                data: [],
                                borderColor: '#3498db',
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });

                    occupancyChart = new Chart(occupancyCtx, {
                        type: 'bar',
                        data: {
                            labels: [],
                            datasets: [{
                                label: '使用率',
                                data: [],
                                backgroundColor: '#2ecc71'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });

                    ticketUsageChart = new Chart(ticketUsageCtx, {
                        type: 'pie',
                        data: {
                            labels: ['平日券', '暢遊券', '其他'],
                            datasets: [{
                                data: [],
                                backgroundColor: ['#3498db', '#e74c3c', '#f1c40f']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });

                    chartsInitialized = true;
                } catch (error) {
                    console.error('初始化圖表時發生錯誤:', error);
                    chartsInitialized = false;
                }
            },

            updateCharts: function(data) {
                if (!chartsInitialized) {
                    this.initializeCharts();
                }

                if (revenueChart && data.revenue) {
                    revenueChart.data.labels = data.revenue.labels;
                    revenueChart.data.datasets[0].data = data.revenue.values;
                    revenueChart.update();
                }

                if (occupancyChart && data.occupancy) {
                    occupancyChart.data.labels = data.occupancy.labels;
                    occupancyChart.data.datasets[0].data = data.occupancy.values;
                    occupancyChart.update();
                }

                if (ticketUsageChart && data.ticketUsage) {
                    ticketUsageChart.data.datasets[0].data = data.ticketUsage;
                    ticketUsageChart.update();
                }
            },

            isInitialized: function() {
                return chartsInitialized;
            },

            destroyCharts: function() {
                if (revenueChart) revenueChart.destroy();
                if (occupancyChart) occupancyChart.destroy();
                if (ticketUsageChart) ticketUsageChart.destroy();
                chartsInitialized = false;
            },

            initialize: function() {
                if (statsInitialized) return;
                statsInitialized = true;

                // 確保 Chart 已經載入
                if (typeof Chart === 'undefined') {
                    console.error('Chart.js 尚未載入！');
                    return;
                }

                const timeRangeButtons = document.querySelectorAll('.btn-time');
                const customRangeBtn = document.getElementById('customRangeBtn');
                const startDateInput = document.getElementById('startDate');
                const endDateInput = document.getElementById('endDate');

                // 時間範圍選擇
                timeRangeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        timeRangeButtons.forEach(btn => btn.classList.remove('active'));
                        this.classList.add('active');
                        updateReports(this.dataset.range);
                    });
                });

                // 自訂時間範圍
                customRangeBtn?.addEventListener('click', function() {
                    const startDate = startDateInput.value;
                    const endDate = endDateInput.value;
                    if (startDate && endDate) {
                        updateReports('custom', startDate, endDate);
                    } else {
                        alert('請選擇開始和結束日期');
                    }
                });
            }
        };
    })();
}

document.addEventListener('DOMContentLoaded', function() {
    window.StatsModule.initialize();
    
    // 只在統計頁面時初始化圖表
    if (window.location.hash === '#stats') {
        window.StatsModule.initializeCharts();
        updateReports('day');
    }
});

// 更新報表
function updateReports(range, startDate, endDate) {
    // 確保模組和圖表已初始化
    if (!window.StatsModule) {
        console.error('統計模組尚未初始化');
        return;
    }

    fetchReportData(range, startDate, endDate).then(data => {
        window.StatsModule.updateCharts(data);
        updateSummary(data.summary);
    }).catch(error => {
        console.error('獲取報表數據時發生錯誤:', error);
    });
}

function updateSummary(data) {
    document.getElementById('totalRevenue').textContent = `${data.totalRevenue}元`;
    document.getElementById('avgOccupancy').textContent = `${data.avgOccupancy}%`;
    document.getElementById('totalTicketsUsed').textContent = data.totalTicketsUsed;
}

// 模擬API調用
function fetchReportData(range, startDate, endDate) {
    return new Promise(resolve => {
        setTimeout(() => {
            // 模擬數據
            const data = {
                revenue: {
                    labels: ['1月', '2月', '3月', '4月', '5月'],
                    values: [5000, 7000, 6000, 8000, 9000]
                },
                occupancy: {
                    labels: ['週一', '週二', '週三', '週四', '週五'],
                    values: [70, 75, 80, 85, 90]
                },
                ticketUsage: [300, 200, 100],
                summary: {
                    totalRevenue: 35000,
                    avgOccupancy: 80,
                    totalTicketsUsed: 600
                }
            };
            resolve(data);
        }, 1000);
    });
}

// 添加頁面可見性檢查
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && !window.StatsModule.isInitialized()) {
        console.log('頁面可見，重新初始化圖表');
        window.StatsModule.initializeCharts();
    }
});

// 添加頁面切換處理
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#stats') {
        if (!window.StatsModule.isInitialized()) {
            window.StatsModule.initializeCharts();
            updateReports('day');
        }
    }
});