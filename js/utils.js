// 更新時間計算相關函數
function calculateTimeRange(hours, isSpecialTime = false) {
    const now = new Date();
    let endTime;
    
    if (isSpecialTime) {
        // 優惠時段到隔天早上6點
        endTime = new Date(now);
        endTime.setDate(endTime.getDate() + 1);
        endTime.setHours(6, 0, 0, 0);
        hours = Math.floor((endTime - now) / (1000 * 60 * 60));
    } else {
        // 一般時段24小時
        endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    
    return {
        start: now,
        end: endTime,
        hours: hours
    };
}

// 格式化時間顯示
function formatDateTime(date) {
    return new Date(date).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateEndTime(startTime, settings) {
    const now = new Date(startTime);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);  // 設定到隔天早上6點

    const timeSlotKey = checkSpecialTimeSlot(now, settings);
    if (timeSlotKey) {
        // 優惠時段結束時間為隔天早上6點
        return {
            endTime: tomorrow,
            hours: Math.ceil((tomorrow - now) / (1000 * 60 * 60))
        };
    }

    // 一般時段24小時
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);
    return {
        endTime: endTime,
        hours: 24
    };
}

function checkSpecialTimeSlot(date, settings) {
    try {
        const day = date.getDay();
        const time = date.getHours() * 100 + date.getMinutes();
        
        const slots = settings?.timeSlots || defaultSettings.timeSlots;
        
        for (const [key, slot] of Object.entries(slots)) {
            const [startHour, startMin] = slot.startTime.split(':').map(Number);
            const [endHour, endMin] = slot.endTime.split(':').map(Number);
            const startTime = startHour * 100 + startMin;
            const endTime = endHour * 100 + endMin;
            
            if (slot.days.includes(day) && time >= startTime && time <= endTime) {
                return key;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error in checkSpecialTimeSlot:', error);
        return null;
    }
}

// 清除所有緩存
function clearAllCache() {
    try {
        // 清除 localStorage
        localStorage.clear();
        
        // 清除 sessionStorage
        sessionStorage.clear();
        
        // 清除其他可能的快取
        if (window.caches) {
            caches.keys().then(keys => {
                keys.forEach(key => caches.delete(key));
            });
        }
        
        console.log('所有緩存已清除');
        return true;
    } catch (error) {
        console.error('清除緩存時發生錯誤:', error);
        throw new Error('清除緩存失敗');
    }
}

// 全域工具函數命名空間
window.utils = {
    // 格式化日期時間
    formatDateTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 檢查瀏覽器支援
    checkBrowserSupport() {
        const features = {
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            webSocket: !!window.WebSocket
        };
        
        return features;
    },

    // 錯誤處理
    handleError(error, context = '') {
        console.error(`[${context}] Error:`, error);
        if (window.showToast) {
            window.showToast(error.message || '操作失敗', 'error');
        }
    },

    // 防抖函數
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 載入檢查
    checkModuleLoaded(moduleName) {
        return new Promise((resolve) => {
            const check = () => {
                if (window[moduleName]) {
                    resolve(true);
                    return;
                }
                setTimeout(check, 100);
            };
            check();
        });
    }
};

// 確保工具函數已載入
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.utils = true;

window.clearAllCache = clearAllCache;
