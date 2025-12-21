import dotenv from 'dotenv';
dotenv.config();

export const ENV_CONFIG = {
    // OpenAI API Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',

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

    DATABASE_URL: process.env.DATABASE_URL,


    MODELS: {
        // paid
        GPT4O: {
            name: "gpt-4o",
            maxTokens: 16384,
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://api.openai.com/v1"
        },
        CLAUDE_SONNET_4_20250514: {
            name: "claude-sonnet-4-20250514",
            maxTokens: 64000,
            apiKey: process.env.CLAUDE_API_KEY,
            baseURL: "https://api.anthropic.com/v1"
        },

        // free
        GEMINI_2_5_FLASH: {
            name: "gemini-2.5-flash",
            maxTokens: 128000,
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/models"
        },
        DEEPSEEK_AI_DEEPSEEK_V3_2_NOVITA: {
            name: "deepseek-ai/DeepSeek-V3.2:novita",
            maxTokens: 64000,
            apiKey: process.env.HAMGINGFACE_API_KEY,
            baseURL: "https://router.huggingface.co/v1"
        },
        QWEN_2_5_7B_INSTRUCT: {
            name: "Qwen/Qwen2.5-7B-Instruct",
            maxTokens: 128000,
            apiKey: process.env.HAMGINGFACE_API_KEY,
            baseURL: "https://router.huggingface.co/v1"
        }

    }
};
