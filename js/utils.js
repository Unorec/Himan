// 優雅的工具函數集
const utils = {
    // 時間之美的精妙呈現
    datetime: {
        // 格式化日期時間，將時間轉化為優雅的字符串
        formatDateTime(date, format = 'YYYY-MM-DD HH:mm') {
            if (!(date instanceof Date)) {
                date = new Date(date);
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes);
        },

        // 計算時間差的優雅表達
        calculateTimeDifference(startTime, endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const diffInMilliseconds = end - start;
            
            const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
            const minutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return `${hours}小時${minutes}分鐘`;
            }
            return `${minutes}分鐘`;
        },

        // 優雅地判斷是否為特定時段
        isWithinTimeRange(targetTime, startTime, endTime) {
            const target = new Date(targetTime);
            const start = new Date(startTime);
            const end = new Date(endTime);
            return target >= start && target <= end;
        }
    },

    // 數值處理的藝術
    number: {
        // 優雅的金額格式化
        formatCurrency(amount, currency = 'NT$') {
            return `${currency} ${amount.toLocaleString()}`;
        },

        // 百分比的優雅呈現
        formatPercentage(value, decimals = 1) {
            return `${(value * 100).toFixed(decimals)}%`;
        },

        // 數值範圍的優雅限制
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        // 優雅的四捨五入
        roundTo(value, precision = 0) {
            const multiplier = Math.pow(10, precision);
            return Math.round(value * multiplier) / multiplier;
        }
    },

    // 字符串處理的詩意
    string: {
        // 優雅地截斷過長文本
        truncate(str, length = 30, suffix = '...') {
            if (str.length <= length) return str;
            return str.substring(0, length - suffix.length) + suffix;
        },

        // 確保字符串的最小長度
        padString(str, length, char = '0') {
            return String(str).padStart(length, char);
        },

        // 優雅的字符串轉換
        toTitleCase(str) {
            return str.replace(/\b\w/g, char => char.toUpperCase());
        }
    },

    // 陣列處理的精妙藝術
    array: {
        // 優雅地分組陣列元素
        groupBy(array, key) {
            return array.reduce((grouped, item) => {
                const value = typeof key === 'function' ? key(item) : item[key];
                grouped[value] = grouped[value] || [];
                grouped[value].push(item);
                return grouped;
            }, {});
        },

        // 智慧地移除重複元素
        unique(array, key) {
            if (key) {
                const seen = new Set();
                return array.filter(item => {
                    const value = typeof key === 'function' ? key(item) : item[key];
                    if (seen.has(value)) return false;
                    seen.add(value);
                    return true;
                });
            }
            return [...new Set(array)];
        },

        // 優雅地打亂陣列
        shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
    },

    // 表單處理的優雅藝術
    form: {
        // 優雅的表單數據序列化
        serializeForm(form) {
            const formData = new FormData(form);
            const serialized = {};
            
            for (let [key, value] of formData.entries()) {
                if (serialized[key]) {
                    if (!Array.isArray(serialized[key])) {
                        serialized[key] = [serialized[key]];
                    }
                    serialized[key].push(value);
                } else {
                    serialized[key] = value;
                }
            }
            
            return serialized;
        },

        // 智慧的表單驗證
        validateForm(form, rules) {
            const errors = {};
            const formData = this.serializeForm(form);
            
            for (let [field, rule] of Object.entries(rules)) {
                const value = formData[field];
                
                if (rule.required && !value) {
                    errors[field] = '此欄位為必填';
                } else if (rule.pattern && !rule.pattern.test(value)) {
                    errors[field] = rule.message || '格式不正確';
                } else if (rule.minLength && value.length < rule.minLength) {
                    errors[field] = `最少需要 ${rule.minLength} 個字元`;
                }
            }
            
            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        }
    },

    // 介面互動的優雅設計
    ui: {
        // 優雅的提示訊息
        showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        // 優雅的載入動畫
        showLoading(show = true) {
            const loaderId = 'global-loader';
            let loader = document.getElementById(loaderId);
            
            if (show && !loader) {
                loader = document.createElement('div');
                loader.id = loaderId;
                loader.className = 'loading-overlay';
                loader.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                `;
                document.body.appendChild(loader);
            } else if (!show && loader) {
                loader.classList.add('fade-out');
                setTimeout(() => loader.remove(), 300);
            }
        },

        // 優雅的動畫效果
        animate(element, properties, duration = 300) {
            element.style.transition = `all ${duration}ms ease-in-out`;
            Object.assign(element.style, properties);
            
            return new Promise(resolve => {
                setTimeout(resolve, duration);
            });
        }
    },

    // 調試工具的精妙設計
    debug: {
        // 優雅的日誌記錄
        log(message, type = 'info', data = null) {
            const timestamp = new Date().toISOString();
            const prefix = `[${type.toUpperCase()}] ${timestamp}:`;
            
            console.log(prefix, message);
            if (data) {
                console.log('相關數據:', data);
            }
        },

        // 性能測量的藝術
        measureTime(fn, label = '執行時間') {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            
            console.log(`${label}: ${(end - start).toFixed(2)}ms`);
            return result;
        }
    }
};

// 改進的保護陣列長度函數
function protectArrayLength(array) {
    try {
        // 創建一個代理來處理所有可能修改長度的操作
        return new Proxy(array, {
            set(target, prop, value) {
                // 阻止直接修改 length
                if (prop === 'length') {
                    console.warn('無法直接修改陣列長度');
                    return true;
                }
                // 允許其他屬性的修改
                return Reflect.set(target, prop, value);
            },
            
            // 攔截方法調用
            get(target, prop) {
                const value = target[prop];
                
                // 特別處理可能改變長度的方法
                if (typeof value === 'function') {
                    return function(...args) {
                        if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(prop)) {
                            console.warn(`陣列長度已被保護，${prop} 操作被阻止`);
                            return target;
                        }
                        return value.apply(target, args);
                    };
                }
                
                return value;
            }
        });
    } catch (error) {
        console.error('保護陣列長度時發生錯誤:', error);
        return array;
    }
}

// 使用範例：
// const protectedArray = protectArrayLength([1, 2, 3]);
// protectedArray.length = 0; // 這將不會改變陣列長度

// 將工具函數導出到全域
window.utils = utils;

// 當模組載入完成時，標記狀態
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.utils = true;