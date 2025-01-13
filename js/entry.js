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

    // 修改入場記錄創建
    function createEntryRecord(data) {
        const record = {
            id: Date.now(),
            lockerNumber: data.lockerNumber,
            status: 'active',
            entryTime: new Date().toLocaleString('zh-TW'),
            amount: data.paymentType === 'cash' ? data.cashAmount : 0,
            paymentType: data.paymentType,
            ticketNumber: data.ticketNumber || null,
            remarks: data.remarks || ''
        };

        if (window.HimanRecords) {
            window.HimanRecords.addRecord(record);
        }
        
        return record;
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
        
        // 修改：置物櫃驗證邏輯
        if (!validateLockerNumber(entryData.lockerNumber)) {
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
        
        try {
            const record = createEntryRecord(entryData);
            this.reset();
            updateDateTime();
        } catch (error) {
            console.error('入場登記失敗:', error);
            alert('入場登記失敗，請重試');
        }
    });

    // 新增：頁面切換處理
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main > section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // 隱藏所有區段
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // 只顯示目標區段
            document.getElementById(targetId).style.display = 'block';
            
            // 移除所有active class
            navLinks.forEach(link => link.classList.remove('active'));
            // 添加active class到當前選中的連結
            this.classList.add('active');
        });
    });

    // 預設顯示第一個區段，隱藏其他
    sections.forEach((section, index) => {
        section.style.display = index === 0 ? 'block' : 'none';
    });

    // 初始化
    updateDateTime();
    
    function handleTempLeave(event) {
        // 實作臨時離開的邏輯
        console.log('Handling temporary leave');
    }

    function showChargeDetails(event) {
        // 實作顯示收費詳情的邏輯
        console.log('Showing charge details');
    }
});

(function() {
  // 等待 DOM 完全載入
  document.addEventListener('DOMContentLoaded', function() {
    // 獲取元素前先檢查
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main > section');
    
    if (!navLinks.length || !sections.length) {
      console.warn('Navigation elements not found');
      return;
    }

    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          sections.forEach(section => section.style.display = 'none');
          targetSection.style.display = 'block';
          
          navLinks.forEach(link => link.classList.remove('active'));
          this.classList.add('active');
        }
      });
    });
  });
})();

window.addEventListener('DOMContentLoaded', function() {
    // 取得元素
    const paymentTypeInputs = document.getElementsByName('paymentType');
    const cashPaymentDiv = document.getElementById('cashPayment');
    const ticketPaymentDiv = document.getElementById('ticketPayment');

    // 付款方式切換處理
    paymentTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'cash') {
                cashPaymentDiv.style.display = 'block';
                ticketPaymentDiv.style.display = 'none';
            } else if (this.value === 'ticket') {
                cashPaymentDiv.style.display = 'none';
                ticketPaymentDiv.style.display = 'block';
            }
        });
    });
});