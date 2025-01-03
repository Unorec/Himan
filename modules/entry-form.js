class EntryForm extends window.HimanSystem.Module {
    constructor() {
        super();
        this.formData = new Map();
        this.validators = new Map();
        this.eventHandlers = new Map();
    }

    async moduleSetup() {
        this.initializeValidators();
        this.bindEvents();
    }

    initializeValidators() {
        this.validators.set('required', (value) => {
            return value !== null && value !== undefined && value !== '';
        });
        
        this.validators.set('amount', (value) => {
            return !isNaN(value) && parseFloat(value) > 0;
        });
    }

    bindEvents() {
        this.handlePaymentTypeChange = (event) => {
            const type = event.target.value;
            this.formData.set('paymentType', type);
            this.validateField('paymentType', type);
            this.emit('form:fieldChange', { field: 'paymentType', value: type });
        };

        this.handleSubmit = async (event) => {
            event.preventDefault();
            
            try {
                if (await this.validateForm()) {
                    const formData = Object.fromEntries(this.formData);
                    await this.submitForm(formData);
                    this.resetForm();
                    this.emit('form:submitted', { success: true });
                }
            } catch (error) {
                this.emit('form:error', { error });
                throw error;
            }
        };
    }

    async validateForm() {
        const validations = Array.from(this.formData.entries()).map(([field, value]) => {
            return this.validateField(field, value);
        });

        const results = await Promise.all(validations);
        return results.every(valid => valid);
    }

    validateField(field, value) {
        const validator = this.validators.get(field);
        if (!validator) return true;

        const isValid = validator(value);
        this.emit('form:validation', { field, isValid });
        return isValid;
    }

    async submitForm(formData) {
        const entryManager = this.getModule('entryManager');
        await entryManager.createEntry(formData);
    }

    resetForm() {
        this.formData.clear();
        this.emit('form:reset');
    }
}

window.HimanSystem.core.registerModule('entryForm', new EntryForm(), ['entryManager']);
