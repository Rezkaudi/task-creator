import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();

    res.on('finish', () => {
        const duration = performance.now() - startTime;
        const status = res.statusCode;

        let durationStr: string;
        if (duration < 1000) {
            durationStr = `${duration.toFixed(0)}ms`;
        } else if (duration < 60000) {
            durationStr = `${(duration / 1000).toFixed(2)}s`;
        } else {
            const minutes = Math.floor(duration / 60000);
            const seconds = ((duration % 60000) / 1000).toFixed(1);
            durationStr = `${minutes}m ${seconds}s`;
        }

        console.log(`[${startTimestamp}] ${req.method} ${req.originalUrl} - ${status} (⏱️ ${durationStr})`);
    });

    next();
};