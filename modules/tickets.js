class TicketsModule extends window.HimanSystem.Module {
    constructor() {
        super();
        this.ticketTypes = {
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
        };
    }

    async moduleSetup() {
        this.storage = this.getModule('storage');
        this.toast = this.getModule('toast');
        this.modal = this.getModule('modal');
        await this.bindElements();
        await this.bindEvents();
        await this.renderTickets();
    }

    async bindElements() {
        const addTicketBtn = document.getElementById('addTicketBtn');
        if (addTicketBtn) {
            addTicketBtn.addEventListener('click', () => this.showAddTicketModal());
        }
    }

    async bindEvents() {
        this.on('ticket:added', () => this.renderTickets());
        this.on('ticket:returned', () => this.renderTickets());
    }

    async renderTickets() {
        const tickets = await this.storage.getItems(/^ticket_/);
        const ticketsList = document.querySelector('.tickets-list');
        if (!ticketsList) return;

        const stats = this.calculateTicketStats(tickets);
        this.renderTicketStats(ticketsList, stats);
    }

    calculateTicketStats(tickets) {
        return {
            total: tickets.length,
            used: tickets.filter(t => t.status === 'used').length,
            returned: tickets.filter(t => t.status === 'returned').length,
            unused: tickets.filter(t => t.status === 'active').length
        };
    }

    async addTicket(ticketData) {
        try {
            await this.validateTicketData(ticketData);
            const tickets = this.generateTickets(ticketData);
            await Promise.all(tickets.map(ticket => 
                this.storage.setItem(`ticket_${ticket.id}`, ticket)
            ));
            this.emit('ticket:added', { count: tickets.length });
            return tickets;
        } catch (error) {
            this.emit('ticket:error', error);
            throw error;
        }
    }

    async validateTicketData(data) {
        if (!data.type || !this.ticketTypes[data.type]) {
            throw new Error('無效的票券類型');
        }
        if (!/^\d+$/.test(data.startNumber)) {
            throw new Error('起始號碼必須為數字');
        }
    }

    async processReturn(returnData) {
        try {
            const ticket = await this.findTicket(returnData.number);
            if (!ticket) {
                throw new Error('找不到此票券');
            }
            if (ticket.status !== 'active') {
                throw new Error('此票券狀態不允許退票');
            }

            await this.updateTicketStatus(ticket.id, 'returned', returnData);
            this.emit('ticket:returned', { ticket });
        } catch (error) {
            this.emit('ticket:return_error', error);
            throw error;
        }
    }
}

// 註冊模組
window.HimanSystem.core.registerModule('tickets', new TicketsModule());