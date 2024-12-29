// 系統全域設定
window.HimanSystem = window.HimanSystem || {};

(function() {
    // 檢查是否已經定義過設定
    if (window.HimanSystem.DEFAULT_SETTINGS) {
        console.warn('系統設定已存在，跳過重複定義');
        return;
    }

    function isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 系統設定定義
    const DEFAULT_SETTINGS = {
        // 系統基本設定
        system: {
            debug: false,
            apiUrl: window.location.origin,
            timeout: 30000,
            retryAttempts: 3,
            sessionTimeout: 3600000,
            heartbeatInterval: 30000,
            version: '1.0.0',
            buildNumber: '20241227',
            environment: 'production'
        },
        // 入場管理設定
        entry: {
            defaultPrice: 500,
            weekendPrice: 700,
            discountPrice: 350,
            weekendDiscountPrice: 500
        },
        // 時間設定
        timeRanges: {
            discountStart: '18:30',
            discountEnd: '19:30',
            nightEnd: '06:00'
        },
        // 營業時段配置
        businessHours: {
            regular: {
                start: '08:00',
                end: '22:00'
            },
            specialTimeSlots: {
                weekdayEvening: {
                    name: '平日晚間優惠',
                    price: 350,
                    startTime: '18:30',
                    endTime: '19:30',
                    maxStayTime: '06:00',
                    days: [1, 2, 3, 4]
                },
                weekendEvening: {
                    name: '假日晚間優惠',
                    price: 500,
                    startTime: '18:30',
                    endTime: '19:30',
                    maxStayTime: '06:00',
                    days: [5, 6, 0]
                }
            }
        }
    };

    // 註冊到全域系統
    window.HimanSystem.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    
    // 配置管理器
    class ConfigManager {
        constructor() {
            this.settings = { ...DEFAULT_SETTINGS };
            this.loadSavedSettings();
        }
        
        loadSavedSettings() {
            try {
                if (!this.cachedSettings) {
                    this.cachedSettings = localStorage.getItem('system_settings');
                }
                const saved = this.cachedSettings;
                if (this.isValidJSON(saved)) {
                    this.settings = {
                        ...this.settings,
                        ...JSON.parse(saved)
                    };
                }
            } catch (error) {
                console.error('載入設定時發生錯誤:', error);
            }
        }
        
        get(path) {
            return path.split('.').reduce((obj, key) => 
                obj ? obj[key] : undefined, this.settings);
        }
        
        set(path, value) {
            try {
                const parts = path.split('.');
                let current = this.settings;
                const lastPart = parts.pop();
                
                for (const part of parts) {
                    current = current[part] = current[part] || {};
                }
                current[lastPart] = value;
                
                localStorage.setItem('system_settings', JSON.stringify(this.settings));
            } catch (error) {
                console.error('儲存設定時發生錯誤:', error);
            }
        }
    }

    // 註冊模組
    if (window.HimanSystem?.ModuleManager) {
        window.HimanSystem.ModuleManager.register('config', ConfigManager);
    } else {
        console.error('模組管理器未初始化');
    }
})();

// 系統配置管理核心
const SYSTEM_CONFIG = {
    // 系統版本與識別
    version: '1.0.0',
    buildNumber: '20241227',
    environment: 'production',

    // 營業時段精密配置
    businessHours: {
        regular: {
            start: '08:00',
            end: '22:00'
        },
        // 優惠時段的靈動配置
        specialTimeSlots: {
            weekdayEvening: {
                name: '平日晚間優惠',
                price: 350,
                startTime: '18:30',
                endTime: '19:30',
                maxStayTime: '06:00', // 隔天早上6點
                days: [1, 2, 3, 4],  // 週一到週四
                description: '平日晚間優惠時段 (限制使用至隔日6點)'
            },
            weekendEvening: {
                name: '假日晚間優惠',
                price: 500,
                startTime: '18:30',
                endTime: '19:30',
                maxStayTime: '06:00', // 隔天早上6點
                days: [5, 6, 0],     // 週五、六、日
                description: '假日晚間優惠時段 (限制使用至隔日6點)'
            }
        }
    },

    // 價格結構設計
    pricing: {
        // 基礎票價方案
        regular: {
            weekday: 500,    // 平日票價
            weekend: 700     // 假日票價（週五、六、日）
        },
        // 靈活的時段優惠
        special: {
            weekdayEvening: 350,  // 平日晚間優惠
            weekendEvening: 500   // 假日晚間優惠
        },
        discounts: {
            sundayTowel: {
                name: '小毛巾之夜',
                price: 350,
                days: [0], // 星期天
                hours: {
                    start: '13:30',
                    end: '15:30',
                    maxStay: '23:00' // 最晚只能待到晚上11點
                },
                overtime: {
                    price: 700,       // 超時費用
                    unit: 'perEntry'  // 每次收費
                },
                preAlert: {
                    minutes: 30,
                    message: '小毛巾之夜優惠即將開始！'
                }
            }
        },
        // 其他費用配置
        additionalCharges: {
            overtime: 0,     // 超時費用（每小時）
            deposit: 0,      // 押金
            minimum: 0       // 最低消費
        },
        notifications: {
            discountPreAlert: 30, // 提前 30 分鐘提醒
            discountAlertMessage: '優惠時段即將開始！'
        }
    },

    // 系統功能開關
    features: {
        enableSpecialDiscount: true,    // 優惠時段功能
        enableTicketSystem: true,       // 票券系統
        enableExpenseTracking: true,    // 支出追蹤
        enableAutoBackup: true          // 自動備份
    },

    // 系統限制與規則
    limits: {
        maxStayHours: 24,          // 最長停留時間
        lockerCount: 300,          // 櫃位總數
        minCharge: 0,              // 最低收費
        maxDiscount: 50,           // 最高折扣（%）
        reservationLimit: 7         // 預約天數限制
    },

    // 系統通知配置
    notifications: {
        enableToast: true,         // 啟用提示訊息
        toastDuration: 3000,       // 提示訊息顯示時間
        enableSound: false,        // 啟用音效
        enableEmailNotification: false  // 啟用郵件通知
    },

    // 資料存儲設定
    storage: {
        prefix: 'himan_',          // 存儲前綴
        enableEncryption: false,   // 啟用加密
        backupInterval: 86400000,  // 備份間隔（毫秒）
        maxBackupCount: 7          // 最大備份數量
    },

    // 介面設定
    ui: {
        theme: 'light',            // 預設主題
        language: 'zh-TW',         // 預設語言
        dateFormat: 'YYYY-MM-DD',  // 日期格式
        timeFormat: 'HH:mm',       // 時間格式
        currency: 'NT$',           // 貨幣符號
        animation: true            // 啟用動畫效果
    },

    // 管理者驗證配置
    adminAuth: {
        username: 'uno917',  // 預設管理員帳號
        password: 'uno1069', // 預設管理員密碼
        sessionTimeout: 3600000  // 登入過期時間（毫秒）
    }
};

// 優雅的時段管理助手
const TimeSlotHelper = {
    // 判斷當前是否處於優惠時段
    isSpecialTimeSlot() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        return (hour === 18 && minute >= 30) || (hour === 19 && minute <= 30);
    },

    // 優雅地判斷是否為週末
    isWeekend() {
        const now = new Date();
        const day = now.getDay();
        return day === 0 || day === 5 || day === 6;  // 週五、六、日視為週末
    },

    // 計算目標結束時間
    calculateEndTime(startTime, isSpecialTime = false) {
        if (isSpecialTime) {
            // 優惠時段使用至隔日6點
            const endTime = new Date(startTime);
            endTime.setDate(endTime.getDate() + 1);
            endTime.setHours(6, 0, 0, 0);
            return endTime;
        }

        // 一般時段24小時制
        return new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    },

    // 計算當前應用價格
    getCurrentPrice() {
        const isSpecial = this.isSpecialTimeSlot();
        const isWeekend = this.isWeekend();

        if (isSpecial) {
            return isWeekend ? 
                SYSTEM_CONFIG.pricing.special.weekendEvening : 
                SYSTEM_CONFIG.pricing.special.weekdayEvening;
        }

        return isWeekend ? 
            SYSTEM_CONFIG.pricing.regular.weekend : 
            SYSTEM_CONFIG.pricing.regular.weekday;
    }
};

// 系統配置管理器
const ConfigManager = {
    // 初始化系統配置
    init() {
        this.loadConfig();
        this.validateConfig();
        console.log('系統配置初始化完成');
    },

    // 載入配置
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem(`${SYSTEM_CONFIG.storage.prefix}config`);
            if (savedConfig) {
                Object.assign(SYSTEM_CONFIG, JSON.parse(savedConfig));
            }
        } catch (error) {
            console.error('載入配置失敗:', error);
        }
    },

    // 保存配置
    saveConfig() {
        try {
            localStorage.setItem(
                `${SYSTEM_CONFIG.storage.prefix}config`,
                JSON.stringify(SYSTEM_CONFIG)
            );
            return true;
        } catch (error) {
            console.error('保存配置失敗:', error);
            return false;
        }
    },

    // 配置驗證
    validateConfig() {
        // 驗證必要參數
        const requiredFields = ['version', 'environment'];
        requiredFields.forEach(field => {
            if (!SYSTEM_CONFIG[field]) {
                throw new Error(`缺少必要配置: ${field}`);
            }
        });
    },

    // 獲取配置項
    get(key) {
        return key.split('.').reduce((obj, k) => obj?.[k], SYSTEM_CONFIG);
    },

    // 更新配置項
    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => obj[k] = obj[k] || {}, SYSTEM_CONFIG);
        target[lastKey] = value;
        return this.saveConfig();
    }
};

// 將配置導出
window.SYSTEM_CONFIG = SYSTEM_CONFIG;
window.TimeSlotHelper = TimeSlotHelper;
window.ConfigManager = ConfigManager;

// 當文檔載入完成時初始化配置
document.addEventListener('DOMContentLoaded', () => {
    ConfigManager.init();
});