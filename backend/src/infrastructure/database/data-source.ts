import { DataSource } from "typeorm";
import { ENV_CONFIG } from "../config/env.config";


export const AppDataSource = new DataSource({
    type: 'postgres',
    url: ENV_CONFIG.DATABASE_URL,
    synchronize: false,
    logging: ENV_CONFIG.NODE_ENV === 'development',
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    subscribers: [],
    // ssl: {
    //   rejectUnauthorized: false,
    // },
});

export const initializeDatabase = async (): Promise<DataSource> => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ Database connection established");
        }
        return AppDataSource;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        throw error;
    }
};
