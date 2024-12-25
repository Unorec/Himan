// 設定模組
window.settingsModule = {
    initialized: false,
    version: '1.0.0',
    
    async init() {
        try {
            // 檢查儲存系統
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }
            
            await this.migrateSettings();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Settings initialization error:', error);
            return false;
        }
    },

    async migrateSettings() {
        const settings = this.getSettings();
        if (!settings.version || settings.version !== this.version) {
            const updatedSettings = { ...window.defaultSettings, ...settings, version: this.version };
            await this.saveSettings(updatedSettings);
        }
    },

    getSettings() {
        const settings = window.storageManager?.getSettings() || window.defaultSettings;
        return this.validateSettings(settings) ? settings : window.defaultSettings;
    },

    validateSettings(settings) {
        if (!settings || typeof settings !== 'object') return false;
        // 在此加入更多驗證邏輯
        return true;
    },

    async saveSettings(settings) {
        try {
            if (!this.validateSettings(settings)) {
                throw new Error('無效的設定格式');
            }
            
            const timestamp = new Date().toISOString();
            const settingsWithMeta = {
                ...settings,
                lastModified: timestamp,
                version: this.version
            };
            
            return await window.storageManager?.saveSettings(settingsWithMeta);
        } catch (error) {
            console.error('儲存設定錯誤:', error);
            return false;
        }
    },

    async resetToDefault() {
        try {
            return await this.saveSettings(window.defaultSettings);
        } catch (error) {
            console.error('重置設定錯誤:', error);
            return false;
        }
    },

    RECORD_STATUS,
    PAYMENT_TYPES,
    TICKET_TYPES,
    
    // 檢查記錄狀態的輔助函數
    getRecordStatus(record) {
        if (!record) return RECORD_STATUS.COMPLETED;
        
        // 檢查是否已結束
        if (record.status === 'completed') return RECORD_STATUS.COMPLETED;
        
        // 檢查是否暫時外出
        if (record.status === 'temporary') return RECORD_STATUS.TEMPORARY_EXIT;
        
        // 檢查是否有未結消費
        if (record.unpaidCharges?.length > 0) return RECORD_STATUS.UNPAID;
        
        // 檢查是否超時或即將超時
        const now = new Date();
        const entryTime = new Date(record.entryTime);
        const endTime = new Date(entryTime.getTime() + record.hours * 60 * 60 * 1000);
        const timeDiff = endTime - now;
        
        if (timeDiff < 0) {
            return RECORD_STATUS.OVERTIME;
        }
        
        // 剩餘30分鐘內
        if (timeDiff <= 30 * 60 * 1000) {
            return RECORD_STATUS.NEAR_EXPIRY;
        }
        
        // 剩餘1小時內
        if (timeDiff <= 60 * 60 * 1000) {
            return RECORD_STATUS.WARNING;
        }
        
        return RECORD_STATUS.ACTIVE;
    },

    // 新增取得當前可用優惠時段函數
    getCurrentTimeSlot() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const settings = this.getSettings();
        for (const [key, slot] of Object.entries(settings.timeSlots)) {
            // 檢查是否為該時段的適用日
            if (!slot.days.includes(currentDay)) continue;

            // 解析時間
            const [startHour, startMin] = slot.startTime.split(':').map(Number);
            const [endHour, endMin] = slot.endTime.split(':').map(Number);
            const slotStartTime = startHour * 100 + startMin;
            const slotEndTime = endHour * 100 + endMin;

            // 檢查是否在時間範圍內
            if (currentTime >= slotStartTime && currentTime <= slotEndTime) {
                return {
                    key,
                    ...slot
                };
            }
        }
        return null;
    },

    // 計算優惠時段結束時間
    calculateTimeSlotEndTime(timeSlot) {
        const now = new Date();
        const endTime = new Date(now);
        
        // 解析 maxStayTime
        const [hours, minutes] = timeSlot.maxStayTime.split(':').map(Number);
        
        if (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())) {
            // 如果結束時間在隔天
            endTime.setDate(endTime.getDate() + 1);
        }
        
        endTime.setHours(hours, minutes, 0, 0);
        
        return endTime;
    },

    // 新增管理者權限檢查
    validateAdmin(username, password) {
        return username === ADMIN_CREDENTIALS.username && 
               password === ADMIN_CREDENTIALS.password;
    },

    // 判斷是否為管理者專用設定
    isAdminSetting(key) {
        const adminOnlySettings = [
            'shifts',
            'cashierFloat',
            'backup',
            'monthlyReport'
        ];
        return adminOnlySettings.includes(key);
    },

    // 覆寫 updateSetting 方法，加入權限檢查
    async updateSetting(key, value, credentials) {
        if (this.isAdminSetting(key)) {
            if (!credentials || !this.validateAdmin(credentials.username, credentials.password)) {
                throw new Error('需要管理者權限');
            }
        }

        try {
            const currentSettings = this.getSettings();
            currentSettings[key] = value;
            return await this.saveSettings(currentSettings);
        } catch (error) {
            console.error('更新設定失敗:', error);
            throw error;
        }
    },

    // 新增管理者登入函數
    async adminLogin(username, password) {
        if (this.validateAdmin(username, password)) {
            const adminSettings = document.querySelector('.admin-only');
            if (adminSettings) {
                adminSettings.style.display = 'block';
            }
            return true;
        }
        throw new Error('管理者驗證失敗');
    },

    // 新增管理者登出函數
    adminLogout() {
        const adminSettings = document.querySelector('.admin-only');
        if (adminSettings) {
            adminSettings.style.display = 'none';
        }
    },

    // 修改管理者設定區域初始化
    initAdminSettings() {
        const settingsSection = document.getElementById('settingsSection');
        if (!settingsSection) return;

        // 新增管理者專用區域
        const adminAreaHtml = `
            <div class="admin-area">
                <h3>管理者專用設定</h3>
                
                <!-- 班別設定 -->
                <div class="settings-group">
                    <h4>班別帳號設定</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label>早班帳號</label>
                            <input type="text" name="morningUsername">
                        </div>
                        <div class="form-group">
                            <label>晚班帳號</label>
                            <input type="text" name="eveningUsername">
                        </div>
                    </div>
                </div>

                <!-- 零用金設定 -->
                <div class="settings-group">
                    <h4>零用金設定</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label>零用金金額</label>
                            <input type="number" name="cashierFloat" min="0">
                        </div>
                    </div>
                </div>

                <!-- 備份設定 -->
                <div class="settings-group">
                    <h4>系統備份設定</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label>備份頻率</label>
                            <select name="backupFrequency">
                                <option value="daily">每日</option>
                                <option value="weekly">每週</option>
                                <option value="monthly">每月</option>
                            </select>
                        </div>
                    </div>
                    <div class="backup-status"></div>
                    <button type="button" id="manualBackupBtn" class="secondary-button">
                        立即備份
                    </button>
                </div>
            </div>
        `;

        settingsSection.querySelector('.card-body').insertAdjacentHTML('beforeend', adminAreaHtml);
        
        // 重新綁定事件
        this.bindAdminEvents();
    },

    // 載入管理者設定值
    async loadAdminSettings() {
        const settings = this.getSettings();
        
        // 設定班別帳號
        if (settings.shifts) {
            Object.entries(settings.shifts).forEach(([shift, data]) => {
                const usernameInput = document.querySelector(`[name="${shift}Username"]`);
                if (usernameInput) usernameInput.value = data.username || '';
            });
        }
        
        // 設定零用金
        const cashierInput = document.querySelector('[name="cashierFloat"]');
        if (cashierInput) {
            cashierInput.value = settings.cashierFloat?.amount || 3000;
        }
        
        // 設定備份頻率
        const backupSelect = document.querySelector('[name="backupFrequency"]');
        if (backupSelect) {
            backupSelect.value = settings.backup?.frequency || 'daily';
        }
        
        // 顯示上次備份時間
        this.updateBackupStatus(settings.backup?.lastBackup);
    },

    // 更新備份狀態顯示
    updateBackupStatus(timestamp) {
        const statusEl = document.querySelector('.backup-status');
        if (!statusEl) return;

        const lastBackup = timestamp ? new Date(timestamp) : null;
        const now = new Date();
        const daysSinceBackup = lastBackup 
            ? Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24)) 
            : null;

        statusEl.innerHTML = `
            <span class="backup-indicator ${daysSinceBackup > 7 ? 'warning' : 'success'}"></span>
            <span>上次備份: ${lastBackup ? lastBackup.toLocaleString() : '從未備份'}</span>
        `;
    },

    // 新增: 重置設定
    async resetSettings() {
        try {
            return await this.saveSettings(window.defaultSettings);
        } catch (error) {
            console.error('Reset settings error:', error);
            return false;
        }
    },

    // 新增: 取得特定設定
    getSetting(key) {
        const settings = this.getSettings();
        return settings?.[key];
    },

    // 修改進入系統設定的方法
    async enterSettings(user) {
        try {
            if (!this.initialized) {
                await this.init();
            }

            // 基本使用者可檢視設定但不能修改
            const isAdmin = user?.role === 'admin';
            
            // 顯示設定介面
            const settingsSection = document.getElementById('settingsSection');
            if (settingsSection) {
                settingsSection.style.display = 'block';
                
                // 控制編輯權限
                const inputs = settingsSection.querySelectorAll('input, select, button');
                inputs.forEach(input => {
                    input.disabled = !isAdmin;
                });
                
                // 隱藏管理者專用區域
                const adminArea = settingsSection.querySelector('.admin-area');
                if (adminArea) {
                    adminArea.style.display = isAdmin ? 'block' : 'none';
                }
            }

            return true;
        } catch (error) {
            console.error('進入設定失敗:', error);
            window.showToast?.('進入設定失敗', 'error');
            return false;
        }
    }
};

// 確保模組載入
window.moduleLoaded = window.moduleLoaded || {};
window.moduleLoaded.settings = true;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', async () => {
    await window.settingsModule.init();
});

// 定義入場記錄狀態
const RECORD_STATUS = {
    ACTIVE: {
        code: 'active',
        name: '使用中',
        className: 'status-active',
        color: '#4caf50'
    },
    TEMPORARY_EXIT: {
        code: 'temporary',
        name: '暫時外出',
        className: 'status-temporary',
        color: '#ff9800'
    },
    WARNING: {           // 新增快超時狀態
        code: 'warning',
        name: '即將超時(1小時)',
        className: 'status-warning',
        color: '#ffc107'
    },
    NEAR_EXPIRY: {
        code: 'nearExpiry',
        name: '即將超時(30分)',
        className: 'status-near-expiry',
        color: '#f44336'
    },
    OVERTIME: {
        code: 'overtime',
        name: '已超時',
        className: 'status-overtime',
        color: '#d32f2f'
    },
    UNPAID: {
        code: 'unpaid',
        name: '未結消費',
        className: 'status-unpaid',
        color: '#e91e63'
    },
    COMPLETED: {
        code: 'completed',
        name: '已結束',
        className: 'status-completed',
        color: '#9e9e9e'
    }
};

// 定義付款類型
const PAYMENT_TYPES = {
    CASH: {
        code: 'cash',
        name: '現金'
    },
    TICKET: {
        code: 'ticket',
        name: '票券'
    },
    CARD: {
        code: 'card',
        name: '刷卡'
    }
};

// 定義票券類型
const TICKET_TYPES = {
    REGULAR: {
        code: 'regular',
        name: '平日券',
        hours: 24
    },
    UNLIMITED: {
        code: 'unlimited',
        name: '暢遊券',
        hours: 24
    },
    EVENT: {
        code: 'event',
        name: '優惠券',
        hours: 24
    }
};

// 將狀態常量掛載到全域
window.RECORD_STATUS = RECORD_STATUS;
window.PAYMENT_TYPES = PAYMENT_TYPES;
window.TICKET_TYPES = TICKET_TYPES;

// 新增管理者認證設定
const ADMIN_CREDENTIALS = {
    username: 'uno917',
    password: 'uno1069'
};

const SettingsManager = {
    defaultSettings: {
        businessHours: {
            open: '10:00',
            close: '23:00'
        },
        specialTimeSlot: {
            start: '18:30',
            end: '19:30',
            discount: 20
        },
        prices: {
            regular: 300,
            student: 250,
            senior: 250
        },
        lockerCount: 100
    },

    // 載入設定
    loadSettings() {
        return JSON.parse(localStorage.getItem('systemSettings')) || this.defaultSettings;
    },

    // 儲存設定
    saveSettings(settings) {
        localStorage.setItem('systemSettings', JSON.stringify(settings));
    },

    // 初始化設定頁面
    initSettingsSection() {
        const settings = this.loadSettings();
        const container = document.getElementById('settingsSection');
        
        // 新增管理者登入區塊
        const adminLoginHtml = `
            <div class="admin-login-area">
                <h3>管理者登入</h3>
                <div class="form-group">
                    <label>管理者帳號</label>
                    <input type="text" name="adminUsername">
                </div>
                <div class="form-group">
                    <label>管理者密碼</label>
                    <input type="password" name="adminPassword">
                </div>
                <button type="button" id="adminLoginBtn" class="primary-button">登入</button>
            </div>
        `;

        container.querySelector('.card-body').insertAdjacentHTML('afterbegin', adminLoginHtml);
        
        // 綁定管理者登入按鈕事件
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', async () => {
                const username = document.querySelector('[name="adminUsername"]').value;
                const password = document.querySelector('[name="adminPassword"]').value;
                
                try {
                    if (this.validateAdmin(username, password)) {
                        document.querySelector('.admin-login-area').style.display = 'none';
                        document.querySelector('.settings-content').style.display = 'block';
                        showToast('管理者登入成功');
                    } else {
                        throw new Error('管理者驗證失敗');
                    }
                } catch (error) {
                    showToast('管理者驗證失敗', 'error');
                }
            });
        }
        
        container.innerHTML += `
            <div class="card">
                <div class="card-header">
                    <h2>系統設定</h2>
                </div>
                <div class="card-body">
                    <form id="settingsForm">
                        <div class="settings-group">
                            <h3>營業時間</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>開始時間</label>
                                    <input type="time" name="openTime" value="${settings.businessHours.open}">
                                </div>
                                <div class="form-group">
                                    <label>結束時間</label>
                                    <input type="time" name="closeTime" value="${settings.businessHours.close}">
                                </div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3>優惠時段設定</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>開始時間</label>
                                    <input type="time" name="specialStart" value="${settings.specialTimeSlot.start}">
                                </div>
                                <div class="form-group">
                                    <label>結束
