import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// import dotenv from 'dotenv';
import "dotenv/config";
import taskRoutes from './routes/taskRoutes';
import { ENV_CONFIG } from './env.config';


export function createServer() {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString(), key: ENV_CONFIG.OPENAI_API_KEY });
    });

    // Routes
    app.use('/api/tasks', taskRoutes);

    // // Error handling middleware
    // app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    //     console.error('Error:', err);
    //     res.status(500).json({
    //         success: false,
    //         message: err.message || 'Internal server error',
    //     });
    // });

    // // 404 handler
    // app.use((_req: Request, res: Response) => {
    //     res.status(404).json({
    //         success: false,
    //         message: 'Route not found',
    //     });
    // });

    return app;
}


