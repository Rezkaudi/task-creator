import { CorsOptions } from 'cors';

export const allowedOrigins = [
    'http://localhost:5197',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://localhost:5000',
    'https://task-creator-app.vercel.app',
    'https://task-creator-api.onrender.com',
    "https://api.trello.com",
    // Allow Figma plugin (null origin for plugins)
    'null'
];

export const corsOptions: CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
