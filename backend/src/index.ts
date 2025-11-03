//src/index.ts
import * as dotenv from 'dotenv';
import { Server } from './infrastructure/web/server';
import { ENV_CONFIG } from './infrastructure/config/env.config';

dotenv.config();

const PORT = parseInt(ENV_CONFIG.PORT, 10);

async function bootstrap() {
    try {
        // Start server
        const server = new Server(PORT);
        await server.start();
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

bootstrap();
