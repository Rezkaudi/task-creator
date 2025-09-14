import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// import dotenv from 'dotenv';
import "dotenv/config";
import taskRoutes from './routes/taskRoutes';
import { ENV_CONFIG } from './config/env.config';
import { corsOptions } from './config/cors.config';


const app = express();

// Middleware

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
    res.send('Task Creator API is running');
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), key: ENV_CONFIG.OPENAI_API_KEY });
});

// Routes
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

const PORT = ENV_CONFIG.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



