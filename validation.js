const Validation = {
    ticketNumber: function(number) {
        const patterns = {
            H: /^H\d{8}$/,  // 平日券
            M: /^M\d{8}$/,  // 暢遊券
            P: /^P\d{8}$/,  // 公關票
            S: /^S\d{8}$/,  // 特殊節日
            L: /^L\d{8}$/   // 限量票
        };
        
        const type = number.charAt(0);
        return patterns[type]?.test(number) || false;
    },
    
    lockerNumber: function(number) {
        return /^[A-E][0-9]{3}$/.test(number);
    }
};
