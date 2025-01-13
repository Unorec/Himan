window.HimanRecords = (function() {
  const storage = window.HimanStorage;
  const RECORDS_KEY = 'himanRecords';
  
  return {
    records: [],

    init() {
      if (!storage || !storage.isAvailable) {
        console.error('儲存模組未就緒');
        return;
      }
      this.loadRecords();
      this.setupEventListeners();
      this.setupGlobalClickHandler(); // 新增這行
    },

    loadRecords() {
      const savedRecords = storage.getData(RECORDS_KEY) || [];
      this.records = savedRecords;
      this.updateUI();
    },

    setupEventListeners() {
      // 監聽搜尋輸入
      const searchInput = document.getElementById('lockerSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterRecords(e.target.value);
        });
      }

      // 監聽篩選按鈕
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const status = e.target.dataset.filter;
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.filterByStatus(status);
        });
      });

      // 更新：監聽額外費用相關按鈕
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.dataset.action === 'addCharge') {
          const formData = {
            amount: prompt('請輸入要增加的費用金額：'),
            item: prompt('請輸入費用項目：'),
            reason: prompt('請輸入收費原因：')
          };

          if (formData.amount && !isNaN(formData.amount) && 
              formData.item && formData.reason) {
            const fullDescription = `${formData.item}\n原因：${formData.reason}`;
            this.addExtraCharge(target.dataset.id, formData.amount, fullDescription);
          }
        } else if (target.dataset.action === 'addOvertime') {
          const formData = {
            amount: prompt('請輸入超時費用金額：'),
            reason: prompt('請輸入超時原因：') || '超過24小時'
          };

          if (formData.amount && !isNaN(formData.amount)) {
            const fullDescription = `超時費用\n原因：${formData.reason}`;
            this.addExtraCharge(target.dataset.id, formData.amount, fullDescription);
          }
        }
      });
    },

    // 新增：篩選記錄功能
    filterRecords(searchValue) {
      const recordsBody = document.getElementById('recordsBody');
      if (!recordsBody) return;

      const filteredRecords = this.records.filter(record => {
        const lockerNumber = record.lockerNumber.toString();
        return lockerNumber.includes(searchValue);
      });

      recordsBody.innerHTML = filteredRecords
        .map(record => this.createRecordRow(record))
        .join('');
    },

    // 新增：依狀態篩選功能
    filterByStatus(status) {
      const recordsBody = document.getElementById('recordsBody');
      if (!recordsBody) return;

      let filteredRecords = this.records;

      switch(status) {
        case 'all':
          // 顯示所有記錄
          break;
        case 'active':
          filteredRecords = this.records.filter(r => r.status === 'active');
          break;
        case 'expiring':
          // 篩選即將到期的記錄（使用超過20小時）
          const now = new Date();
          filteredRecords = this.records.filter(r => {
            if (r.status !== 'active') return false;
            const entryTime = new Date(r.entryTime);
            const hoursElapsed = (now - entryTime) / (1000 * 60 * 60);
            return hoursElapsed >= 20;
          });
          break;
        case 'temporary':
          filteredRecords = this.records.filter(r => r.status === 'temporary_leave');
          break;
      }

      recordsBody.innerHTML = filteredRecords
        .map(record => this.createRecordRow(record))
        .join('');
    },

    // 處理暫時離開 - 簡化版本
    handleTemporaryLeave(recordId) {
      const record = this.records.find(r => r.id === recordId);
      if (record) {
        record.status = 'temporary_leave';
        record.leaveTime = new Date().toISOString();
        this.updateRecord(record);
        this.updateUI();
      }
    },

    // 處理結帳
    handleCheckout(recordId) {
      const record = this.records.find(r => r.id === recordId);
      if (!record) throw new Error('找不到指定記錄');

      record.status = 'completed';
      record.checkoutTime = new Date().toISOString();
      this.calculateFinalCharge(record);
      this.updateRecord(record);
      this.updateUI();
    },

    // 處理更換櫃位
    handleChangeLocker(recordId) {
      const record = this.records.find(r => r.id === recordId);
      if (!record) throw new Error('找不到指定記錄');

      const newLocker = prompt('請輸入新的櫃位號碼：');
      if (!newLocker || isNaN(newLocker) || newLocker < 1 || newLocker > 500) {
        throw new Error('無效的櫃位號碼');
      }

      record.lockerNumber = parseInt(newLocker);
      this.updateRecord(record);
      this.updateUI();
    },

    // 顯示收費詳情
    showChargeDetails(recordId) {
      const record = this.records.find(r => r.id === recordId);
      if (!record) throw new Error('找不到指定記錄');

      const details = this.calculateChargeDetails(record);
      alert(`收費詳情：\n${details}`);
    },

    // 新增記錄
    addRecord(recordData) {
      if (!recordData || !recordData.lockerNumber) {
        throw new Error('無效的記錄資料');
      }

      // 檢查櫃位是否已被使用
      if (this.isLockerInUse(recordData.lockerNumber)) {
        throw new Error('該櫃位已在使用中');
      }

      const newRecord = {
        id: this.generateRecordId(),
        lockerNumber: recordData.lockerNumber,
        entryTime: new Date().toISOString(),
        paymentType: recordData.paymentType,
        amount: recordData.amount,
        ticketNumber: recordData.ticketNumber,
        remarks: recordData.remarks,
        status: 'active'
      };

      this.records.push(newRecord);
      this.saveRecords();
      this.updateUI();
      
      return newRecord;
    },

    // 生成記錄ID
    generateRecordId() {
      return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 檢查櫃位是否使用中
    isLockerInUse(lockerNumber) {
      return this.records.some(record => 
        record.lockerNumber === lockerNumber && 
        ['active', 'temporary_leave'].includes(record.status)
      );
    },

    // 其他輔助方法...
    updateRecord(record) {
      const index = this.records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        this.records[index] = record;
        this.saveRecords();
      }
    },

    saveRecords() {
      return storage.saveData(RECORDS_KEY, this.records);
    },

    updateUI() {
      const recordsBody = document.getElementById('recordsBody');
      if (!recordsBody) return;

      recordsBody.innerHTML = this.records
        .filter(record => record.status !== 'completed')
        .map(record => this.createRecordRow(record))
        .join('');
    },

    createRecordRow(record) {
      const status = this.getStatusDisplay(record.status);
      const timeDisplay = this.formatTime(record.entryTime);
      const remainingTime = this.calculateRemainingTime(record);
      const paymentInfo = this.formatPaymentInfo(record);
      const isOvertime = this.checkOvertime(record);

      return `
        <tr data-id="${record.id}">
          <td>${record.lockerNumber}</td>
          <td>
            <button class="status-btn ${record.status}" onclick="HimanRecords.toggleStatus('${record.id}')">
              ${status}
            </button>
          </td>
          <td>${timeDisplay}</td>
          <td class="payment-info ${isOvertime ? 'overtime' : ''}" 
              onclick="HimanRecords.showChargeDetails('${record.id}')">
            ${paymentInfo}
            ${isOvertime ? '<span class="overtime-badge">已超時</span>' : ''}
          </td>
          <td>${remainingTime}</td>
          <td class="action-cell">
            <button class="checkout-btn" onclick="HimanRecords.confirmCheckout('${record.id}')"
                    title="結帳">💰</button>
            <div class="action-dropdown">
              <button class="action-dropdown-btn" onclick="HimanRecords.toggleDropdown(event, '${record.id}')">
                操作
              </button>
              <div class="action-dropdown-content" id="dropdown-${record.id}">
                <button data-action="addCharge" data-id="${record.id}">
                  增加費用
                </button>
                <button data-action="addOvertime" data-id="${record.id}">
                  加收超時費
                </button>
                <button data-action="changeLocker" data-id="${record.id}">
                  更換櫃位
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    },

    // 新增：狀態切換功能
    toggleStatus(recordId) {
      const record = this.records.find(r => r.id === recordId);
      if (!record) return;

      if (record.status === 'active') {
        record.status = 'temporary_leave';
        record.leaveTime = new Date().toISOString();
      } else if (record.status === 'temporary_leave') {
        record.status = 'active';
        record.returnTime = new Date().toISOString();
      }

      this.updateRecord(record);
      this.updateUI();
    },

    getStatusDisplay(status) {
      const statusMap = {
        active: '使用中',
        temporary_leave: '外出中',
        completed: '已結束'
      };
      return statusMap[status] || status;
    },

    formatTime(timeString) {
      return new Date(timeString).toLocaleString('zh-TW');
    },

    formatPaymentInfo(record) {
      let info = record.paymentType === 'ticket' 
        ? `票券：${record.ticketNumber}` 
        : `現金：${record.amount}元`;

      if (record.extraCharges && record.extraCharges.length > 0) {
        const totalExtra = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
        info += ` (+${totalExtra}元)`;
      }

      return info;
    },

    // 更新：計算剩餘時間
    calculateRemainingTime(record) {
      if (record.status === 'completed') return '已結束';
      
      const entryTime = new Date(record.entryTime);
      const timeSlot = this.calculateTimeSlot(entryTime);
      const now = new Date();
      const endTime = timeSlot.endTime;
      
      // 如果已超過結束時間，顯示超時
      if (now > endTime) {
        const overtimeHours = Math.floor((now - endTime) / (1000 * 60 * 60));
        return `超時 ${overtimeHours} 小時`;
      }
      
      // 否則顯示剩餘時間
      const remainingHours = Math.ceil((endTime - now) / (1000 * 60 * 60));
      return `剩餘 ${remainingHours} 小時`;
    },

    // 新增下拉選單切換功能
    toggleDropdown(event, recordId) {
      event.stopPropagation();
      const dropdowns = document.querySelectorAll('.action-dropdown-content');
      dropdowns.forEach(d => {
        if (d.id !== `dropdown-${recordId}`) {
          d.classList.remove('show');
        }
      });
      const dropdown = document.getElementById(`dropdown-${recordId}`);
      dropdown.classList.toggle('show');
    },

    // 新增：全域點擊事件處理，點擊其他地方時關閉下拉選單
    setupGlobalClickHandler() {
      document.addEventListener('click', (e) => {
        if (!e.target.matches('.action-dropdown-btn')) {
          const dropdowns = document.querySelectorAll('.action-dropdown-content');
          dropdowns.forEach(dropdown => {
            if (dropdown.classList.contains('show')) {
              dropdown.classList.remove('show');
            }
          });
        }
      });
    },

    // 新增：確認結帳
    confirmCheckout(recordId) {
      const record = this.records.find(r => r.id === recordId);
      if (!record) return;

      const isOvertime = this.checkOvertime(record);
      let message = '確定要結帳嗎？\n';
      
      if (isOvertime) {
        message += '注意：此客人已超時，建議加收超時費用。\n';
        message += '是否繼續結帳？';
      }

      if (confirm(message)) {
        this.handleCheckout(recordId);
      }
    },

    // 更新：檢查是否超時
    checkOvertime(record) {
      const now = new Date();
      const timeSlot = this.calculateTimeSlot(record.entryTime);
      return now > timeSlot.endTime;
    },

    // 新增：增加額外費用
    addExtraCharge(recordId, amount, description) {
      const record = this.records.find(r => r.id === recordId);
      if (!record) return;

      if (!record.extraCharges) {
        record.extraCharges = [];
      }

      record.extraCharges.push({
        amount: Number(amount),
        description,
        time: new Date().toISOString()
      });

      this.updateRecord(record);
      this.updateUI();
    },

    // 更新：費用明細計算
    calculateChargeDetails(record) {
      const timeSlot = this.calculateTimeSlot(record.entryTime);
      const now = new Date();
      const isOvertime = this.checkOvertime(record);
      
      let details = `【基本資訊】\n`;
      details += `入場時間：${this.formatTime(record.entryTime)}\n`;
      details += `時段類型：${timeSlot.type}\n`;
      details += `使用期限：${timeSlot.description}\n`;
      details += `結束時間：${this.formatTime(timeSlot.endTime)}\n`;
      details += `基本費用：${record.amount}元\n`;

      if (isOvertime) {
        const overtimeHours = Math.floor((now - timeSlot.endTime) / (1000 * 60 * 60));
        details += `\n【超時提醒】\n`;
        details += `已超時 ${overtimeHours} 小時，建議加收超時費用\n`;
      }

      if (record.extraCharges && record.extraCharges.length > 0) {
        details += `\n【額外費用】\n`;
        record.extraCharges.forEach(charge => {
          details += `${charge.description}: ${charge.amount}元 (${this.formatTime(charge.time)})\n`;
        });
      }

      if (record.remarks) {
        details += `\n【備註內容】\n${record.remarks}\n`;
      }

      if (record.leaveTime || record.returnTime) {
        details += `\n【外出記錄】\n`;
        if (record.leaveTime) {
          details += `外出時間：${this.formatTime(record.leaveTime)}\n`;
        }
        if (record.returnTime) {
          details += `返回時間：${this.formatTime(record.returnTime)}\n`;
        }
      }
      
      return details;
    },

    calculateFinalCharge(record) {
      // 基本費用計算邏輯
      const entryTime = new Date(record.entryTime);
      const checkoutTime = new Date(record.checkoutTime);
      const hours = Math.ceil((checkoutTime - entryTime) / (1000 * 60 * 60));
      
      record.finalCharge = record.amount;
      return record.finalCharge;
    },

    // 新增：計算使用時段
    calculateTimeSlot(entryTime) {
      const date = new Date(entryTime);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const time = hours * 60 + minutes;
      const day = date.getDay();

      // 複製日期以計算結束時間
      const endTime = new Date(date);
      
      // 判斷時段
      if (day === 0 && time >= 13 * 60 + 30 && time < 15 * 60 + 30) {
        // 週日毛巾優惠時段 (13:30-15:30)
        endTime.setHours(23, 0, 0);
        return {
          type: '週日毛巾優惠',
          endTime: endTime,
          price: 350,
          description: '使用至 23:00'
        };
      } else if (time >= 18 * 60 + 30 && time < 19 * 60 + 30) {
        // 傍晚優惠時段 (18:30-19:30)
        endTime.setDate(endTime.getDate() + 1);
        endTime.setHours(6, 0, 0);
        return {
          type: '傍晚優惠',
          endTime: endTime,
          price: day === 0 || day === 5 || day === 6 ? 500 : 350,
          description: '使用至次日 06:00'
        };
      } else {
        // 一般時段
        endTime.setDate(endTime.getDate() + 1);
        endTime.setHours(hours, minutes, 0);
        return {
          type: day === 0 || day === 5 || day === 6 ? '週末一般' : '平日一般',
          endTime: endTime,
          price: day === 0 || day === 5 || day === 6 ? 700 : 500,
          description: '24小時使用'
        };
      }
    }
  };
})();

// 初始化
document.addEventListener('DOMContentLoaded', () => HimanRecords.init());

HimanRecords.addRecord({
    lockerNumber: 123,
    paymentType: 'ticket',
    ticketNumber: 'H123456',
    remarks: '備註內容'
});