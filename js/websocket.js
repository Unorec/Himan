class WebSocketManager {
    constructor(config) {
        this.config = {
            url: config.url,
            reconnectInterval: config.reconnectInterval || 3000,
            maxReconnectAttempts: config.maxReconnectAttempts || 5,
            heartbeatInterval: config.heartbeatInterval || 30000
        };
        this.ws = null;
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.handlers = new Map();
        this.connectionState = 'disconnected';
    }

    connect() {
        try {
            this.ws = new WebSocket(this.config.url);
            this.setupEventHandlers();
            this.startHeartbeat();
            return true;
        } catch (error) {
            console.error('WebSocket 連線失敗:', error);
            return false;
        }
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            this.connectionState = 'connected';
            this.reconnectAttempts = 0;
            this.emit('connectionStateChange', { state: 'connected' });
            console.log('WebSocket 已連線');
        };

        this.ws.onclose = () => {
            this.connectionState = 'disconnected';
            this.emit('connectionStateChange', { state: 'disconnected' });
            this.stopHeartbeat();
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            this.emit('error', error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('訊息解析錯誤:', error);
            }
        };
    }

    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                this.send('heartbeat', { timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`嘗試重新連線... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.config.reconnectInterval);
        }
    }

    send(type, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }

    on(type, handler) {
        this.handlers.set(type, handler);
    }

    handleMessage(message) {
        const handler = this.handlers.get(message.type);
        if (handler) {
            handler(message.data);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    isConnected() {
        return this.connectionState === 'connected';
    }

    emit(event, data) {
        const handler = this.handlers.get(event);
        if (handler) {
            handler(data);
        }
    }
}

// 修改為瀏覽器環境配置
const WS_CONFIG = {
    development: {
        url: window.location.protocol === 'https:' ? 
            `wss://${window.location.hostname}:${window.location.port}` : 
            `ws://${window.location.hostname}:${window.location.port}`,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000
    },
    production: {
        url: window.location.protocol === 'https:' ? 
            `wss://${window.location.hostname}:${window.location.port}` : 
            `ws://${window.location.hostname}:${window.location.port}`,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 45000
    }
};

// 初始化全域 WebSocket 管理器
window.wsManager = new WebSocketManager(
    WS_CONFIG[window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'development' 
        : 'production']
);

// 確保在 DOM 載入後才連接 WebSocket
document.addEventListener('DOMContentLoaded', () => {
    if (window.wsManager) {
        window.wsManager.connect();
    }
});
