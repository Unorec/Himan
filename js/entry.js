import { showToast, showModal } from './ui.js';
import { lockerManager } from './lockers.js';
import { CONFIG } from './config.js';

// 時段費用設定
const timeSlotPrices = {
    weekdayNight: {
        name: '平日夜間優惠',
        hours: 10.5,
        price: 350,
        startTime: '18:30',
        endTime: '06:00',
        days: [1, 2, 3, 4], // 週一到週四
        description: '平日夜間特惠價'
    },
    morning: {
        name: '早鳥時段',
        hours: 3,
        price: 200,
        startTime: '06:00',
        endTime: '12:00',
        description: '早上優惠價'
    },
    afternoon: {
        name: '午間時段',
        hours: 4,
        price: 300,
        startTime: '12:00',
        endTime: '18:00',
        description: '標準時段'
    }
};

const ticketTypes = {
    regular: { name: '平日券', hours: 3, description: '一般平日使用' },
    holiday: { name: '假日券', hours: 4, description: '週末假日使用' },
    night: { name: '夜間券', hours: 10, description: '夜間包段使用' },
    vip: { name: 'VIP券', hours: 24, description: '不限時使用' }
};

export async function loadSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    const entryHTML = `
        <div class="card">
            <div class="card-header">
                <h2>入場登記</h2>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="lockerNumber">櫃位號碼</label>
                    <input type="number" id="lockerNumber" class="form-control" 
                           min="1" max="500" required>
                </div>
                
                <div class="form-group">
                    <label>付款方式</label>
                    <div class="payment-type">
                        <label class="radio-button">
                            <input type="radio" name="paymentType" value="cash" checked>
                            <span>現金</span>
                        </label>
                        <label class="radio-button">
                            <input type="radio" name="paymentType" value="ticket">
                            <span>票券</span>
                        </label>
                    </div>
                </div>

                <!-- 現金付款區塊 -->
                <div id="cashPayment">
                    <div class="form-group">
                        <label>時段選擇</label>
                        <div class="time-slots">
                            ${Object.entries(timeSlotPrices).map(([key, slot]) => `
                                <div class="time-slot-card" data-slot="${key}">
                                    <div class="slot-header">${slot.name}</div>
                                    <div class="slot-time">${slot.startTime} - ${slot.endTime}</div>
                                    <div class="slot-price">$${slot.price}</div>
                                    <div class="slot-hours">${slot.hours}小時</div>
                                    <div class="slot-description">${slot.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 票券付款區塊 -->
                <div id="ticketPayment" style="display: none;">
                    <div class="form-group">
                        <label for="ticketType">票券類型</label>
                        <select id="ticketType" class="form-control">
                            ${Object.entries(ticketTypes).map(([key, type]) => `
                                <option value="${key}">${type.name} (${type.hours}小時) - ${type.description}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ticketNumber">票券號碼</label>
                        <input type="text" id="ticketNumber" class="form-control" 
                               placeholder="請輸入票券號碼">
                    </div>
                </div>

                <div class="form-group">
                    <label for="remarks">備註</label>
                    <textarea id="remarks" class="form-control" rows="2"></textarea>
                </div>

                <button onclick="handleEntrySubmit()" class="primary-button">
                    確認登記
                </button>
            </div>
        </div>
    `;

    mainContent.innerHTML = entryHTML;
    initializeEvents();
}

function initializeEvents() {
    // 付款方式切換
    document.querySelectorAll('input[name="paymentType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isCash = e.target.value === 'cash';
            document.getElementById('cashPayment').style.display = isCash ? 'block' : 'none';
            document.getElementById('ticketPayment').style.display = isCash ? 'none' : 'block';
        });
    });

    // 時段選擇
    document.querySelectorAll('.time-slot-card').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('.time-slot-card').forEach(c => 
                c.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
        });
    });

    // 櫃位驗證
    const lockerInput = document.getElementById('lockerNumber');
    if (lockerInput) {
        lockerInput.addEventListener('change', validateLockerNumber);
    }
}

async function handleEntrySubmit() {
    try {
        if (!validateLockerNumber()) return;

        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        const formData = {
            lockerNumber: parseInt(document.getElementById('lockerNumber').value),
            paymentType,
            entryTime: new Date().toISOString(),
            remarks: document.getElementById('remarks').value,
            status: 'active'
        };

        if (paymentType === 'cash') {
            const selectedSlot = document.querySelector('.time-slot-card.selected');
            if (!selectedSlot) {
                showToast('請選擇時段', 'error');
                return;
            }
            const slotKey = selectedSlot.dataset.slot;
            Object.assign(formData, {
                slotKey,
                price: timeSlotPrices[slotKey].price,
                hours: timeSlotPrices[slotKey].hours,
                expectedEndTime: calculateEndTime(timeSlotPrices[slotKey].hours)
            });
        } else {
            const ticketType = document.getElementById('ticketType').value;
            const ticketNumber = document.getElementById('ticketNumber').value;
            if (!ticketNumber) {
                showToast('請輸入票券號碼', 'error');
                return;
            }
            Object.assign(formData, {
                ticketType,
                ticketNumber,
                hours: ticketTypes[ticketType].hours,
                expectedEndTime: calculateEndTime(ticketTypes[ticketType].hours)
            });
        }

        if (lockerManager.occupyLocker(formData.lockerNumber, formData)) {
            showToast('入場登記成功', 'success');
            resetForm();
        } else {
            throw new Error('櫃位登記失敗');
        }
    } catch (error) {
        console.error('Entry error:', error);
        showToast('入場登記失敗', 'error');
    }
}

function calculateEndTime(hours) {
    const now = new Date();
    return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function resetForm() {
    document.getElementById('lockerNumber').value = '';
    document.getElementById('remarks').value = '';
    document.querySelectorAll('.time-slot-card').forEach(card => 
        card.classList.remove('selected'));
    document.querySelector('input[name="paymentType"][value="cash"]').checked = true;
    document.getElementById('cashPayment').style.display = 'block';
    document.getElementById('ticketPayment').style.display = 'none';
    if (document.getElementById('ticketNumber')) {
        document.getElementById('ticketNumber').value = '';
    }
}

// 檢查是否超時
function checkOvertime(entryTime, expectedEndTime) {
    const now = new Date();
    const end = new Date(expectedEndTime);
    if (now > end) {
        showModal(`
            <div class="overtime-warning">
                <h3>使用超時提醒</h3>
                <p>已超過預定使用時間</p>
                <p>是否加收費用？</p>
                <div class="modal-actions">
                    <button onclick="handleOvertimeCharge()" class="primary-button">
                        確認加收
                    </button>
                    <button onclick="closeModal()" class="secondary-button">
                        稍後處理
                    </button>
                </div>
            </div>
        `);
        return true;
    }
    return false;
}

// 驗證櫃位號碼
function validateLockerNumber() {
    const lockerNumber = document.getElementById('lockerNumber').value;
    const maxLockers = 500;
    
    if (!lockerNumber || isNaN(lockerNumber) || 
        lockerNumber < 1 || lockerNumber > maxLockers) {
        showToast('請輸入有效的櫃位號碼 (1-500)', 'error');
        return false;
    }

    if (lockerManager.checkLocker(parseInt(lockerNumber))) {
        showToast('此櫃位已被使用', 'error');
        return false;
    }

    return true;
}

// 表單驗證
function validateEntryForm(formData) {
    if (!formData.lockerNumber || formData.lockerNumber < 1 || formData.lockerNumber > 500) {
        throw new Error('無效的櫃位號碼');
    }

    if (formData.paymentType === 'ticket' && !formData.ticketNumber) {
        throw new Error('請輸入票券號碼');
    }

    if (formData.paymentType === 'cash' && !formData.slotKey) {
        throw new Error('請選擇時段');
    }

    return true;
}

// 處理超時費用
async function handleOvertimeCharge(recordId) {
    // 超時費用邏輯實作
    showToast('正在處理超時費用...');
    // ...實作超時費用計算和處理...
}

window.handleEntrySubmit = handleEntrySubmit;
window.handleOvertimeCharge = handleOvertimeCharge;

export default {
    loadSection,
    checkOvertime
};