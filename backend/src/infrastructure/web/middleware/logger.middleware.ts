import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
    const start = new Date().toISOString();

    res.on('finish', () => {
        const status = res.statusCode;
        console.log(`[${start}] ${req.method} ${req.originalUrl} - ${status}`);
    });

    next();
};
