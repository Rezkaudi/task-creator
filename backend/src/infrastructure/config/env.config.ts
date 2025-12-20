import dotenv from 'dotenv';
dotenv.config();

export const ENV_CONFIG = {
    // OpenAI API Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'o3',

    CLOUDE_API_KEY: process.env.CLAUDE_API,
    CLOUDE_MODEL: process.env.MODEL_CLAUDE || 'claude-sonnet-4-20250514',

    // Trello API Configuration
    TRELLO_API_BASE_URL: 'https://api.trello.com/1',
    TRELLO_API_KEY: process.env.TRELLO_API_KEY,
    TRELLO_TOKEN: process.env.TRELLO_TOKEN,
    TRELLO_BOARD_ID: process.env.TRELLO_BOARD_ID,

    // PostgreSQL Configuration
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
    POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
    POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'design_versions_db',

    // Server Configuration
    PORT: process.env.PORT || "5000",
    NODE_ENV: process.env.NODE_ENV || 'development',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',

    DATABASE_URL: process.env.DATABASE_URL
};
