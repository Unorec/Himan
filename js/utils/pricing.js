const PRICES = {
    regular: {
        weekday: 500,
        weekend: 700
    },
    special: {
        weekday: 350,
        weekend: 500
    }
};

export function calculatePrice(date = new Date()) {
    try {
        const hour = date.getHours();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isSpecialTime = (hour >= 18 && hour < 20);

        const priceType = isSpecialTime ? 'special' : 'regular';
        const dayType = isWeekend ? 'weekend' : 'weekday';

        return PRICES[priceType][dayType];
    } catch (error) {
        console.error('價格計算錯誤:', error);
        return PRICES.regular.weekday; // 返回預設價格
    }
}

export function handleFormSubmit(formData) {
    const price = calculatePrice();
    return {
        ...formData,
        calculatedPrice: price,
        timestamp: new Date().toISOString()
    };
}

export function validateTicketPrice(ticketType, price) {
    const validPrices = {
        'HI': [500, 700],
        'MAN': [250, 350],
        'FUN': [180, 250]
    };
    
    return validPrices[ticketType]?.includes(price) || false;
}
