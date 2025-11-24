import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { corsOptions } from '../src/infrastructure/config/cors.config';

import taskRoutes from '../src/infrastructure/web/routes/task.routes';
import trelloRoutes from '../src/infrastructure/web/routes/trello.routes';
import designRoutes from '../src/infrastructure/web/routes/design.routes';

import { setupDependencies } from '../src/infrastructure/web/dependencies';

const app: Application = express();
const container = setupDependencies();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Task Creator API is running on Vercel',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/tasks', taskRoutes(container.taskController));
app.use('/api/trello', trelloRoutes(container.trelloController));
app.use('/api/designs', designRoutes(container.designController));

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

export default app;