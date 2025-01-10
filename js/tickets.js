document.addEventListener('DOMContentLoaded', function() {
    initializeTicketSystem();
});

function initializeTicketSystem() {
    const ticketBody = document.getElementById('ticketBody');
    const addTicketBtn = document.getElementById('addTicketBtn');
    const addTicketModal = document.getElementById('addTicketModal');
    const searchInput = document.getElementById('ticketSearch');
    const searchBtn = document.getElementById('searchTicketBtn');

    if (!ticketBody || !addTicketBtn || !addTicketModal || !searchInput) {
        console.error('必要的票券管理元素未找到');
        return;
    }

    // 初始化時載入預設票券數據
    const defaultTickets = [
        { type: 'H', number: 'H12345678', amount: 500, status: 'active', createdAt: new Date().toISOString() },
        { type: 'M', number: 'M87654321', amount: 700, status: 'used', createdAt: new Date().toISOString() }
    ];

    // 立即渲染預設票券
    renderTickets(defaultTickets);

    // 綁定新增票券按鈕事件
    if (addTicketBtn) {
        addTicketBtn.addEventListener('click', () => {
            addTicketModal.style.display = 'block';
        });
    }

    // 綁定搜尋功能
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredTickets = defaultTickets.filter(ticket => 
                ticket.number.toLowerCase().includes(searchTerm)
            );
            renderTickets(filteredTickets);
        });
    }

    // 關閉模態框的點擊事件
    window.addEventListener('click', (event) => {
        if (event.target === addTicketModal) {
            closeModal();
        }
    });
}

function renderTickets(tickets) {
    const ticketBody = document.getElementById('ticketBody');
    if (!ticketBody) return;

    ticketBody.innerHTML = tickets.map(ticket => `
        <tr>
            <td>${getTicketTypeName(ticket.type)}</td>
            <td>${ticket.number}</td>
            <td>${ticket.amount}元</td>
            <td>${getStatusText(ticket.status)}</td>
            <td>${new Date(ticket.createdAt).toLocaleString('zh-TW')}</td>
            <td>
                <button class="btn btn-info" onclick="viewTicketDetails('${ticket.number}')">詳情</button>
                <button class="btn btn-warning" onclick="invalidateTicket('${ticket.number}')"
                    ${ticket.status !== 'active' ? 'disabled' : ''}>
                    作廢
                </button>
            </td>
        </tr>
    `).join('');
}

function getTicketTypeName(type) {
    const typeMap = {
        'H': '平日券',
        'M': '暢遊券',
        'P': '公關票',
        'S': '特殊節日',
        'L': '限量販售'
    };
    return typeMap[type] || '未知類型';
}

function getStatusText(status) {
    const statusMap = {
        'active': '有效',
        'used': '已使用',
        'invalid': '已作廢'
    };
    return statusMap[status] || status;
}

function viewTicketDetails(number) {
    alert(`查看票券 ${number} 的詳細資訊`);
}

function invalidateTicket(number) {
    if (confirm(`確定要作廢票券 ${number} 嗎？`)) {
        alert(`票券 ${number} 已作廢`);
        // 這裡可以添加實際的作廢邏輯
    }
}

function closeModal() {
    document.getElementById('addTicketModal').style.display = 'none';
}