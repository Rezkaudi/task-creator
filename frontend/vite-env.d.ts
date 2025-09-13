/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_TRELLO_API_KEY?: string;
    readonly VITE_TRELLO_TOKEN?: string;
    readonly VITE_TRELLO_BOARD_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}