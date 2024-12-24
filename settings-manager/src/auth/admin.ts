<div id="admin-settings" class="admin-panel">
    <h2>管理者專用設定區域</h2>
    <form id="adminSettingsForm">
        <div class="form-group">
            <label for="account-management">班別帳號密碼管理</label>
            <input type="text" id="account-management" name="account-management" required>
            <small class="help-text">設定各班別的登入權限</small>
        </div>

        <div class="form-group">
            <label for="petty-cash">零用金設定</label>
            <input type="number" id="petty-cash" name="petty-cash" min="0" step="100" required>
            <small class="help-text">設定每月零用金額度</small>
        </div>

        <div class="form-group">
            <label for="backup-settings">備份設定</label>
            <select id="backup-settings" name="backup-settings" required>
                <option value="">請選擇備份方式</option>
                <option value="auto">自動備份</option>
                <option value="manual">手動備份</option>
                <option value="scheduled">排程備份</option>
            </select>
            <div id="backup-schedule" style="display:none;">
                <input type="time" id="backup-time" name="backup-time">
                <select id="backup-frequency" name="backup-frequency">
                    <option value="daily">每日</option>
                    <option value="weekly">每週</option>
                    <option value="monthly">每月</option>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label for="monthly-report">每月日報表設定</label>
            <textarea id="monthly-report" name="monthly-report" rows="3" required></textarea>
            <small class="help-text">設定月報表格式與輸出方式</small>
        </div>

        <div class="form-actions">
            <button type="submit" class="btn-primary">儲存設定</button>
            <button type="reset" class="btn-secondary">重置</button>
        </div>
    </form>

    <div id="message" class="message" style="display:none;"></div>
</div>

<style>
.admin-panel {
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

.help-text {
    color: #666;
    font-size: 0.875rem;
}

.btn-primary {
    background: #007bff;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    margin-left: 10px;
    cursor: pointer;
}

.message {
    margin-top: 1rem;
    padding: 10px;
    border-radius: 4px;
}

.message.success {
    background: #d4edda;
    color: #155724;
}

.message.error {
    background: #f8d7da;
    color: #721c24;
}
</style>