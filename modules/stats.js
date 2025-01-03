// 統計報表的藝術結晶
class StatsModule extends window.HimanSystem.Module {
    constructor() {
        super();
        this.charts = new Map();
        this.currentPeriod = 'month';
    }

    async moduleSetup() {
        await this.bindElements();
        await this.loadStats();
        this.bindEvents();
    }

    bindEvents() {
        this.on('records:updated', () => this.refreshStats());
        
        document.querySelectorAll('.period-selector').forEach(selector => {
            selector.addEventListener('change', this.handlePeriodChange.bind(this));
        });
    }

    async loadStats() {
        try {
            const storage = this.getModule('storage');
            const entries = await storage.getItems(/^entry_/);
            const stats = this.calculateStats(entries);
            this.updateDisplay(stats);
            this.emit('stats:loaded', stats);
            return stats;
        } catch (error) {
            this.emit('stats:error', error);
            throw error;
        }
    }

    calculateStats(entries) {
        return {
            totalRevenue: this.calculateRevenue(entries),
            dailyRevenue: this.calculateDailyRevenue(entries),
            paymentTypes: this.calculatePaymentTypes(entries),
            occupancyRate: this.calculateOccupancy(entries),
            timeDistribution: this.calculateTimeDistribution(entries)
        };
    }

    updateDisplay(stats) {
        this.renderSummary(stats);
        this.renderCharts(stats);
    }

    renderCharts(stats) {
        this.renderRevenueChart(stats.dailyRevenue);
        this.renderPaymentChart(stats.paymentTypes);
        this.renderOccupancyChart(stats.occupancyRate);
    }

    async exportReport() {
        try {
            const stats = await this.loadStats();
            const csv = this.generateCSV(stats);
            this.downloadFile(csv, 'stats_report.csv');
        } catch (error) {
            this.emit('stats:export_error', error);
            throw error;
        }
    }
}

// 註冊模組
window.HimanSystem.core.registerModule('stats', new StatsModule());