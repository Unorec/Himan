// 系統預設設定
const defaultSettings = {
    basePrice: 500,
    maxHours: 24,
    timeSlots: {
        weekdayEvening: {
            name: '平日晚間優惠',
            price: 350,
            startTime: '18:30',
            endTime: '19:30',
            days: [1, 2, 3, 4],
            description: '平日晚間優惠時段'
        },
        weekendEvening: {
            name: '假日晚間優惠',
            price: 500,
            startTime: '18:30',
            endTime: '19:30',
            days: [5, 6, 0],
            description: '假日晚間優惠時段'
        }
    }
};

// 掛載到全域
window.defaultSettings = defaultSettings;

// 新增優惠時段價格設定
const timeSlotPrices = {
    weekday: {
        regular: 500,    // 平日一般價格
        special: 350     // 平日優惠價格
    },
    weekend: {
        regular: 500,    // 假日一般價格
        special: 500     // 假日優惠價格
    }
};

// 將設定掛載到全域
window.defaultSettings = defaultSettings;

// ...existing code...
