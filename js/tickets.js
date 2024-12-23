// 票卷管理模組
window.ticketsModule = {
    initialized: false,

    async init() {
        try {
            if (!window.storageManager?.isInitialized) {
                await window.storageManager?.init();
            }
            
            // 綁定事件處理
            const addTicketBtn = document.getElementById('addTicketBtn');
            if (addTicketBtn) {
                addTicketBtn.addEventListener('click', this.showAddTicketModal);
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('初始化失敗:', error);
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
            </div>
        `;
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
            if (status === 'returned') {
                ticket.returnReason = returnInfo.returnReason;
                ticket.returnNote = returnInfo.returnNote;
                ticket.returnAmount = returnInfo.returnAmount;
                ticket.returnDate = returnInfo.returnDate;
            }
            await window.storageManager?.updateTicket(ticket.id, ticket);
            this.renderTickets();
        }
    },

    // 新增退票登記視窗
    showReturnTicketModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>登記退票</h3>
                <button onclick="closeModal()" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="returnTicketForm">
                    <div class="form-group">
                        <label for="ticketNumber">票券號碼 <span class="required">*</span></label>
                        <input type="text" id="ticketNumber" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="returnReason">退票原因 <span class="required">*</span></label>
                        <select id="returnReason" class="form-control" required>
                            <option value="">請選擇退票原因</option>
                            <option value="customer_request">客戶要求</option>
                            <option value="ticket_damage">票券損壞</option>
                            <option value="print_error">印刷錯誤</option>
                            <option value="other">其他原因</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="returnNote">備註</label>
                        <textarea id="returnNote" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="returnAmount">退款金額</label>
                        <input type="number" id="returnAmount" class="form-control" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-button">確認退票</button>
                        <button type="button" class="secondary-button" onclick="closeModal()">取消</button>
                    </div>
                </form>
            </div>
        `;
        
        showModal(modalContent);
        
        // 綁定表單提交事件
        document.getElementById('returnTicketForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processReturnTicket();
        });

        // 綁定票號查詢事件
        document.getElementById('ticketNumber').addEventListener('blur', async (e) => {
            const number = e.target.value;
            const ticket = await this.findTicket(number);
            if (ticket) {
                document.getElementById('returnAmount').value = ticket.price;
            }
        });
    },

    // 處理退票邏輯
    async processReturnTicket() {
        try {
            const ticketNumber = document.getElementById('ticketNumber').value;
            const returnReason = document.getElementById('returnReason').value;
            const returnNote = document.getElementById('returnNote').value;
            const returnAmount = document.getElementById('returnAmount').value;

            const ticket = await this.findTicket(ticketNumber);
            
            if (!ticket) {
                throw new Error('找不到此票券');
            }
            
            if (ticket.status === 'used') {
                throw new Error('已使用的票券無法退票');
            }
            
            if (ticket.status === 'returned') {
                throw new Error('此票券已經退票');
            }

            // 更新票券狀態
            await this.updateTicketStatus(ticketNumber, 'returned', {
                returnReason,
                returnNote,
                returnAmount: parseFloat(returnAmount),
                returnDate: new Date().toISOString()
            });

            closeModal();
            showToast('退票登記完成');
            this.renderTickets();
            
        } catch (error) {
            console.error('退票處理失敗:', error);
            showToast(error.message || '退票處理失敗', 'error');
        }
    }
};

// 確保頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    window.ticketModule = {
        // ...existing code...
        
        // 顯示退票本登記視窗
        showReturnTicketBookModal() {
            const modalContent = `
                <div class="modal-header">
                    <h3>退票本登記</h3>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>票券類型</label>
                        <select id="returnTicketType" class="form-control">
                            <option value="HI">HI券</option>
                            <option value="VIP">暢遊券</option>
                            <option value="SPECIAL">優惠券</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>起始編號</label>
                        <input type="text" id="returnStartNumber" class="form-control" 
                               placeholder="請輸入7位數字" maxlength="7" pattern="\d{7}">
                    </div>
                    <div class="form-group">
                        <label>退票原因</label>
                        <select id="returnReason" class="form-control">
                            <option value="damage">票券損壞</option>
                            <option value="print_error">印刷錯誤</option>
                            <option value="other">其他原因</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>備註說明</label>
                        <textarea id="returnNote" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn cancel-btn" onclick="closeModal()">取消</button>
                    <button class="btn submit-btn" onclick="window.ticketModule.submitReturnTicketBook()">
                        確認退票
                    </button>
                </div>
            `;
            
            window.showModal(modalContent);
        },
        
        // 提交退票本
        async submitReturnTicketBook() {
            try {
                const type = document.getElementById('returnTicketType').value;
                const startNumber = document.getElementById('returnStartNumber').value;
                const reason = document.getElementById('returnReason').value;
                const note = document.getElementById('returnNote').value;
                
                if (!this.validateTicketNumber(startNumber)) {
                    throw new Error('無效的票號格式');
                }
                
                const returnBook = {
                    type,
                    startNumber,
                    count: 10,
                    numbers: this.generateTicketNumbers(startNumber, 10),
                    reason,
                    note,
                    returnDate: new Date().toISOString(),
                    status: 'returned'
                };
                
                await this.processReturnTicketBook(returnBook);
                window.showToast('退票本登記成功', 'success');
                closeModal();
                this.renderTickets();
                
            } catch (error) {
                console.error('退票登記失敗:', error);
                window.showToast(error.message, 'error');
            }
        },
        
        // 處理退票本
        async processReturnTicketBook(returnBook) {
            const tickets = await window.storageManager.getTickets();
            
            for (const number of returnBook.numbers) {
                const ticket = tickets.find(t => t.number === number);
                if (ticket) {
                    await this.updateTicketStatus(number, 'returned', {
                        returnReason: returnBook.reason,
                        returnNote: returnBook.note,
                        returnDate: returnBook.returnDate
                    });
                }
            }
            
            await window.storageManager.addReturnedBook(returnBook);
        }
        
        // ...existing code...
    };    window.ticketsModule.init();
});
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

    document.getElementById('refundTicketBtn').addEventListener('click', this.showRefundTicketModal);
}
showRefundTicketModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>登記退款</h3>
            <button onclick="closeModal()" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <form id="refundTicketForm">
                <div class="form-group">
                    <label for="ticketNumber">票券號碼 <span class="required">*</span></label>
                    <input type="text" id="ticketNumber" class="form-control" required>
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
                    <input type="number" id="refundAmount" class="form-control" required>
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

    document.getElementById('ticketNumber').addEventListener('blur', async (e) => {
        const number = e.target.value;
        const ticket = await this.findTicket(number);
        if (ticket) {
            document.getElementById('refundAmount').value = ticket.price;
        }
    });
}
async processRefundTicket() {
    try {
        const ticketNumber = document.getElementById('ticketNumber').value;
        const refundReason = document.getElementById('refundReason').value;
        const refundNote = document.getElementById('refundNote').value;
        const refundAmount = document.getElementById('refundAmount').value;

        const ticket = await this.findTicket(ticketNumber);
        
        if (!ticket) {
            throw new Error('找不到此票券');
        }
        
        if (ticket.status === 'used') {
            throw new Error('已使用的票券無法退款');
        }
        
        if (ticket.status === 'returned' || ticket.status === 'refunded') {
            throw new Error('此票券已經退票或退款');
        }

        await this.updateTicketStatus(ticketNumber, 'refunded', {
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
