window.HimanEvents = (function() {
  const storage = window.HimanStorage;
  const records = window.HimanRecords;

  return {
    // 初始化事件處理
    init() {
      if (!storage || !storage.isAvailable) {
        console.error('儲存模組未就緒');
        return;
      }
      if (!records) {
        console.error('記錄模組未就緒');
        return;
      }
      
      this.setupPageNavigation();
      this.setupRecordActions();
      this.setupPriceCalculation();
      console.log('事件模組初始化完成');
    },

    // 設置頁面導航
    setupPageNavigation() {
      document.querySelector('nav').addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          e.preventDefault();
          this.handleNavigation(e.target);
        }
      });
    },

    // 設置記錄相關操作
    setupRecordActions() {
      document.getElementById('recordsBody').addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const recordId = e.target.dataset.id;

        if (!action || !recordId) return;

        try {
          switch (action) {
            case 'tempLeave':
              HimanRecords.handleTemporaryLeave(recordId);
              break;
            case 'checkout':
              HimanRecords.handleCheckout(recordId);
              break;
            case 'changeLocker':
              HimanRecords.handleChangeLocker(recordId);
              break;
            case 'showCharge':
              HimanRecords.showChargeDetails(recordId);
              break;
          }
        } catch (error) {
          console.error(`Action ${action} failed:`, error);
          alert(`操作失敗：${error.message}`);
        }
      });
    },

    // 設置價格計算
    setupPriceCalculation() {
      const prices = {
        weekday: { regular: 500, evening: 350 },
        weekend: { regular: 700, evening: 500 },
        special: { sundayTowel: 350 }
      };

      const calculatePrice = (date = new Date()) => {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const isWeekend = [0, 5, 6].includes(date.getDay());
        const time = hour * 60 + minute;

        // 特殊時段判斷
        if (date.getDay() === 0 && time >= 13 * 60 + 30 && time < 15 * 60 + 30) {
          return {
            price: prices.special.sundayTowel,
            type: '週日毛巾優惠',
            endTime: '23:00'
          };
        }

        // 傍晚優惠時段
        if (time >= 18 * 60 + 30 && time < 19 * 60 + 30) {
          return {
            price: isWeekend ? prices.weekend.evening : prices.weekday.evening,
            type: '傍晚優惠',
            endTime: '次日06:00'
          };
        }

        // 一般時段
        return {
          price: isWeekend ? prices.weekend.regular : prices.weekday.regular,
          type: isWeekend ? '週末一般' : '平日一般',
          endTime: '24小時'
        };
      };

      // 自動更新價格顯示
      const updatePriceDisplay = () => {
        const priceInfo = calculatePrice();
        const display = document.getElementById('suggestedPrice');
        if (display) {
          display.textContent = `${priceInfo.type}價格：${priceInfo.price}元 (使用至${priceInfo.endTime})`;
        }
      };

      // 每分鐘更新價格
      setInterval(updatePriceDisplay, 60000);
      updatePriceDisplay(); // 初始顯示
    },

    // 處理頁面導航
    handleNavigation(target) {
      const targetId = target.getAttribute('href').substring(1);
      
      // 更新導航狀態
      document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
      });
      target.classList.add('active');

      // 更新顯示區段
      document.querySelectorAll('main > section').forEach(section => {
        section.style.display = section.id === targetId ? 'block' : 'none';
      });
    }
  };
})();

// 初始化
document.addEventListener('DOMContentLoaded', () => HimanEvents.init());
