import dotenv from 'dotenv';
dotenv.config();

export const ENV_CONFIG = {

    // OpenAI API Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'o3',

    // Trello API Configuration
    TRELLO_API_BASE_URL: 'https://api.trello.com/1',
    TRELLO_API_KEY: process.env.TRELLO_API_KEY,
    TRELLO_TOKEN: process.env.TRELLO_TOKEN,
    TRELLO_BOARD_ID: process.env.TRELLO_BOARD_ID,
    // TRELLO_LIST_ID: process.env.TRELLO_LIST_ID,

    // Server Configuration
    PORT: process.env.PORT || "5000",
    NODE_ENV: process.env.NODE_ENV
}