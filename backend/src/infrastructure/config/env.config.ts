import dotenv from 'dotenv';
dotenv.config();

export const ENV_CONFIG = {
    // Ai Models  Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    HAMGINGFACE_API_KEY: process.env.HAMGINGFACE_API_KEY!,
    OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY!,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY!,
    POE_API_KEY: process.env.POE_API_KEY!,

    // Trello API Configuration
    TRELLO_API_BASE_URL: 'https://api.trello.com/1',
    TRELLO_API_KEY: process.env.TRELLO_API_KEY,
    TRELLO_TOKEN: process.env.TRELLO_TOKEN,
    TRELLO_BOARD_ID: process.env.TRELLO_BOARD_ID,

    // Database Configuration
    DATABASE_URL: process.env.DATABASE_URL,

    // Server Configuration
    PORT: process.env.PORT || "5000",
    NODE_ENV: process.env.NODE_ENV || 'development',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
    REDIRECT_URL: process.env.REDIRECT_URL || 'https://rio-app.design',

    // Google OAuth Configuration
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'rio-jwt-secret-change-in-production',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',

    // Stripe configuration
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || '',
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || '',
    STRIPE_PRICE_SUB_BASIC: process.env.STRIPE_PRICE_SUB_BASIC || '',
    STRIPE_PRICE_SUB_PREMIUM: process.env.STRIPE_PRICE_SUB_PREMIUM || '',

    // Points configuration
    POINTS_PER_DOLLAR: Number(process.env.POINTS_PER_DOLLAR || 500),
    MIN_PRE_FLIGHT_POINTS: Number(process.env.MIN_PRE_FLIGHT_POINTS || 100),

    // AWS S3 Configuration
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET!,
};
