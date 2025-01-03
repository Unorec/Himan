(function() {
    'use strict';
    
    class Module {
        constructor() {
            this.initialized = false;
            this.disposed = false;
            this._events = new Map();
        }

        async init() {
            if (this.initialized || this.disposed) return;
            
            try {
                await this.beforeInit();
                await this.moduleSetup();
                await this.afterInit();
                this.initialized = true;
                this.emit('module:initialized');
            } catch (error) {
                this.emit('module:error', error);
                throw error;
            }
        }

        async beforeInit() {
            // 子類別可覆寫
        }

        async moduleSetup() {
            throw new Error('需要實作 moduleSetup 方法');
        }

        async afterInit() {
            // 子類別可覆寫
        }

        on(event, handler) {
            if (!this._events.has(event)) {
                this._events.set(event, new Set());
            }
            this._events.get(event).add(handler);
            return () => this.off(event, handler);
        }

        off(event, handler) {
            const handlers = this._events.get(event);
            if (handlers) {
                handlers.delete(handler);
            }
        }

        emit(event, data) {
            const handlers = this._events.get(event);
            if (handlers) {
                handlers.forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        console.error(`事件處理錯誤 ${event}:`, error);
                    }
                });
            }
        }

        async dispose() {
            if (this.disposed) return;

            try {
                await this.beforeDispose();
                this._events.clear();
                this.initialized = false;
                this.disposed = true;
                this.emit('module:disposed');
            } catch (error) {
                console.error('模組銷毀失敗:', error);
                throw error;
            }
        }

        async beforeDispose() {
            // 子類別可覆寫
        }
    }

    window.HimanSystem.Module = Module;
})();
