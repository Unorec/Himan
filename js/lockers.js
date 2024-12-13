export class LockerManager {
    constructor() {
        this.lockers = new Map();
    }

    checkLocker(lockerId) {
        return this.lockers.get(lockerId) || false;
    }

    occupyLocker(lockerId, customerInfo) {
        if (!this.checkLocker(lockerId)) {
            this.lockers.set(lockerId, customerInfo);
            return true;
        }
        return false;
    }

    releaseLocker(lockerId) {
        if (this.checkLocker(lockerId)) {
            this.lockers.delete(lockerId);
            return true;
        }
        return false;
    }

    getLockerStatus() {
        return Object.fromEntries(this.lockers);
    }
}

export const lockerManager = new LockerManager();
