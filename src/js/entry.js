document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('entryForm');
    const cashPaymentDiv = document.getElementById('cashPayment');
    const ticketPaymentDiv = document.getElementById('ticketPayment');
    const cashAmountInput = document.getElementById('cashAmount');
    const suggestedPriceSpan = document.getElementById('suggestedPrice');
    const lockerNumberInput = document.getElementById('lockerNumber');
    const paymentTypeRadios = document.getElementsByName('paymentType');

    // 優惠時段價格計算邏輯
    function calculatePrice(date) {
        const day = date.getDay(); // 0-6, 0是週日
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const time = hours * 60 + minutes;

        // 計算結束時間
        function calculateEndTime(date, hours, endTimeStr) {
            const end = new Date(date);
            if (endTimeStr === "23:00") {
                end.setHours(23, 0, 0);
            } else if (endTimeStr === "次日06:00") {
                end.setDate(end.getDate() + 1);
                end.setHours(6, 0, 0);
            } else {
                end.setHours(end.getHours() + hours);
            }
            return end;
        }

        // 特殊時段判斷
        const isEveningTime = time >= 18 * 60 + 30 && time < 19 * 60 + 30;
        const isSundayTowelTime = day === 0 && time >= 13 * 60 + 30 && time < 15 * 60 + 30;
        const isWeekend = day === 0 || day === 5 || day === 6;

        // 價格和結束時間判斷
        if (isSundayTowelTime) {
            const endTime = calculateEndTime(date, 0, "23:00");
            return { 
                price: 350, 
                endTime: endTime,
                type: "小毛巾之夜",
                duration: "使用至 23:00"
            };
        }
        if (isEveningTime) {
            const endTime = calculateEndTime(date, 0, "次日06:00");
            return {
                price: isWeekend ? 500 : 350,
                endTime: endTime,
                type: "晚間優惠",
                duration: "使用至次日 06:00"
            };
        }
        
        const endTime = calculateEndTime(date, 24, "");
        return {
            price: isWeekend ? 700 : 500,
            endTime: endTime,
            type: isWeekend ? "假日價格" : "平日價格",
            duration: "24小時"
        };
    }

    function getTimeSlotDescription(date) {
        const day = date.getDay();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const time = hours * 60 + minutes;
        
        const isWeekend = day === 0 || day === 5 || day === 6;
        const isEveningDiscount = time >= 18 * 60 + 30 && time < 19 * 60 + 30;
        const isSundayTowelNight = day === 0 && time >= 13 * 60 + 30 && time < 15 * 60 + 30;
        
        let description = '';
        if (isSundayTowelNight) {
            description = '週日毛巾優惠時段 (13:30-15:30) - 優惠價350元';
        } else if (isEveningDiscount) {
            description = '傍晚優惠時段 (18:30-19:30) - ' + (isWeekend ? '週末優惠價500元' : '平日優惠價350元');
        } else {
            description = isWeekend ? '週末時段 - 一般價700元' : '平日時段 - 一般價500元';
        }
        return description;
    }

    function updateDateTime() {
        const now = new Date();
        const dateTimeStr = now.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // 更新時間顯示
        const timeDisplay = document.getElementById('currentDateTime');
        if (timeDisplay) {
            timeDisplay.textContent = dateTimeStr;
        }
        
        // 計算並更新價格
        const priceInfo = calculatePrice(now);
        if (suggestedPriceSpan) {
            suggestedPriceSpan.textContent = `${priceInfo.type} - ${priceInfo.price}元
使用期限: ${priceInfo.duration}
結束時間: ${priceInfo.endTime.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`;
        }

        // 如果是現金支付，更新金額
        if (document.querySelector('input[name="paymentType"]:checked')?.value === 'cash' && cashAmountInput) {
            cashAmountInput.value = priceInfo.price;
        }
    }

    // 每秒更新時間顯示
    setInterval(updateDateTime, 1000);
    updateDateTime(); // 初始化顯示

    // 修改付款方式切換處理
    paymentTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const isTicket = this.value === 'ticket';
            if (cashPaymentDiv) cashPaymentDiv.style.display = isTicket ? 'none' : 'block';
            if (ticketPaymentDiv) ticketPaymentDiv.style.display = isTicket ? 'block' : 'none';
            
            if (isTicket) {
                const ticketInput = document.getElementById('ticketNumber');
                if (ticketInput) {
                    ticketInput.value = '';
                    ticketInput.focus();
                }
            } else {
                const now = new Date();
                const priceInfo = calculatePrice(now);
                if (cashAmountInput) {
                    cashAmountInput.value = priceInfo.price;
                }
            }
        });
    });

    // 檢查置物櫃號碼
    function validateLockerNumber(number) {
        return number >= 1 && number <= 500;
    }

    // 票券驗證和處理
    function validateTicket(ticketNumber) {
        if (!ticketNumber) {
            alert('請輸入票券號碼');
            return false;
        }
        
        const ticketPattern = /^[HM]\d+$/;
        if (!ticketPattern.test(ticketNumber)) {
            alert('票券格式不正確。H開頭為平日券，M開頭為暢遊券，後接數字');
            return false;
        }

        if (ticketNumber.startsWith('H')) {
            const currentDay = new Date().getDay();
            if (currentDay >= 5 || currentDay === 0) {
                alert('平日券（H開頭）只能在週一至週四使用！');
                return false;
            }
        }

        return true;
    }

    // 修改：創建入場記錄行
    function createEntryRecord(data) {
        const now = new Date();
        const priceInfo = calculatePrice(now);
        const record = {
            lockerNumber: data.lockerNumber,
            status: 'active',
            entryTime: now.toLocaleString('zh-TW'),
            tempLeaveTime: null,
            returnTime: null,
            endTime: priceInfo.endTime,
            paymentInfo: data.paymentType === 'cash' ? 
                        `現金：${data.cashAmount}元` : 
                        `票券：${data.ticketNumber}`,
            remarks: data.remarks || ''
        };

        // 保存到本地存儲
        const records = JSON.parse(localStorage.getItem('himanRecords') || '[]');
        records.push(record);
        localStorage.setItem('himanRecords', JSON.stringify(records));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.lockerNumber}</td>
            <td><span class="status-badge active">使用中</span></td>
            <td>${record.entryTime}</td>
            <td>-</td>
            <td>-</td>
            <td data-end-time="${priceInfo.endTime.getTime()}">${calculateTimeRemaining(priceInfo.endTime)}</td>
            <td>${record.paymentInfo}</td>
            <td>
                <button class="btn btn-primary" onclick="handleTemporaryLeave(this)">暫離</button>
                <button class="btn btn-danger" onclick="handleCheckout(this)">結束</button>
            </td>
        `;
        return tr;
    }

    // 新增：計算剩餘時間
    function calculateTimeRemaining(endTime) {
        const now = new Date();
        const remaining = endTime - now;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}小時${minutes}分鐘`;
    }

    // 表單提交處理
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const entryData = Object.fromEntries(formData.entries());
        
        // 置物櫃驗證
        const lockerNumber = parseInt(entryData.lockerNumber);
        if (!validateLockerNumber(lockerNumber)) {
            alert('請輸入有效的置物櫃號碼 (1-500)');
            return;
        }

        // 票券驗證
        if (entryData.paymentType === 'ticket') {
            const ticketNumber = entryData.ticketNumber;
            if (!validateTicket(ticketNumber)) {
                return;
            }
        }
        
        // 新增記錄到表格
        const recordsBody = document.getElementById('recordsBody');
        if (recordsBody) {
            const newRecord = createEntryRecord(entryData);
            recordsBody.insertBefore(newRecord, recordsBody.firstChild);
        }

        console.log('入場資料:', entryData);
        alert('登記成功，記得給毛巾！');
        this.reset();
        updateDateTime();
    });

    // 初始化
    updateDateTime();
});