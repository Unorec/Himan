// 使用 IIFE 避免重複宣告
(function() {
    // 如果已經存在 TicketManager 實例，就不再重新定義
    if (window.ticketManager) return;

    // 票券管理系統的優雅實現
    class TicketManager {
        constructor() {
            this.tickets = new Map();
            this.currentBatch = 1;
            this.bindEvents();
        }

        // 初始化事件綁定
        bindEvents() {
            const form = document.getElementById('ticketForm');
            form?.addEventListener('submit', (e) => this.handleGenerate(e));

            // 售出模態框事件
            document.querySelectorAll('[data-action="sale"]').forEach(btn => {
                btn.addEventListener('click', (e) => this.showSaleModal(e));
            });

            // 關閉模態框
            document.querySelector('.modal .close-btn')?.addEventListener('click', 
                () => this.closeSaleModal());
        }

        // 生成票券序號的藝術
        generateTicketNumbers(startNumber, type, count) {
            const tickets = [];
            const baseNumber = parseInt(startNumber);
            
            if (isNaN(baseNumber)) return tickets;

            for (let i = 0; i < count; i++) {
                const number = baseNumber + i;
                tickets.push({
                    number: `${type}${number.toString().padStart(6, '0')}`,
                    type: type === 'H' ? '平日券' : '暢遊券',
                    price: parseInt(document.getElementById('price').value) || 0,
                    status: 'active',
                    createdAt: new Date().toISOString()
                });
            }

            return tickets;
        }

        // 處理批次生成
        async handleGenerate(e) {
            e.preventDefault();

            const type = document.getElementById('ticketType').value;
            const startNumber = document.getElementById('startNumber').value;
            const batchSize = parseInt(document.getElementById('batchSize').value);
            const remark = document.getElementById('remark').value;

            if (!this.validateInput(startNumber)) {
                this.showNotification('請輸入有效的起始號碼', 'error');
                return;
            }

            try {
                const tickets = this.generateTicketNumbers(startNumber, type, batchSize * 10);
                await this.saveBatch(tickets, this.currentBatch, remark);
                this.renderTickets();
                this.showNotification('票券批次生成成功', 'success');
                this.currentBatch++;
            } catch (error) {
                this.showNotification('票券生成失敗', 'error');
                console.error('票券生成錯誤:', error);
            }
        }

        // 輸入驗證的優雅實現
        validateInput(startNumber) {
            return /^\d+$/.test(startNumber);
        }

        // 儲存批次的精緻處理
        async saveBatch(tickets, batchNumber, remark) {
            tickets.forEach(ticket => {
                ticket.batch = batchNumber;
                ticket.remark = remark;
                this.tickets.set(ticket.number, ticket);
            });

            // 這裡可以添加與後端API的互動
            return Promise.resolve();
        }

        // 票券展示的視覺呈現
        renderTickets() {
            const container = document.getElementById('ticketList');
            if (!container) return;

            const batchedTickets = this.groupTicketsByBatch();
            
            container.innerHTML = Array.from(batchedTickets.entries())
                .map(([batch, tickets]) => this.renderBatch(batch, tickets))
                .join('');

            // 重新綁定售出按鈕事件
            this.bindSaleButtons();
        }

        // 批次分組的智能實現
        groupTicketsByBatch() {
            const batches = new Map();
            
            for (const ticket of this.tickets.values()) {
                if (!batches.has(ticket.batch)) {
                    batches.set(ticket.batch, []);
                }
                batches.get(ticket.batch).push(ticket);
            }
            
            return batches;
        }

        // 批次渲染的藝術呈現
        renderBatch(batch, tickets) {
            const isSold = tickets[0].status === 'sold';
            
            return `
                <div class="ticket-batch">
                    <div class="batch-header">
                        <h4>第 ${batch} 本</h4>
                        ${!isSold ? `
                            <button class="btn btn-primary" data-action="sale" data-batch="${batch}">
                                登記售出
                            </button>
                        ` : ''}
                    </div>
                    <div class="tickets-grid">
                        ${tickets.map(ticket => this.renderTicket(ticket)).join('')}
                    </div>
                </div>
            `;
        }

        // 單張票券渲染
        renderTicket(ticket) {
            return `
                <div class="ticket-card ${ticket.status === 'sold' ? 'sold' : ''}">
                    <div class="ticket-number">${ticket.number}</div>
                    <div class="ticket-type">${ticket.type}</div>
                    <div class="ticket-price">NT$ ${ticket.price}</div>
                    <div class="ticket-status">${ticket.status === 'sold' ? '已售出' : '可使用'}</div>
                </div>
            `;
        }

        // 顯示售出模態框
        showSaleModal(e) {
            const batch = e.target.dataset.batch;
            const modal = document.getElementById('saleModal');
            modal.dataset.batch = batch;
            modal.classList.add('active');
        }

        // 關閉售出模態框
        closeSaleModal() {
            const modal = document.getElementById('saleModal');
            modal.classList.remove('active');
        }

        // 顯示通知訊息
        showNotification(message, type) {
            // 可以實現更精美的通知效果
            alert(message);
        }

        // 綁定售出按鈕事件
        bindSaleButtons() {
            document.querySelectorAll('[data-action="sale"]').forEach(btn => {
                btn.addEventListener('click', (e) => this.showSaleModal(e));
            });
        }
    }

    // 建立全域實例
    window.ticketManager = new TicketManager();
})();