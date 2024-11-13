// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化客人管理器
    const customerManager = new CustomerManager();
    
    // 更新時間顯示
    function updateCurrentTime() {
        const currentTime = document.getElementById('currentTime');
        const now = new Date();
        currentTime.textContent = formatTime(now);
    }
    
    // 每秒更新時間
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // 更新置物櫃顯示
    function updateLockerGrid() {
        const grid = document.getElementById('lockerGrid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= 50; i++) {
            const locker = document.createElement('div');
            const isOccupied = customerManager.isLockerOccupied(i);
            
            locker.className = `locker-item ${isOccupied ? 'locker-occupied' : 'locker-available'}`;
            locker.textContent = i;
            
            if (!isOccupied) {
                locker.onclick = () => selectLocker(i);
            }
            
            grid.appendChild(locker);
        }
    }

    // 選擇置物櫃
    function selectLocker(number) {
        document.getElementById('lockerNumber').value = number;
        hideLockerSelector();
    }

    // 處理入場表單提交
    document.getElementById('checkInForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        try {
            const formData = {
                lockerNumber: parseInt(document.getElementById('lockerNumber').value),
                paymentType: document.getElementById('paymentType').value,
                cashAmount: document.getElementById('cashAmount')?.value,
                ticketNumber: document.getElementById('ticketNumber')?.value,
                notes: document.getElementById('notes').value
            };

            customerManager.addCustomer(formData);
            this.reset();
            updateDisplay();
            alert('入場登記成功！');
        } catch (error) {
            alert(error.message);
        }
    });

    // 處理付款方式變更
    document.getElementById('paymentType').addEventListener('change', function() {
        updatePaymentFields(this.value);
    });

    // 更新付款欄位顯示
    function updatePaymentFields(paymentType) {
        const paymentFields = document.getElementById('paymentFields');
        
        if (paymentType === 'cash') {
            paymentFields.innerHTML = `
                <div class="form-group">
                    <label class="form-label">現金金額 <span class="text-red-500">*</span></label>
                    <input type="number" id="cashAmount" class="form-input" required>
                </div>
            `;
        } else {
            paymentFields.innerHTML = `
                <div class="form-group">
                    <label class="form-label">票券號碼 <span class="text-red-500">*</span></label>
                    <input type="text" id="ticketNumber" class="form-input" required>
                </div>
            `;
        }
    }

    // 更新顯示
    function updateDisplay() {
        updateLockerGrid();
        updateCustomerList();
        updateActiveCount();
    }

    // 更新客人列表
    function updateCustomerList() {
        const customers = customerManager.getActiveCustomers();
        
        // 清空現有列表
        document.getElementById('overtimeCustomers').innerHTML = '';
        document.getElementById('warningCustomers').innerHTML = '';
        document.getElementById('normalCustomers').innerHTML = '';
        
        // 分類客人
        customers.forEach(customer => {
            const card = createCustomerCard(customer);
            
            if (customer.isOvertime) {
                document.getElementById('overtimeCustomers').appendChild(card);
            } else if (customer.isNearingEnd) {
                document.getElementById('warningCustomers').appendChild(card);
            } else {
                document.getElementById('normalCustomers').appendChild(card);
            }
        });
    }

    // 創建客人卡片
    function createCustomerCard(customer) {
        const card = document.createElement('div');
        card.className = `customer-card ${customer.isOvertime ? 'customer-overtime' : 
                                        customer.isNearingEnd ? 'customer-warning' : ''}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-lg font-bold">櫃號: ${customer.lockerNumber}</div>
                    <div class="text-sm text-gray-600">
                        <div>入場時間: ${formatTime(customer.checkInTime)}</div>
                        <div>已使用: ${formatDuration(customer.hours)}</div>
                        <div>付款方式: ${
                            customer.paymentType === 'cash' ? 
                            `現金 ${customer.cashAmount}元` : 
                            `${customer.paymentType === 'weekdayTicket' ? '平日券' : '假日券'} (${customer.ticketNumber})`
                        }</div>
                        ${customer.overtime ? `<div class="text-red-500">超時費用: ${customer.overtimeFee}元</div>` : ''}
                        ${customer.notes ? `<div class="mt-2 text-gray-500">備註: ${customer.notes}</div>` : ''}
                    </div>
                </div>
                <button 
                    onclick="handleCheckOut('${customer.id}')"
                    class="btn btn-danger"
                >
                    結帳
                </button>
            </div>
        `;
        
        return card;
    }

    // 更新在場人數
    function updateActiveCount() {
        const count = customerManager.getActiveCustomers().length;
        document.getElementById('activeCount').textContent = `在場: ${count}人`;
    }

    // 初始化顯示
    updateDisplay();
    
    // 定期更新顯示（每分鐘）
    setInterval(updateDisplay, 60000);
});

document.addEventListener('DOMContentLoaded', function() {
    // ... 現有的代碼 ...
    
    // 綁定快速操作按鈕
    const quickActions = document.querySelector('.grid.grid-cols-2.gap-4');
    quickActions.addEventListener('click', function(e) {
        if (e.target.textContent.trim() === '入場登記') {
            showCheckInForm();
        }
    });

    // 顯示入場登記表單
    function showCheckInForm() {
        const checkInForm = document.getElementById('checkInForm');
        checkInForm.classList.remove('hidden');
    }

    // 可選：添加關閉表單的功能
    function hideCheckInForm() {
        const checkInForm = document.getElementById('checkInForm');
        checkInForm.classList.add('hidden');
    }
});
