// 票卷管理模組
window.ticketsModule = {
    initialized: false,

    async init() {
        try {
            // 等待 storageManager 完成初始化
            if (!window.storageManager?.isInitialized) {
                console.log('等待 StorageManager 初始化...');
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (window.storageManager?.isInitialized) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }

            // 確保 storageManager 和必要方法存在
            if (!window.storageManager?.getTickets) {
                throw new Error('StorageManager 票券功能未正確初始化');
            }
            
            // 綁定事件處理
            const addTicketBtn = document.getElementById('addTicketBtn');
            if (addTicketBtn) {
                addTicketBtn.addEventListener('click', () => this.showAddTicketModal());
            }

            this.initialized = true;
            await this.renderTickets(); // 初始化時就渲染票券列表
            return true;
        } catch (error) {
            console.error('票券模組初始化失敗:', error);
            if (window.showToast) {
                window.showToast('票券模組載入失敗: ' + error.message, 'error');
            }
            return false;
        }
    },

    // 顯示統計信息
    renderTickets() {
        const tickets = window.storageManager?.getTickets() || [];
        const ticketsList = document.querySelector('.tickets-list');
        
        if (!ticketsList) return;

        const totalCount = tickets.length;
        const usedCount = tickets.filter(t => t.status === 'used').length;
        const returnedCount = tickets.filter(t => t.status === 'returned').length;
        const unusedCount = totalCount - usedCount - returnedCount;

        ticketsList.innerHTML = `
            <div class="tickets-summary">
                <div>已發出票券：${totalCount} 張</div>
                <div>已使用票券：${usedCount} 張</div>
                <div>已退票張數：${returnedCount} 張</div>
                <div>未使用票券：${unusedCount} 張</div>
                <button id="refundTicketBtn" class="refund-button">退款</button>
            </div>
        `;

        document.getElementById('refundTicketBtn').addEventListener('click', this.showRefundTicketModal.bind(this));
    },

    // 修改票券類型定義
    ticketTypes: {
        hi: {
            name: 'HI平日卷',
            prefix: 'HI',
            price: 200
        },
        man: {
            name: 'MAN暢遊卷',
            prefix: 'MAN',
            price: 250
        },
        fun: {
            name: '優惠卷',
            prefix: 'FUN',
            price: 180
        }
    },

    // 修改新增票本視窗
    showAddTicketModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>登記售出票本</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addTicketForm">
                    <div class="form-group">
                        <label for="ticketType">票券類型 <span class="required">*</span></label>
                        <select id="ticketType" class="form-control" required onchange="ticketsModule.calculateTicketNumbers()">
                            ${Object.entries(this.ticketTypes).map(([key, type]) => 
                                `<option value="${key}" data-prefix="${type.prefix}" data-price="${type.price}">
                                    ${type.name} (${type.price}元)
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startNumber">起始號碼 <span class="required">*</span></label>
                        <input type="text" id="startNumber" class="form-control" 
                               placeholder="請輸入數字"
                               onchange="ticketsModule.calculateTicketNumbers()">
                        <small class="form-text">將自動加上票券類型前綴</small>
                    </div>
                    <div class="form-group">
                        <label for="endNumber">結束號碼</label>
                        <input type="text" id="endNumber" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label for="quantity">本數 <span class="required">*</span></label>
                        <input type="number" id="quantity" class="form-control" 
                               min="1" max="10" value="1"
                               onchange="ticketsModule.calculateTicketNumbers()">
                    </div>
                    <div class="form-group">
                        <label for="unitPrice">單價</label>
                        <input type="number" id="unitPrice" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label for="totalAmount">總金額</label>
                        <input type="number" id="totalAmount" class="form-control" readonly>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-button">確認售出</button>
                        <button type="button" class="secondary-button" onclick="closeModal()">取消</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        
        document.getElementById('addTicketForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addTicket();
        });

        // 初始化計算
        this.calculateTicketNumbers();
    },

    // 計算票號和金額
    calculateTicketNumbers() {
        const typeSelect = document.getElementById('ticketType');
        const startInput = document.getElementById('startNumber');
        const endInput = document.getElementById('endNumber');
        const quantityInput = document.getElementById('quantity');
        const unitPriceInput = document.getElementById('unitPrice');
        const totalAmountInput = document.getElementById('totalAmount');

        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        const prefix = selectedOption.getAttribute('data-prefix');
        const price = parseInt(selectedOption.getAttribute('data-price'));
        const quantity = parseInt(quantityInput.value) || 0;
        const startNum = startInput.value;

        if (startNum && /^\d+$/.test(startNum)) { // 修改驗證規則，只要求為數字
            const start = parseInt(startNum);
            const end = start + (quantity * 10) - 1;
            endInput.value = end.toString();
            
            unitPriceInput.value = price;
            totalAmountInput.value = price * quantity * 10;
        }
    },

    // 登記售出票券
    async addTicket() {
        try {
            const type = document.getElementById('ticketType').value;
            const startNumber = document.getElementById('startNumber').value;
            const quantity = parseInt(document.getElementById('quantity').value);
            const ticketType = this.ticketTypes[type];
            
            if(!/^\d+$/.test(startNumber)) { // 修改驗證規則，只要求為數字
                throw new Error('起始號碼必須為數字');
            }

            // 生成票券記錄
            const tickets = [];
            const startNum = parseInt(startNumber);
            
            for (let i = 0; i < quantity * 10; i++) {
                const currentNumber = (startNum + i).toString();
                tickets.push({
                    id: `ticket_${Date.now()}_${i}`,
                    type: type,
                    number: `${ticketType.prefix}${currentNumber}`,
                    price: ticketType.price,
                    status: 'active',
                    createdAt: new Date().toISOString()
                });
            }

            // 儲存到本地
            await Promise.all(tickets.map(ticket => 
                window.storageManager?.addTicket(ticket)
            ));

            // 輸出到文字檔
            this.exportToFile(tickets);
            
            closeModal();
            showToast(`成功登記 ${quantity} 本票券`);
            this.renderTickets();
        } catch (error) {
            console.error('登記失敗:', error);
            showToast(error.message || '登記失敗', 'error');
        }
    },

    // 修改輸出格式
    exportToFile(tickets) {
        const content = tickets.map(t => {
            const basicInfo = `${t.number},${t.type},${t.price},${t.createdAt},${t.status}`;
            const returnInfo = t.status === 'returned' ? 
                `,${t.returnReason},${t.returnAmount},${t.returnDate}` : '';
            return basicInfo + returnInfo;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `tickets_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
    },

    // 查詢票券
    async findTicket(number) {
        const tickets = await window.storageManager?.getTickets() || [];
        return tickets.find(t => t.number === number);
    },

    // 更新票券狀態
    async updateTicketStatus(number, status, returnInfo = {}) {
        const ticket = await this.findTicket(number);
        if (ticket) {
            ticket.status = status;
            ticket.usedAt = status === 'used' ? new Date().toISOString() : null;
            if (status === 'returned' || status === 'refunded') {
                ticket.returnReason = returnInfo.returnReason;
                ticket.returnNote = returnInfo.returnNote;
                ticket.returnAmount = returnInfo.returnAmount;
                ticket.returnDate = returnInfo.returnDate;
            }
            await window.storageManager?.updateTicket(ticket.id, ticket);
            this.renderTickets();
        }
    },

// 新增退款登記視窗
    showRefundTicketModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>登記退款</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="refundTicketForm">
                    <div class="form-group">
                        <label for="ticketType">票券類型 <span class="required">*</span></label>
                        <select id="ticketType" class="form-control" required onchange="ticketsModule.calculateRefundTicketNumbers()">
                            ${Object.entries(this.ticketTypes).map(([key, type]) => 
                                `<option value="${key}" data-prefix="${type.prefix}" data-price="${type.price}">
                                    ${type.name} (${type.price}元)
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="startNumber">起始號碼 <span class="required">*</span></label>
                        <input type="text" id="startNumber" class="form-control" 
                               placeholder="請輸入數字"
                               onchange="ticketsModule.calculateRefundTicketNumbers()">
                        <small class="form-text">將自動加上票券類型前綴</small>
                    </div>
                    <div class="form-group">
                        <label for="endNumber">結束號碼</label>
                        <input type="text" id="endNumber" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label for="refundReason">退款原因 <span class="required">*</span></label>
                        <select id="refundReason" class="form-control" required>
                            <option value="">請選擇退款原因</option>
                            <option value="customer_request">客戶要求</option>
                            <option value="ticket_damage">票券損壞</option>
                            <option value="print_error">印刷錯誤</option>
                            <option value="other">其他原因</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="refundNote">備註</label>
                        <textarea id="refundNote" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="refundAmount">退款金額</label>
                        <input type="number" id="refundAmount" class="form-control" readonly>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-button">確認退款</button>
                        <button type="button" class="secondary-button" onclick="closeModal()">取消</button>
                    </div>
                </form>
            </div>
        `;

        showModal(modalContent);

        document.getElementById('refundTicketForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processRefundTicket();
        });

        document.getElementById('startNumber').addEventListener('blur', this.calculateRefundTicketNumbers.bind(this));
        document.getElementById('ticketType').addEventListener('change', this.calculateRefundTicketNumbers.bind(this));
    },

    // 計算退款票號和金額
    calculateRefundTicketNumbers() {
        const typeSelect = document.getElementById('ticketType');
        const startInput = document.getElementById('startNumber');
        const endInput = document.getElementById('endNumber');
        const refundAmountInput = document.getElementById('refundAmount');

        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        const prefix = selectedOption.getAttribute('data-prefix');
        const price = parseInt(selectedOption.getAttribute('data-price'));
        const startNum = startInput.value;

        if (startNum && /^\d+$/.test(startNum)) {
            const start = parseInt(startNum);
            const end = start + 9; // Assuming 10 tickets per book
            endInput.value = end.toString();
            
            refundAmountInput.value = price * 10; // Assuming 10 tickets per book
        }
    },

    // 處理退款邏輯
    async processRefundTicket() {
        try {
            const ticketType = document.getElementById('ticketType').value;
            const startNumber = document.getElementById('startNumber').value;
            const endNumber = document.getElementById('endNumber').value;
            const refundReason = document.getElementById('refundReason').value;
            const refundNote = document.getElementById('refundNote').value;
            const refundAmount = document.getElementById('refundAmount').value;

            // 需要根據起始號碼和結束號碼查找對應的票券進行退款處理

            // 示例：假設只處理起始號碼的票券
            const ticket = await this.findTicket(startNumber);
            
            if (!ticket) {
                throw new Error('找不到此票券');
            }
            
            if (ticket.status === 'used') {
                throw new Error('已使用的票券無法退款');
            }
            
            if (ticket.status === 'returned' || ticket.status === 'refunded') {
                throw new Error('此票券已經退票或退款');
            }

            // 更新票券狀態
            await this.updateTicketStatus(startNumber, 'refunded', {
                refundReason,
                refundNote,
                refundAmount: parseFloat(refundAmount),
                refundDate: new Date().toISOString()
            });

            closeModal();
            showToast('退款登記完成');
            this.renderTickets();
            
        } catch (error) {
            console.error('退款處理失敗:', error);
            showToast(error.message || '退款處理失敗', 'error');
        }
    }
}; // Close ticketsModule object

// 確保在 DOM 載入完成且 storageManager 已初始化後再初始化票券模組
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.ticketsModule.init();
    } catch (error) {
        console.error('票券模組初始化失敗:', error);
    }
});