export class RecordsManager {
    constructor() {
        this.records = [];
        this.currentPage = 1;
        this.recordsPerPage = 10;
    }

    // 搜尋記錄
    async searchRecords(filters) {
        try {
            // TODO: 實際串接 API
            // 這裡先模擬 API 呼叫
            const response = await this.mockSearchAPI(filters);
            this.records = response.records;
            return {
                records: this.getPageRecords(),
                total: this.records.length,
                totalPages: Math.ceil(this.records.length / this.recordsPerPage)
            };
        } catch (error) {
            console.error('搜尋記錄失敗:', error);
            throw error;
        }
    }

    // 取得目前頁面的記錄
    getPageRecords() {
        const start = (this.currentPage - 1) * this.recordsPerPage;
        const end = start + this.recordsPerPage;
        return this.records.slice(start, end);
    }

    // 切換頁面
    setPage(page) {
        this.currentPage = page;
        return this.getPageRecords();
    }

    // 模擬 API 呼叫
    async mockSearchAPI(filters) {
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            records: [
                {
                    id: 1,
                    date: '2024-01-20',
                    time: '14:30',
                    lockerNumber: '123',
                    paymentType: 'cash',
                    amount: 300,
                    periodType: 'regular',
                    status: 'active',
                    remarks: '無'
                },
                // 可以新增更多測試資料
            ]
        };
    }
}