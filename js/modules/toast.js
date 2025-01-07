import { Module } from '../core/system.js';
import { config } from '../config.js';

class ToastModule extends Module {
    constructor() {
        super();
        this.container = null;
        this.timeouts = new Set();
    }

    async moduleSetup() {
        this.container = document.getElementById('toast');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast';
            this.container.className = 'toast hidden';
            document.body.appendChild(this.container);
        }
        return true;
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        
        this.container.appendChild(toast);
        this.container.classList.remove('hidden');
        
        const timeout = setTimeout(() => {
            toast.remove();
            this.timeouts.delete(timeout);
            if (this.container.children.length === 0) {
                this.container.classList.add('hidden');
            }
        }, config.toastDuration);
        
        this.timeouts.add(timeout);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    destroy() {
        this.timeouts.forEach(clearTimeout);
        this.timeouts.clear();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// 註冊模組
window.HimanSystem.core.registerModule('toast', new ToastModule());
