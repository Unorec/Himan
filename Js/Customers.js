class CustomerManager {
    constructor() {
        this.customers = Storage.get('customers') || [];
        this.lockers = Storage.get('lockers') || Array(50).fill(null);
    }

    // 新增客人
    addCustomer(data) {
        // 驗證置物櫃
        if (this.lockers[data.lockerNumber - 1] !== null) {
            throw new Error('此置物櫃已被使用');
        }

        const customer = {
            id: generateId(),
            checkInTime: new Date().toISOString(),
            isCheckedOut: false,
            ...data
        };

        this.customers.push(customer);
        this.lockers[data.lockerNumber - 1] = customer.id;
        this._saveData();

        return customer;
    }

    // 客人結帳
    checkOutCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer || customer.isCheckedOut) {
            throw new Error('找不到該客人或已結帳');
        }

        const hours = calculateHours(customer.checkInTime);
        const fees = calculateFees(hours, customer.paymentType === 'cash' ? customer.cashAmount : 0);

        customer.isCheckedOut = true;
        customer.checkOutTime = new Date().toISOString();
        customer.overtimeFee = fees.overtimeFee;
        customer.totalAmount = fees.total;

        this.lockers[customer.lockerNumber - 1] = null;
        this._saveData();

        return {
            customer,
            hours,
            fees
        };
    }

    // 取得在場客人列表
    getActiveCustomers() {
        return this.customers
            .filter(c => !c.isCheckedOut)
            .map(customer => {
                const hours = calculateHours(customer.checkInTime);
                const fees = calculateFees(hours, customer.paymentType === 'cash' ? customer.cashAmount : 0);
                return {
                    ...customer,
                    hours,
                    fees,
                    isOvertime: hours > 3,
                    isNearingEnd: hours > 2.5 && hours <= 3
                };
            })
            .sort((a, b) => {
                // 超時的排前面
                if (a.isOvertime !== b.isOvertime) return b.isOvertime - a.isOvertime;
                // 其次是即將超時的
                if (a.isNearingEnd !== b.isNearingEnd) return b.isNearingEnd - a.isNearingEnd;
                // 最後依入場時間排序
                return new Date(a.checkInTime) - new Date(b.checkInTime);
            });
    }

    // 檢查置物櫃是否可用
    isLockerAvailable(number) {
        return this.lockers[number - 1] === null;
    }

    // 清理舊資料（可選）
    cleanOldData(days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        this.customers = this.customers.filter(customer => {
            const checkOutTime = new Date(customer.checkOutTime || customer.checkInTime);
            return checkOutTime > cutoff;
        });
        
        this._saveData();
    }

    // 儲存資料
    _saveData() {
        Storage.set('customers', this.customers);
        Storage.set('lockers', this.lockers);
    }
}
