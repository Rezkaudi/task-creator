import { CorsOptions } from 'cors';

export const allowedOrigins = [
  'https://www.figma.com',
  'https://figma.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://task-creator-app.vercel.app',
  'https://task-creator-api.vercel.app',
  'https://api.trello.com'
];

export const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    console.log('Request Origin:', origin); // للتشخيص
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS Error: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // للتأكد إن preflight يرجع 200
};