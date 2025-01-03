class EntryManager extends window.HimanSystem.Module {
    constructor() {
        super();
        this.currentEntries = new Map();
        this.feeStrategies = new Map();
    }

    async moduleSetup() {
        this.storage = this.getModule('storage');
        this.toast = this.getModule('toast');
        this.initializeFeeStrategies();
        await this.loadExistingEntries();
    }

    initializeFeeStrategies() {
        this.feeStrategies.set('cash', {
            calculate: (data) => Number(data.amount) || 0,
            validate: (data) => {
                if (!data.amount) throw new Error('現金付款金額為必填');
                if (isNaN(data.amount)) throw new Error('金額必須為數字');
                if (data.amount <= 0) throw new Error('金額必須大於零');
            }
        });

        this.feeStrategies.set('ticket', {
            calculate: () => 0,
            validate: (data) => {
                if (!data.ticketNumber) throw new Error('票券號碼為必填');
                if (!/^\d{6}$/.test(data.ticketNumber)) throw new Error('票券號碼格式錯誤');
            }
        });
    }

    async loadExistingEntries() {
        const entries = await this.storage.getItems(/^entry_/);
        entries.forEach(entry => {
            if (entry.status === 'active') {
                this.currentEntries.set(entry.lockerId, entry);
            }
        });
    }

    async processEntry(data) {
        try {
            await this.validateEntry(data);
            const entry = await this.createEntry(data);
            this.emit('entry:created', { entry });
            return { success: true, entry };
        } catch (error) {
            this.emit('entry:error', { error });
            this.toast.show(error.message, 'error');
            return { success: false, error };
        }
    }

    async validateEntry(data) {
        if (!data.lockerId) throw new Error('櫃位編號為必填');
        if (!data.paymentType) throw new Error('請選擇付款方式');
        
        const strategy = this.feeStrategies.get(data.paymentType);
        if (!strategy) throw new Error('不支援的付款方式');
        
        await strategy.validate(data);
    }

    async createEntry(data) {
        const fee = this.feeStrategies.get(data.paymentType).calculate(data);
        
        const entry = {
            ...data,
            fee,
            entryTime: Date.now(),
            status: 'active',
            id: `entry_${Date.now()}_${data.lockerId}`
        };

        await this.storage.setItem(`entry_${data.lockerId}`, entry);
        this.currentEntries.set(data.lockerId, entry);
        
        return entry;
    }
}

window.HimanSystem.core.registerModule('entryManager', new EntryManager());
