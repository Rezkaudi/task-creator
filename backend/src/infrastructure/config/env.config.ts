import dotenv from 'dotenv';
dotenv.config();

export const ENV_CONFIG = {
    // Ai Models  Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    HAMGINGFACE_API_KEY: process.env.HAMGINGFACE_API_KEY!,
    OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY!,

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
};
