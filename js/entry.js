/**
 * HiMAN三溫暖入場系統：技術與藝術的交響樂章
 * 
 * 在科技發展的浩瀚領域中，每一行程式碼都是一次精心的藝術創作。
 * 我們不僅僅是在編寫功能，更是在雕琢一個優雅且智能的使用體驗。
 * 
 * @version 1.0.0
 * @author HiMAN技術團隊
 * @description 智能入場管理系統，融合精準科技與人性化服務
 */

// 使用 IIFE 避免全域污染
(function() {
    // 檢查是否已存在
    if (window.EntrySystem) {
        console.warn('EntrySystem 已經被定義');
        return;
    }

    class EntrySystem {
        constructor() {
            this.initializeSystem();
            this.attachEventListeners();
        }

        // 入場系統初始化：如同樂隊調音，確保每個模組協調運作
        initializeSystem() {
            this.state = {
                lockerNumber: '',
                paymentType: 'cash',
                amount: this.calculateIntelligentPrice(),
                specialTimeDiscount: this.detectSpecialTimeSlot()
            };

            // 動態繫結關鍵 DOM 元素
            this.elements = {
                lockerInput: document.querySelector('#lockerNumber'),
                paymentRadios: document.querySelectorAll('input[name="paymentType"]'),
                priceDisplay: document.querySelector('#currentPrice'),
                discountAlert: document.querySelector('#discountAlert')
            };
        }

        // 智能定價：如同一位精通市場的交易專家
        calculateIntelligentPrice() {
            const now = new Date();
            const day = now.getDay();
            const hour = now.getHours();
            const minute = now.getMinutes();

            // 週末邏輯
            const isWeekend = [0, 5, 6].includes(day);
            
            // 晚間優惠時段：18:30 - 19:30
            const isEveningDiscount = 
                (hour === 18 && minute >= 30) || 
                (hour === 19 && minute <= 30);

            // 多維度定價策略
            if (isEveningDiscount) {
                return isWeekend ? 500 : 350;  // 優惠時段
            }
            return isWeekend ? 700 : 500;  // 標準時段
        }

        // 偵測特殊時段：如同靈敏的感知雷達
        detectSpecialTimeSlot() {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();

            return (hour === 18 && minute >= 30) || 
                   (hour === 19 && minute <= 30)
                ? {
                    description: '晚間優惠時段',
                    maxStayTime: '隔日06:00',
                    discountRate: 30
                }
                : null;
        }

        // 更新價格顯示：如同即時看板
        updatePriceDisplay() {
            const price = this.calculateIntelligentPrice();
            const specialTime = this.detectSpecialTimeSlot();

            this.elements.priceDisplay.innerHTML = `
                <div class="price-info">
                    <span>目前收費：NT$ ${price}</span>
                    ${specialTime 
                        ? `<div class="special-time-badge">
                            ${specialTime.description} 
                            (使用至${specialTime.maxStayTime})
                           </div>` 
                        : ''}
                </div>
            `;
        }

        // 高級表單驗證：如同嚴謹的守門員
        validateEntry() {
            const validations = [
                { 
                    condition: !this.state.lockerNumber, 
                    message: '請選擇櫃位號碼' 
                },
                { 
                    condition: this.state.paymentType === 'cash' && !this.state.amount, 
                    message: '請確認付款金額' 
                }
            ];

            const failedValidation = validations.find(v => v.condition);
            return failedValidation 
                ? { valid: false, message: failedValidation.message }
                : { valid: true };
        }

        // 提交入場：如同精密的資料處理中心
        async submitEntry() {
            const validation = this.validateEntry();
            if (!validation.valid) {
                this.showNotification(validation.message, 'error');
                return;
            }

            try {
                const entryData = {
                    lockerNumber: this.state.lockerNumber,
                    amount: this.state.amount,
                    paymentType: this.state.paymentType,
                    entryTime: new Date().toISOString(),
                    specialTimeSlot: this.state.specialTimeDiscount
                };

                await this.saveEntryRecord(entryData);
                this.showNotification('入場登記成功', 'success');
                this.resetForm();
            } catch (error) {
                this.showNotification('登記失敗：' + error.message, 'error');
            }
        }
    }

    // 票券管理輔助物件
    const TicketManager = {
        types: {
            'HI': { name: 'HI平日卷', basePrice: 200, validDays: [1,2,3,4,5] },
            'MAN': { name: 'MAN暢遊卷', basePrice: 250, validDays: [0,5,6] },
        },

        validateTicket(ticketNumber) {
            const prefix = ticketNumber.slice(0, 3);
            const ticketType = this.types[prefix];
            
            if (!ticketType) return { valid: false, message: '無效的票券' };

            const today = new Date().getDay();
            if (!ticketType.validDays.includes(today)) {
                return { 
                    valid: false, 
                    message: `此票券僅在${ticketType.validDays.join('、')}可用` 
                };
            }

            return { valid: true, type: ticketType };
        }
    };

    // 將 EntrySystem 註冊到全域
    window.EntrySystem = EntrySystem;
})();