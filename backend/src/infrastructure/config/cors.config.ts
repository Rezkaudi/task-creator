import { CorsOptions } from 'cors';

export const allowedOrigins = [
    'http://localhost:5175',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'https://task-creator-app.vercel.app',
    'https://task-creator-api.vercel.app',
    "https://api.trello.com"
];

export const corsOptions: CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        console.log('Incoming request origin:', origin);

        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(null, true);
    },
    credentials: true
};
