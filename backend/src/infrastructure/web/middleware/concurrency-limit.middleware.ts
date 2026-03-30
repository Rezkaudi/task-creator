import { Request, Response, NextFunction } from 'express';

const MAX_CONCURRENT = 2;
// const SLOT_TTL_MS = 5 * 60 * 1000; // 5 minutes — auto-release stuck slots

interface Slot {
    count: number;
    lastUpdated: number;
}

const activeRequests = new Map<string, Slot>();

// // Cleanup stale slots every minute
// setInterval(() => {
//     const now = Date.now();
//     for (const [userId, slot] of activeRequests) {
//         if (now - slot.lastUpdated > SLOT_TTL_MS) {
//             activeRequests.delete(userId);
//         }
//     }
// }, 60 * 1000);

function getSlot(userId: string): Slot {
    let slot = activeRequests.get(userId);
    if (!slot) {
        slot = { count: 0, lastUpdated: Date.now() };
        activeRequests.set(userId, slot);
    }
    return slot;
}

function release(userId: string): void {
    const slot = activeRequests.get(userId);
    if (!slot) return;
    slot.count = Math.max(0, slot.count - 1);
    slot.lastUpdated = Date.now();
    if (slot.count === 0) {
        activeRequests.delete(userId);
    }
}

export function aiConcurrencyLimiter(req: Request, res: Response, next: NextFunction): void {
    const userId: string | undefined = (req as any).user?.id?.toString();

    if (!userId) {
        next();
        return;
    }

    const slot = getSlot(userId);

    if (slot.count >= MAX_CONCURRENT) {
        res.status(429).json({
            success: false,
            message: `You already have ${MAX_CONCURRENT} AI requests in progress. Please wait for one to finish.`,
        });
        return;
    }

    slot.count++;
    slot.lastUpdated = Date.now();

    // Release the slot when the response finishes (success, error, or client disconnect)
    res.on('finish', () => release(userId));
    res.on('close', () => release(userId));

    next();
}
