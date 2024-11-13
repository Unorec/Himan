class CustomerManager {
    constructor() {
        // 初始化資料
        this.customers = this._loadFromStorage('customers') || [];
        this.lockers = this._loadFromStorage('lockers') || Array(50).fill(null);
        
        // 設定
        this.settings = {
            standardHours: 3,
            overtimeRate: 100,
            warningMinutes: 30
        };
    }

    // 新增客人
    addCustomer(data) {
        // 驗證置物櫃
        if (!this._isValidLocker(data.lockerNumber)) {
            throw new Error('無效的置物櫃號碼');
        }
        
        if (this.isLockerOccupied(data.lockerNumber)) {
            throw new Error('此置物櫃已被使用');
        }

        // 驗證付款資訊
        if (data.paymentType === 'cash') {
            if (!data.cashAmount || isNaN(data.cashAmount) || data.cashAmount <= 0) {
                throw new Error('請輸入有效的現金金額');
            }
        } else {
            if (!data.ticketNumber || !data.ticketNumber.trim()) {
                throw new Error('請輸入票券號碼');
            }
        }

        // 創建新客人資料
        const customer = {
            id: this._generateId(),
            checkInTime: new Date().toISOString(),
            isCheckedOut: false,
            ...data
        };

        // 更新資料
        this.customers.push(customer);
        this.lockers[data.lockerNumber - 1] = customer.id;
        
        // 儲存更新
        this._saveToStorage();

        return customer;
    }

    // 客人結帳
    checkOutCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer || customer.isCheckedOut) {
            throw new Error('找不到該客人或已結帳');
        }

        const checkOutTime = new Date();
        const hours = this._calculateHours(customer.checkInTime, checkOutTime);
        const fees = this._calculateFees(hours, customer);

        // 更新客人資料
        customer.isCheckedOut = true;
        customer.checkOutTime = checkOutTime.toISOString();
        customer.duration = hours;
        customer.overtimeFee = fees.overtimeFee;
        customer.totalAmount = fees.total;

        // 釋放置物櫃
        this.lockers[customer.lockerNumber - 1] = null;

        // 儲存更新
        this._saveToStorage();

        return { customer, hours, fees };
    }

    // 取得在場客人
    getActiveCustomers() {
        return this.customers
            .filter(c => !c.isCheckedOut)
            .map(customer => {
                const hours = this._calculateHours(customer.checkInTime);
                const fees = this._calculateFees(hours, customer);
                const status = this._getCustomerStatus(hours);

                return {
                    ...customer,
                    hours,
                    fees,
                    ...status
                };
            })
            .sort((a, b) => {
                if (a.isOvertime !== b.isOvertime) return b.isOvertime - a.isOvertime;
                if (a.isNearingEnd !== b.isNearingEnd) return b.isNearingEnd - a.isNearingEnd;
                return new Date(a.checkInTime) - new Date(b.checkInTime);
            });
    }

    // 檢查置物櫃狀態
    isLockerOccupied(number) {
        return this.lockers[number - 1] !== null;
    }

    // 取得置物櫃使用者
    getLockerCustomer(number) {
        const customerId = this.lockers[number - 1];
        if (!customerId) return null;
        return this.customers.find(c => c.id === customerId && !c.isCheckedOut);
    }

    // 清理舊資料
    cleanOldData(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        this.customers = this.customers.filter(customer => {
            const checkOutTime = new Date(customer.checkOutTime || customer.checkInTime);
            return checkOutTime > cutoffDate || !customer.isCheckedOut;
        });

        this._saveToStorage();
    }

    // 私有方法
    _loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading ${key} from storage:`, error);
            return null;
        }
    }

    _saveToStorage() {
        try {
            localStorage.setItem('customers', JSON.stringify(this.customers));
            localStorage.setItem('lockers', JSON.stringify(this.lockers));
        } catch (error) {
            console.error('Error saving to storage:', error);
            throw new Error('儲存資料失敗');
        }
    }

    _isValidLocker(number) {
        return number >= 1 && number <= 50;
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    _calculateHours(startTime, endTime = new Date()) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return (end - start) / (1000 * 60 * 60);
    }

    _calculateFees(hours, customer) {
        const overtimeHours = Math.max(0, hours - this.settings.standardHours);
        const overtimeFee = Math.ceil(overtimeHours) * this.settings.overtimeRate;
        const baseAmount = customer.paymentType === 'cash' ? Number(customer.cashAmount) : 0;

        return {
            baseAmount,
            overtimeHours,
            overtimeFee,
            total: baseAmount + overtimeFee
        };
    }

    _getCustomerStatus(hours) {
        const minutesLeft = (this.settings.standardHours * 60) - (hours * 60);
        return {
            isOvertime: hours > this.settings.standardHours,
            isNearingEnd: minutesLeft <= this.settings.warningMinutes && minutesLeft > 0
        };
    }
}
