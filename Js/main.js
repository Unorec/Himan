document.addEventListener('DOMContentLoaded', function() {
    // 初始化客人管理器
    const customerManager = new CustomerManager();
    
    // 取得DOM元素
    const form = document.getElementById('checkInForm');
    const paymentType = document.getElementById('paymentType');
    const cashAmountField = document.getElementById('cashAmountField');
    const ticketField = document.getElementById('ticketField');
    const customerList = document.getElementById('customerList');
    const currentTime = document.getElementById('currentTime');
    
    // 更新現在時間
    function updateCurrentTime() {
        const now = new Date();
        currentTime.textContent = formatTime(now);
    }
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // 付款方式切換處理
    paymentType.addEventListener('change', function() {
        if (this.value === 'cash') {
            cashAmountField.classList.remove('hidden');
            ticketField.classList.add('hidden');
            document.getElementById('cashAmount').required = true;
            document.getElementById('ticketNumber').required = false;
        } else {
            cashAmountField.classList.add('hidden');
            ticketField.classList.remove('hidden');
            document.getElementById('cashAmount').required = false;
            document.getElementById('ticketNumber').required = true;
        }
    });

    // 處理入場表單提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        try {
            const formData = {
                lockerNumber: parseInt(document.getElementById('lockerNumber').value),
                paymentType: document.getElementById('paymentType').value,
                cashAmount: document.getElementById('paymentType').value === 'cash' ? 
                    parseInt(document.getElementById('cashAmount').value) : null,
                ticketNumber: document.getElementById('paymentType').value !== 'cash' ? 
                    document.getElementById('ticketNumber').value : null,
                notes: document.getElementById('notes').value
            };

            // 驗證表單
            const errors = validateForm(formData);
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }

            // 新增客人
            customerManager.addCustomer(formData);
            
            // 重置表單
            form.reset();
            
            // 更新顯示
            updateCustomerList();
            
            alert('入場登記成功！');
        } catch (error) {
            alert(error.message);
        }
    });

    // 結帳處理
    window.handleCheckOut = function(customerId) {
        try {
            const result = customerManager.checkOutCustomer(customerId);
            
            alert(`
                結帳明細：
                置物櫃號碼：${result.customer.lockerNumber}
                使用時間：${formatDuration(result.hours)}
                基本費用：${result.customer.paymentType === 'cash' ? 
                    `${result.customer.cashAmount}元` : '使用票券'}
                超時費用：${result.fees.overtimeFee}元
                應收總額：${result.fees.total}元
            `);

            updateCustomerList();
        } catch (error) {
            alert(error.message);
        }
    };

    // 更新客人列表顯示
    function updateCustomerList() {
        const activeCustomers = customerManager.getActiveCustomers();
        customerList.innerHTML = '';
        
        activeCustomers.forEach(customer => {
            const div = document.createElement('div');
            div.className = `customer-card p-4 border rounded ${
                customer.isOvertime ? 'overtime' : 
                customer.isNearingEnd ? 'warning' : ''
            }`;
            
            div.innerHTML = `
                <div class="flex justify-between">
                    <div>
                        <div class="font-bold">櫃號: ${customer.lockerNumber}</div>
                        <div class="text-sm text-gray-600">
                            <div>入場時間: ${formatTime(customer.checkInTime)}</div>
                            <div>已使用: ${formatDuration(customer.hours)}</div>
                            <div>
                                付款方式: ${customer.paymentType === 'cash' ? 
                                    `現金 ${customer.cashAmount}元` : 
                                    `${customer.paymentType === 'weekdayTicket' ? '平日券' : '假日券'} (${customer.ticketNumber})`}
                            </div>
                            ${customer.isOvertime ? 
                                `<div class="text-red-500">超時費用: ${customer.fees.overtimeFee}元</div>` : ''}
                            ${customer.notes ? `<div>備註: ${customer.notes}</div>` : ''}
                        </div>
                    </div>
                    <button 
                        onclick="handleCheckOut('${customer.id}')"
                        class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        結帳
                    </button>
                </div>
            `;
            
            customerList.appendChild(div);
        });

        // 更新標題
        updateTitle(activeCustomers.length);
    }

    // 初始顯示
    updateCustomerList();
    
    // 定期更新顯示（每分鐘）
    setInterval(updateCustomerList, 60000);
});
